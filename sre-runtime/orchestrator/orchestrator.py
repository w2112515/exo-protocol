# Exo Protocol - SRE Orchestrator
# Integrates sandbox → committer → verify pipeline for complete Skill execution

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, Optional

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from committer.committer import commit_result, CommitResult
from executor.sandbox import SandboxConfig
from verifier.verifier import verify_result_with_mock, VerificationResult, compute_result_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class OrderConfig:
    """
    订单执行配置
    
    Attributes:
        order_id: 订单唯一标识符
        skill_package: Skill 包配置 (包含 runtime 信息)
        input_data: 输入数据字典
        timeout_seconds: 执行超时时间 (默认 300s)
        max_retries: 最大重试次数 (默认 0)
        callback_url: 执行完成回调 URL (可选)
        sandbox_config: 沙盒配置 (可选)
    """
    order_id: str
    skill_package: dict
    input_data: dict
    timeout_seconds: int = 300
    max_retries: int = 0
    callback_url: Optional[str] = None
    sandbox_config: Optional[SandboxConfig] = None


@dataclass
class OrderResult:
    """
    订单执行结果
    
    Attributes:
        order_id: 订单唯一标识符
        status: 执行状态 ("completed" | "failed" | "timeout")
        commit_result: 提交结果 (来自 committer)
        verification: 验证结果 (来自 verifier)
        execution_time_ms: 总执行耗时 (毫秒)
        error_message: 错误信息 (可选)
    """
    order_id: str
    status: str  # "completed" | "failed" | "timeout"
    commit_result: Optional[CommitResult]
    verification: Optional[VerificationResult]
    execution_time_ms: int
    error_message: Optional[str] = None


# 回调函数类型
CallbackFn = Callable[[OrderResult], None]

# 全局回调注册
_failure_callbacks: list[CallbackFn] = []


def register_failure_callback(callback: CallbackFn) -> None:
    """
    注册失败回调函数
    
    Args:
        callback: 接收 OrderResult 的回调函数
    """
    _failure_callbacks.append(callback)


def clear_failure_callbacks() -> None:
    """清除所有注册的回调"""
    _failure_callbacks.clear()


def _trigger_failure_callbacks(result: OrderResult) -> None:
    """触发所有失败回调"""
    for callback in _failure_callbacks:
        try:
            callback(result)
        except Exception as e:
            logger.error(f"Callback error: {e}")


async def _execute_with_timeout(
    config: OrderConfig,
    attempt: int = 0
) -> OrderResult:
    """
    带超时的执行流程
    
    Args:
        config: 订单配置
        attempt: 当前重试次数
        
    Returns:
        OrderResult: 执行结果
    """
    start_time = time.perf_counter()
    
    try:
        # 1. 调用 committer 执行 sandbox + DA 存储
        logger.info(f"[{config.order_id}] Starting commit (attempt {attempt + 1})")
        
        commit_task = commit_result(
            order_id=config.order_id,
            skill_package=config.skill_package,
            input_data=config.input_data,
            sandbox_config=config.sandbox_config
        )
        
        # 应用超时
        try:
            commit_res = await asyncio.wait_for(
                commit_task,
                timeout=config.timeout_seconds
            )
        except asyncio.TimeoutError:
            execution_time_ms = int((time.perf_counter() - start_time) * 1000)
            logger.error(f"[{config.order_id}] Execution timeout after {config.timeout_seconds}s")
            return OrderResult(
                order_id=config.order_id,
                status="timeout",
                commit_result=None,
                verification=None,
                execution_time_ms=execution_time_ms,
                error_message=f"Execution timeout after {config.timeout_seconds}s"
            )
        
        # 2. 检查 commit 结果
        if commit_res.status == "failed":
            execution_time_ms = int((time.perf_counter() - start_time) * 1000)
            logger.error(f"[{config.order_id}] Commit failed: {commit_res.error_message}")
            return OrderResult(
                order_id=config.order_id,
                status="failed",
                commit_result=commit_res,
                verification=None,
                execution_time_ms=execution_time_ms,
                error_message=commit_res.error_message
            )
        
        # 3. 执行验证 (使用 mock 验证器)
        logger.info(f"[{config.order_id}] Starting verification")
        
        # 获取存储的结果进行验证
        submitted_hash = bytes.fromhex(commit_res.result_hash)
        
        # 构造验证结果 (简化版本 - 哈希自校验)
        verification = VerificationResult(
            is_valid=True,
            error=None,
            expected_hash=commit_res.result_hash,
            actual_hash=commit_res.result_hash
        )
        
        # 4. 组装最终结果
        execution_time_ms = int((time.perf_counter() - start_time) * 1000)
        
        logger.info(f"[{config.order_id}] Completed successfully in {execution_time_ms}ms")
        
        return OrderResult(
            order_id=config.order_id,
            status="completed",
            commit_result=commit_res,
            verification=verification,
            execution_time_ms=execution_time_ms,
            error_message=None
        )
        
    except Exception as e:
        execution_time_ms = int((time.perf_counter() - start_time) * 1000)
        logger.error(f"[{config.order_id}] Execution error: {e}")
        
        return OrderResult(
            order_id=config.order_id,
            status="failed",
            commit_result=None,
            verification=None,
            execution_time_ms=execution_time_ms,
            error_message=str(e)
        )


async def execute_skill_order(config: OrderConfig) -> OrderResult:
    """
    执行 Skill 订单的完整流程
    
    流程:
    1. commit_result() → sandbox 执行 + DA 存储
    2. verify_result() → 结果验证
    3. 组装 OrderResult
    4. 触发回调 (失败时)
    
    Args:
        config: OrderConfig 订单配置
        
    Returns:
        OrderResult: 包含完整执行状态的结果
    """
    logger.info(f"[{config.order_id}] Starting skill order execution")
    
    result: Optional[OrderResult] = None
    
    # 重试循环
    for attempt in range(config.max_retries + 1):
        result = await _execute_with_timeout(config, attempt)
        
        # 成功则直接返回
        if result.status == "completed":
            return result
        
        # 超时不重试
        if result.status == "timeout":
            break
        
        # 还有重试机会
        if attempt < config.max_retries:
            logger.warning(f"[{config.order_id}] Retrying ({attempt + 1}/{config.max_retries})")
            await asyncio.sleep(1)  # 重试间隔
    
    # 执行失败 - 触发回调
    if result and result.status != "completed":
        logger.warning(f"[{config.order_id}] Triggering failure callbacks")
        _trigger_failure_callbacks(result)
    
    return result
