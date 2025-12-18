"""
Exo Protocol - Docker Sandbox Executor

安全隔离执行 Skill 任务的 Docker 沙盒模块。
"""

import docker
import json
from dataclasses import dataclass
from typing import Any, Optional


@dataclass
class SandboxConfig:
    """沙盒配置参数"""
    mem_limit: str = "512m"
    cpu_period: int = 100000
    cpu_quota: int = 50000  # 50% CPU
    timeout_seconds: int = 30
    network_disabled: bool = True


def validate_input(input_data: dict) -> None:
    """
    验证输入数据安全性
    
    Args:
        input_data: 输入数据字典
        
    Raises:
        ValueError: 如果输入不符合安全限制
    """
    input_json = json.dumps(input_data)
    if len(input_json) > 100_000:  # 100KB 限制
        raise ValueError("Input too large (max 100KB)")
    if len(input_data.keys()) > 20:  # 最大属性数限制
        raise ValueError("Too many input fields (max 20)")


def execute_in_sandbox(
    skill_package: dict, 
    input_data: dict,
    config: Optional[SandboxConfig] = None
) -> dict:
    """
    在隔离 Docker 容器中执行 Skill
    
    Args:
        skill_package: Skill 包配置，包含 runtime 信息
        input_data: 输入数据
        config: 沙盒配置，使用默认值如果未提供
        
    Returns:
        dict: 执行结果
        
    Raises:
        ValueError: 输入验证失败
        RuntimeError: 容器执行失败
    """
    config = config or SandboxConfig()
    
    # 0. 输入验证
    validate_input(input_data)
    
    # 1. 获取运行时配置
    runtime = skill_package.get("runtime", {})
    image = runtime["docker_image"]
    entrypoint = runtime["entrypoint"]
    timeout = runtime.get("timeout_seconds", config.timeout_seconds)
    
    # 2. 启动容器并执行
    client = docker.from_env()
    container = client.containers.run(
        image=image,
        command=f"python {entrypoint}",
        environment={"INPUT_JSON": json.dumps(input_data)},
        mem_limit=config.mem_limit,
        cpu_period=config.cpu_period,
        cpu_quota=config.cpu_quota,
        network_disabled=config.network_disabled,
        detach=True,
    )
    
    try:
        # 3. 等待执行完成
        result = container.wait(timeout=timeout)
        exit_code = result.get("StatusCode", -1)
        
        if exit_code != 0:
            logs = container.logs().decode("utf-8")
            raise RuntimeError(f"Container exited with code {exit_code}: {logs}")
        
        # 4. 获取输出
        output = container.logs().decode("utf-8")
        return json.loads(output)
    finally:
        container.remove(force=True)
