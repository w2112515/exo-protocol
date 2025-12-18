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
    sandbox_config: Optional[SandboxConfig] = None
) -> CommitResult:
    """
    执行 Skill 并提交结果
    
    流程:
    1. 调用 sandbox 执行 skill
    2. 计算结果哈希
    3. 调用 DA 存储结果
    4. 返回 CommitResult (供链上提交使用)
    
    Args:
        order_id: 订单 ID
        skill_package: Skill 包配置
        input_data: 输入数据
        sandbox_config: 沙盒配置 (可选)
        
    Returns:
        CommitResult: 提交结果数据结构
    """
    start_time = time.perf_counter()
    
    try:
        # 1. 调用 sandbox 执行 skill (同步调用)
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
        )
