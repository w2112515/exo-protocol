"""
Exo Protocol - Sandbox 模块单元测试

使用 Mock Docker 进行测试，避免真实 Docker 依赖。
"""

import pytest
from unittest.mock import MagicMock, patch

from executor.sandbox import (
    SandboxConfig,
    validate_input,
    execute_in_sandbox,
)


class TestValidateInput:
    """输入验证测试"""
    
    def test_validate_input_size_limit(self):
        """测试输入大小限制 (AC-02)"""
        large_input = {"data": "x" * 100_001}
        with pytest.raises(ValueError, match="Input too large"):
            validate_input(large_input)
    
    def test_validate_input_field_limit(self):
        """测试属性数量限制 (AC-03)"""
        many_fields = {f"field_{i}": i for i in range(21)}
        with pytest.raises(ValueError, match="Too many input fields"):
            validate_input(many_fields)
    
    def test_validate_input_valid(self):
        """测试有效输入通过验证"""
        valid_input = {"query": "test", "count": 10}
        validate_input(valid_input)  # Should not raise
    
    def test_validate_input_edge_case_20_fields(self):
        """测试边界情况：恰好 20 个属性"""
        edge_input = {f"field_{i}": i for i in range(20)}
        validate_input(edge_input)  # Should not raise
    
    def test_validate_input_edge_case_100kb(self):
        """测试边界情况：接近但不超过 100KB"""
        # JSON 序列化会增加 {"data": ""} = 11 字节
        # 100_000 - 11 = 99_989 字节可用于数据
        data = "x" * 99_980
        edge_input = {"data": data}
        validate_input(edge_input)  # Should not raise


class TestSandboxConfig:
    """SandboxConfig 配置测试 (AC-05)"""
    
    def test_default_mem_limit(self):
        """测试默认内存限制"""
        config = SandboxConfig()
        assert config.mem_limit == "512m"
    
    def test_default_cpu_quota(self):
        """测试默认 CPU 配额"""
        config = SandboxConfig()
        assert config.cpu_quota == 50000
    
    def test_default_cpu_period(self):
        """测试默认 CPU 周期"""
        config = SandboxConfig()
        assert config.cpu_period == 100000
    
    def test_default_timeout(self):
        """测试默认超时"""
        config = SandboxConfig()
        assert config.timeout_seconds == 30
    
    def test_default_network_disabled(self):
        """测试默认网络禁用"""
        config = SandboxConfig()
        assert config.network_disabled is True
    
    def test_custom_config(self):
        """测试自定义配置"""
        config = SandboxConfig(
            mem_limit="1g",
            cpu_quota=75000,
            timeout_seconds=60
        )
        assert config.mem_limit == "1g"
        assert config.cpu_quota == 75000
        assert config.timeout_seconds == 60


class TestExecuteInSandbox:
    """沙盒执行测试"""
    
    @patch("executor.sandbox.docker.from_env")
    def test_execute_in_sandbox_success(self, mock_docker):
        """测试成功执行场景 (AC-04)"""
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
        
        # 验证容器被正确清理
        mock_container.remove.assert_called_once_with(force=True)
    
    @patch("executor.sandbox.docker.from_env")
    def test_execute_in_sandbox_with_custom_config(self, mock_docker):
        """测试使用自定义配置执行"""
        mock_container = MagicMock()
        mock_container.wait.return_value = {"StatusCode": 0}
        mock_container.logs.return_value = b'{"status": "ok"}'
        mock_docker.return_value.containers.run.return_value = mock_container
        
        skill_package = {
            "runtime": {
                "docker_image": "python:3.11-slim",
                "entrypoint": "main.py"
            }
        }
        config = SandboxConfig(mem_limit="1g", cpu_quota=75000)
        
        result = execute_in_sandbox(skill_package, {"data": "test"}, config)
        assert result == {"status": "ok"}
        
        # 验证配置被正确传递
        call_kwargs = mock_docker.return_value.containers.run.call_args.kwargs
        assert call_kwargs["mem_limit"] == "1g"
        assert call_kwargs["cpu_quota"] == 75000
    
    @patch("executor.sandbox.docker.from_env")
    def test_execute_in_sandbox_timeout(self, mock_docker):
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
        
        # 确保容器被清理
        mock_container.remove.assert_called_once_with(force=True)
    
    @patch("executor.sandbox.docker.from_env")
    def test_execute_in_sandbox_nonzero_exit(self, mock_docker):
        """测试非零退出码场景"""
        mock_container = MagicMock()
        mock_container.wait.return_value = {"StatusCode": 1}
        mock_container.logs.return_value = b'Error: something went wrong'
        mock_docker.return_value.containers.run.return_value = mock_container
        
        skill_package = {
            "runtime": {
                "docker_image": "python:3.11-slim",
                "entrypoint": "main.py"
            }
        }
        
        with pytest.raises(RuntimeError, match="Container exited with code 1"):
            execute_in_sandbox(skill_package, {"query": "test"})
    
    def test_execute_in_sandbox_validates_input(self):
        """测试执行前验证输入"""
        skill_package = {
            "runtime": {
                "docker_image": "python:3.11-slim",
                "entrypoint": "main.py"
            }
        }
        large_input = {"data": "x" * 100_001}
        
        with pytest.raises(ValueError, match="Input too large"):
            execute_in_sandbox(skill_package, large_input)
    
    @patch("executor.sandbox.docker.from_env")
    def test_execute_in_sandbox_network_disabled(self, mock_docker):
        """测试网络禁用配置"""
        mock_container = MagicMock()
        mock_container.wait.return_value = {"StatusCode": 0}
        mock_container.logs.return_value = b'{}'
        mock_docker.return_value.containers.run.return_value = mock_container
        
        skill_package = {
            "runtime": {
                "docker_image": "python:3.11-slim",
                "entrypoint": "main.py"
            }
        }
        
        execute_in_sandbox(skill_package, {"data": "test"})
        
        call_kwargs = mock_docker.return_value.containers.run.call_args.kwargs
        assert call_kwargs["network_disabled"] is True
