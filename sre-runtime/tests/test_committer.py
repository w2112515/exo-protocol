# Exo Protocol - Committer Unit Tests
# Covers AC-01 ~ AC-05 for P2-COMMITTER

import hashlib
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from committer import CommitResult, commit_result, compute_result_hash
from executor.sandbox import SandboxConfig


class TestCommitResultDataclass:
    """AC-01: committer.py 可独立导入"""
    
    def test_commit_result_import(self):
        """验证 CommitResult dataclass 可正确导入"""
        assert CommitResult is not None
        
    def test_commit_result_fields(self):
        """验证 CommitResult 包含所有必需字段"""
        result = CommitResult(
            order_id="order-123",
            result_uri="file://test.json",
            result_hash="abc123",
            execution_time_ms=100,
            status="success",
            error_message=None,
        )
        assert result.order_id == "order-123"
        assert result.result_uri == "file://test.json"
        assert result.result_hash == "abc123"
        assert result.execution_time_ms == 100
        assert result.status == "success"
        assert result.error_message is None


class TestComputeResultHash:
    """AC-03: result_hash 使用 SHA256"""
    
    def test_hash_deterministic(self):
        """验证相同输入产生相同哈希"""
        result = {"key": "value", "number": 42}
        hash1 = compute_result_hash(result)
        hash2 = compute_result_hash(result)
        assert hash1 == hash2
        
    def test_hash_uses_sha256(self):
        """验证使用 SHA256 算法"""
        result = {"test": "data"}
        computed_hash = compute_result_hash(result)
        
        # 手动计算验证
        serialized = json.dumps(result, sort_keys=True, ensure_ascii=False)
        expected_hash = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
        
        assert computed_hash == expected_hash
        assert len(computed_hash) == 64  # SHA256 = 64 hex chars
        
    def test_hash_key_order_independent(self):
        """验证字典键顺序不影响哈希 (sort_keys=True)"""
        result1 = {"b": 2, "a": 1}
        result2 = {"a": 1, "b": 2}
        
        assert compute_result_hash(result1) == compute_result_hash(result2)
        
    def test_hash_different_for_different_data(self):
        """验证不同数据产生不同哈希"""
        result1 = {"key": "value1"}
        result2 = {"key": "value2"}
        
        assert compute_result_hash(result1) != compute_result_hash(result2)


class TestCommitResultIntegration:
    """AC-02: commit_result 整合 sandbox + DA"""
    
    @pytest.mark.asyncio
    async def test_commit_result_success_flow(self):
        """验证成功流程整合 sandbox 和 DA"""
        mock_sandbox_result = {"output": "test result", "score": 100}
        mock_uri = "file://results/order-test.json"
        
        with patch("committer.committer.execute_in_sandbox") as mock_sandbox, \
             patch("committer.committer.store_result", new_callable=AsyncMock) as mock_store:
            
            mock_sandbox.return_value = mock_sandbox_result
            mock_store.return_value = mock_uri
            
            result = await commit_result(
                order_id="order-test",
                skill_package={"runtime": {"docker_image": "test", "entrypoint": "main.py"}},
                input_data={"prompt": "test"},
            )
            
            # 验证 sandbox 被调用
            mock_sandbox.assert_called_once()
            
            # 验证 store_result 被调用
            mock_store.assert_called_once()
            call_args = mock_store.call_args
            assert call_args[0][0] == mock_sandbox_result
            assert call_args[0][1] == "order-test"
            
            # 验证返回结果
            assert result.status == "success"
            assert result.order_id == "order-test"
            assert result.result_uri == mock_uri
            assert result.result_hash == compute_result_hash(mock_sandbox_result)


class TestCommitResultFailure:
    """AC-04: 执行失败时返回 status='failed'"""
    
    @pytest.mark.asyncio
    async def test_sandbox_failure_returns_failed_status(self):
        """验证 sandbox 失败时返回 failed 状态"""
        with patch("committer.committer.execute_in_sandbox") as mock_sandbox:
            mock_sandbox.side_effect = RuntimeError("Container crashed")
            
            result = await commit_result(
                order_id="order-fail",
                skill_package={"runtime": {"docker_image": "test", "entrypoint": "main.py"}},
                input_data={"prompt": "test"},
            )
            
            assert result.status == "failed"
            assert result.order_id == "order-fail"
            assert "Container crashed" in result.error_message
            assert result.result_uri == ""
            assert result.result_hash == ""
            
    @pytest.mark.asyncio
    async def test_storage_failure_returns_failed_status(self):
        """验证 DA 存储失败时返回 failed 状态"""
        with patch("committer.committer.execute_in_sandbox") as mock_sandbox, \
             patch("committer.committer.store_result", new_callable=AsyncMock) as mock_store:
            
            mock_sandbox.return_value = {"output": "ok"}
            mock_store.side_effect = Exception("Storage unavailable")
            
            result = await commit_result(
                order_id="order-store-fail",
                skill_package={"runtime": {"docker_image": "test", "entrypoint": "main.py"}},
                input_data={"prompt": "test"},
            )
            
            assert result.status == "failed"
            assert "Storage unavailable" in result.error_message


class TestExecutionTiming:
    """AC-05: execution_time_ms 正确记录"""
    
    @pytest.mark.asyncio
    async def test_execution_time_recorded(self):
        """验证执行时间被正确记录"""
        with patch("committer.committer.execute_in_sandbox") as mock_sandbox, \
             patch("committer.committer.store_result", new_callable=AsyncMock) as mock_store:
            
            mock_sandbox.return_value = {"output": "ok"}
            mock_store.return_value = "file://test.json"
            
            result = await commit_result(
                order_id="order-timing",
                skill_package={"runtime": {"docker_image": "test", "entrypoint": "main.py"}},
                input_data={"prompt": "test"},
            )
            
            # 执行时间应该是非负整数
            assert isinstance(result.execution_time_ms, int)
            assert result.execution_time_ms >= 0
            
    @pytest.mark.asyncio
    async def test_execution_time_recorded_on_failure(self):
        """验证失败时也记录执行时间"""
        with patch("committer.committer.execute_in_sandbox") as mock_sandbox:
            mock_sandbox.side_effect = RuntimeError("Error")
            
            result = await commit_result(
                order_id="order-timing-fail",
                skill_package={"runtime": {"docker_image": "test", "entrypoint": "main.py"}},
                input_data={"prompt": "test"},
            )
            
            assert result.status == "failed"
            assert isinstance(result.execution_time_ms, int)
            assert result.execution_time_ms >= 0


class TestSandboxConfigPassthrough:
    """验证 SandboxConfig 正确传递"""
    
    @pytest.mark.asyncio
    async def test_custom_config_passed_to_sandbox(self):
        """验证自定义配置被传递给 sandbox"""
        custom_config = SandboxConfig(
            mem_limit="1g",
            timeout_seconds=60,
        )
        
        with patch("committer.committer.execute_in_sandbox") as mock_sandbox, \
             patch("committer.committer.store_result", new_callable=AsyncMock) as mock_store:
            
            mock_sandbox.return_value = {"output": "ok"}
            mock_store.return_value = "file://test.json"
            
            await commit_result(
                order_id="order-config",
                skill_package={"runtime": {"docker_image": "test", "entrypoint": "main.py"}},
                input_data={"prompt": "test"},
                sandbox_config=custom_config,
            )
            
            # 验证 config 被传递
            call_args = mock_sandbox.call_args
            assert call_args[0][2] == custom_config
