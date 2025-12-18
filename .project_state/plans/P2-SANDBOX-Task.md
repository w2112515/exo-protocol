# P2-SANDBOX: Docker 沙盒执行模块

**Task ID**: P2-SANDBOX
**Priority**: P0 (高)
**Status**: 🔵 DISPATCHED
**Created**: 2024-12-14 23:28 UTC+8
**Depends On**: None (Docker Desktop ✅ 已确认)

---

## Task Description

实现 Sandbox 模块，用于在隔离的 Docker 容器中执行 Skill 任务，确保执行环境安全隔离、资源受限、结果可重放。

## Input

- `docs/mvp v2.0.md` §4.2.2 - Sandbox 设计规范
- 现有目录: `sre-runtime/executor/`
- Docker Desktop ✅ (v29.1.2 已确认)

## Output

### 文件清单

| 文件 | 描述 |
|------|------|
| `sre-runtime/executor/sandbox.py` | Docker 沙盒执行核心逻辑 |
| `sre-runtime/tests/test_sandbox.py` | 单元测试 |

### 功能要求

1. **execute_in_sandbox(skill_package: dict, input_data: dict) -> dict**
   - 输入验证 (100KB 限制, 20 属性限制)
   - 启动隔离 Docker 容器
   - 资源限制 (512MB 内存, 50% CPU)
   - 网络禁用
   - 超时控制
   - 返回 JSON 结果

2. **validate_input(input_data: dict) -> None**
   - 检查输入大小 (< 100KB)
   - 检查属性数量 (≤ 20)
   - 抛出 ValueError 如果不合规

3. **SandboxConfig (dataclass)**
   - mem_limit: str = "512m"
   - cpu_quota: int = 50000
   - timeout_seconds: int = 30
   - network_disabled: bool = True

### 代码骨架

```python
# sre-runtime/executor/sandbox.py
import docker
import json
from dataclasses import dataclass
from typing import Any

@dataclass
class SandboxConfig:
    mem_limit: str = "512m"
    cpu_period: int = 100000
    cpu_quota: int = 50000  # 50% CPU
    timeout_seconds: int = 30
    network_disabled: bool = True

def validate_input(input_data: dict) -> None:
    """验证输入数据安全性"""
    input_json = json.dumps(input_data)
    if len(input_json) > 100_000:  # 100KB 限制
        raise ValueError("Input too large (max 100KB)")
    if len(input_data.keys()) > 20:  # 最大属性数限制
        raise ValueError("Too many input fields (max 20)")

def execute_in_sandbox(
    skill_package: dict, 
    input_data: dict,
    config: SandboxConfig = None
) -> dict:
    """在隔离 Docker 容器中执行 Skill"""
    config = config or SandboxConfig()
    
    # 0. 输入验证
    validate_input(input_data)
    
    # 1. 获取运行时配置
    image = skill_package["runtime"]["docker_image"]
    entrypoint = skill_package["runtime"]["entrypoint"]
    timeout = skill_package["runtime"].get("timeout_seconds", config.timeout_seconds)
    
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
            raise RuntimeError(f"Container exited with code {exit_code}")
        
        # 4. 获取输出
        output = container.logs().decode("utf-8")
        return json.loads(output)
    finally:
        container.remove(force=True)
```

## Verify

### Unit Test (Mock Docker)

```python
# tests/test_sandbox.py
import pytest
from unittest.mock import MagicMock, patch

def test_validate_input_size_limit():
    """测试输入大小限制"""
    large_input = {"data": "x" * 100_001}
    with pytest.raises(ValueError, match="Input too large"):
        validate_input(large_input)

def test_validate_input_field_limit():
    """测试属性数量限制"""
    many_fields = {f"field_{i}": i for i in range(21)}
    with pytest.raises(ValueError, match="Too many input fields"):
        validate_input(many_fields)

def test_validate_input_valid():
    """测试有效输入通过验证"""
    valid_input = {"query": "test", "count": 10}
    validate_input(valid_input)  # Should not raise

@patch("docker.from_env")
def test_execute_in_sandbox_success(mock_docker):
    """测试成功执行场景 (Mock Docker)"""
    # Setup mock
    mock_container = MagicMock()
    mock_container.wait.return_value = {"StatusCode": 0}
    mock_container.logs.return_value = b'{"result": "success"}'
    mock_docker.return_value.containers.run.return_value = mock_container
    
    skill_package = {
        "runtime": {
            "docker_image": "python:3.11-slim",
            "entrypoint": "main.py",
            "timeout_seconds": 30
        }
    }
    input_data = {"query": "test"}
    
    result = execute_in_sandbox(skill_package, input_data)
    assert result == {"result": "success"}

@patch("docker.from_env")
def test_execute_in_sandbox_timeout(mock_docker):
    """测试超时场景"""
    mock_container = MagicMock()
    mock_container.wait.side_effect = Exception("Container timed out")
    mock_docker.return_value.containers.run.return_value = mock_container
    
    skill_package = {
        "runtime": {
            "docker_image": "python:3.11-slim",
            "entrypoint": "main.py",
            "timeout_seconds": 1
        }
    }
    
    with pytest.raises(Exception):
        execute_in_sandbox(skill_package, {"query": "test"})
```

### AC (验收标准)

| AC | 描述 | 验证方式 |
|----|------|---------|
| AC-01 | sandbox.py 可独立导入 | `python -c "from executor.sandbox import execute_in_sandbox"` |
| AC-02 | 输入验证 - 大小限制测试通过 | `pytest tests/test_sandbox.py::test_validate_input_size_limit` |
| AC-03 | 输入验证 - 属性限制测试通过 | `pytest tests/test_sandbox.py::test_validate_input_field_limit` |
| AC-04 | Mock Docker 执行测试通过 | `pytest tests/test_sandbox.py::test_execute_in_sandbox_success` |
| AC-05 | SandboxConfig 默认值符合规范 | 检查 mem_limit="512m", cpu_quota=50000 |

## External Dependencies

| 资源 | 类型 | 状态 |
|------|------|------|
| Docker Desktop | 本地服务 | ✅ v29.1.2 已确认 |
| Python 3.11+ | 本地服务 | ✅ v3.12.6 已确认 |
| docker (pip) | Python 包 | ⬜ 需添加到 requirements.txt |

### 依赖安装

```bash
# 确保 requirements.txt 包含
docker>=7.0.0
```

---

## Report Template

任务完成后，WAP 需在 `.project_state/reports/P2-SANDBOX_report.json` 提交报告：

```json
{
  "task_id": "P2-SANDBOX",
  "status": "success|failed",
  "execution_mode": "Serial-Batching",
  "timestamp": "ISO8601",
  "modified_files": [
    "sre-runtime/executor/sandbox.py",
    "sre-runtime/tests/test_sandbox.py",
    "sre-runtime/requirements.txt"
  ],
  "verification": {
    "ac_01": { "description": "...", "command": "...", "result": "PASS|FAIL" },
    "ac_02": { "description": "...", "command": "...", "result": "PASS|FAIL" },
    "ac_03": { "description": "...", "command": "...", "result": "PASS|FAIL" },
    "ac_04": { "description": "...", "command": "...", "result": "PASS|FAIL" },
    "ac_05": { "description": "...", "command": "...", "result": "PASS|FAIL" }
  },
  "diagnostics_log": [],
  "note_to_csa": "..."
}
```

---

## Notes

- 使用 Mock Docker 进行单元测试，避免真实 Docker 依赖
- Integration 测试 (真实 Docker 执行) 可在 P2 后期补充
- 网络禁用是安全硬性要求，不可配置为 enabled
