# Exo Protocol - Result Committer
# Integrates sandbox execution with DA storage for on-chain submission

import hashlib
import json
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from executor.sandbox import execute_in_sandbox, SandboxConfig
from da.storage import store_result


@dataclass
class CommitResult:
    """提交结果数据结构"""
    order_id: str
    result_uri: str
    result_hash: str
    execution_time_ms: int
    status: str  # "success" | "failed"
    error_message: Optional[str] = None
    execution_mode: str = "sandbox"  # "sandbox" | "ai"
    model_used: Optional[str] = None
    tokens_used: int = 0


def compute_result_hash(result: Dict[str, Any]) -> str:
    """
    计算结果的 SHA256 哈希
    
    Args:
        result: 执行结果字典
        
    Returns:
        SHA256 哈希值 (hex string)
    """
    # 使用 sort_keys=True 保证确定性
    serialized = json.dumps(result, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


async def commit_result(
    order_id: str,
    skill_package: dict,
    input_data: dict,
    execution_mode: str = "sandbox",  # "sandbox" | "ai"
    sandbox_config: Optional[SandboxConfig] = None
) -> CommitResult:
    """
    执行 Skill 并提交结果
    
    流程:
    1. 根据 execution_mode 选择执行方式 (sandbox 或 ai)
    2. 计算结果哈希
    3. 调用 DA 存储结果
    4. 返回 CommitResult (供链上提交使用)
    
    Args:
        order_id: 订单 ID
        skill_package: Skill 包配置
        input_data: 输入数据
        execution_mode: 执行模式 "sandbox" 或 "ai"
        sandbox_config: 沙盒配置 (仅 sandbox 模式)
        
    Returns:
        CommitResult: 提交结果数据结构
    """
    start_time = time.perf_counter()
    model_used = None
    tokens_used = 0
    
    try:
        # 1. 根据模式选择执行方式
        if execution_mode == "ai":
            from executor.ai_executor import AIExecutor
            executor = AIExecutor()
            ai_result = await executor.execute_skill(skill_package, input_data)
            await executor.close()
            
            if not ai_result.success:
                raise RuntimeError(ai_result.error_message or "AI execution failed")
            
            result = ai_result.output
            model_used = ai_result.model_used
            tokens_used = ai_result.tokens_used
        else:
            # 默认使用 sandbox 模式
            result = execute_in_sandbox(skill_package, input_data, sandbox_config)
        
        # 2. 计算结果哈希
        result_hash = compute_result_hash(result)
        
        # 3. 调用 DA 存储结果 (异步调用)
        result_uri = await store_result(result, order_id)
        
        # 4. 计算执行耗时
        execution_time_ms = int((time.perf_counter() - start_time) * 1000)
        
        return CommitResult(
            order_id=order_id,
            result_uri=result_uri,
            result_hash=result_hash,
            execution_time_ms=execution_time_ms,
            status="success",
            error_message=None,
            execution_mode=execution_mode,
            model_used=model_used,
            tokens_used=tokens_used,
        )
        
    except Exception as e:
        # 执行失败时返回 status="failed"
        execution_time_ms = int((time.perf_counter() - start_time) * 1000)
        
        return CommitResult(
            order_id=order_id,
            result_uri="",
            result_hash="",
            execution_time_ms=execution_time_ms,
            status="failed",
            error_message=str(e),
            execution_mode=execution_mode,
            model_used=model_used,
            tokens_used=tokens_used,
        )
