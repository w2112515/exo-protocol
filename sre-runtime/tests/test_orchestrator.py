# Exo Protocol - Orchestrator Unit Tests
# Tests for SRE orchestrator module with mock dependencies

import asyncio
import pytest
import sys
import os
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from orchestrator import OrderConfig, OrderResult, execute_skill_order
from orchestrator.orchestrator import (
    register_failure_callback,
    clear_failure_callbacks,
    _trigger_failure_callbacks,
)
from committer.committer import CommitResult
from executor.sandbox import SandboxConfig


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def sample_skill_package():
    """Sample skill package for testing."""
    return {
        "name": "test-skill",
        "version": "1.0.0",
        "runtime": {
            "docker_image": "python:3.11-slim",
            "entrypoint": "main.py",
            "timeout_seconds": 30,
        }
    }


@pytest.fixture
def sample_input_data():
    """Sample input data for testing."""
    return {"prompt": "test input", "max_tokens": 100}


@pytest.fixture
def sample_order_config(sample_skill_package, sample_input_data):
    """Sample order config for testing."""
    return OrderConfig(
        order_id="test-order-001",
        skill_package=sample_skill_package,
        input_data=sample_input_data,
        timeout_seconds=60,
        max_retries=0,
    )


@pytest.fixture
def mock_commit_result():
    """Mock successful commit result."""
    return CommitResult(
        order_id="test-order-001",
        result_uri="file:///tmp/test-order-001.json",
        result_hash="a" * 64,  # Mock SHA256 hash
        execution_time_ms=150,
        status="success",
        error_message=None,
    )


@pytest.fixture
def mock_failed_commit_result():
    """Mock failed commit result."""
    return CommitResult(
        order_id="test-order-001",
        result_uri="",
        result_hash="",
        execution_time_ms=50,
        status="failed",
        error_message="Docker execution failed",
    )


@pytest.fixture(autouse=True)
def cleanup_callbacks():
    """Clean up callbacks before and after each test."""
    clear_failure_callbacks()
    yield
    clear_failure_callbacks()


# =============================================================================
# AC-01: orchestrator.py 可独立导入
# =============================================================================

class TestAC01Import:
    """AC-01: orchestrator.py 可独立导入"""
    
    def test_import_order_config(self):
        """Can import OrderConfig from orchestrator."""
        from orchestrator import OrderConfig
        assert OrderConfig is not None
    
    def test_import_order_result(self):
        """Can import OrderResult from orchestrator."""
        from orchestrator import OrderResult
        assert OrderResult is not None
    
    def test_import_execute_skill_order(self):
        """Can import execute_skill_order from orchestrator."""
        from orchestrator import execute_skill_order
        assert execute_skill_order is not None
        assert asyncio.iscoroutinefunction(execute_skill_order)
    
    def test_order_config_dataclass_fields(self):
        """OrderConfig has all required fields."""
        config = OrderConfig(
            order_id="test-001",
            skill_package={"name": "test"},
            input_data={"key": "value"},
        )
        assert config.order_id == "test-001"
        assert config.skill_package == {"name": "test"}
        assert config.input_data == {"key": "value"}
        assert config.timeout_seconds == 300  # default
        assert config.max_retries == 0  # default
        assert config.callback_url is None  # default
        assert config.sandbox_config is None  # default
    
    def test_order_result_dataclass_fields(self):
        """OrderResult has all required fields."""
        result = OrderResult(
            order_id="test-001",
            status="completed",
            commit_result=None,
            verification=None,
            execution_time_ms=100,
        )
        assert result.order_id == "test-001"
        assert result.status == "completed"
        assert result.commit_result is None
        assert result.verification is None
        assert result.execution_time_ms == 100
        assert result.error_message is None  # default


# =============================================================================
# AC-02: execute_skill_order() 整合完整流程
# =============================================================================

class TestAC02ExecuteSkillOrder:
    """AC-02: execute_skill_order() 整合完整流程"""
    
    @pytest.mark.asyncio
    async def test_successful_execution(self, sample_order_config, mock_commit_result):
        """Full pipeline executes successfully."""
        with patch(
            "orchestrator.orchestrator.commit_result",
            new_callable=AsyncMock,
            return_value=mock_commit_result
        ):
            result = await execute_skill_order(sample_order_config)
            
            assert result.order_id == sample_order_config.order_id
            assert result.status == "completed"
            assert result.commit_result is not None
            assert result.commit_result.status == "success"
            assert result.verification is not None
            assert result.verification.is_valid is True
            assert result.execution_time_ms >= 0  # May be 0 in fast mock execution
            assert result.error_message is None
    
    @pytest.mark.asyncio
    async def test_commit_result_called_with_correct_args(
        self, sample_order_config, mock_commit_result
    ):
        """commit_result is called with correct arguments."""
        mock_commit = AsyncMock(return_value=mock_commit_result)
        
        with patch("orchestrator.orchestrator.commit_result", mock_commit):
            await execute_skill_order(sample_order_config)
            
            mock_commit.assert_called_once_with(
                order_id=sample_order_config.order_id,
                skill_package=sample_order_config.skill_package,
                input_data=sample_order_config.input_data,
                sandbox_config=sample_order_config.sandbox_config,
            )
    
    @pytest.mark.asyncio
    async def test_failed_commit_returns_failed_status(
        self, sample_order_config, mock_failed_commit_result
    ):
        """Failed commit returns failed status."""
        with patch(
            "orchestrator.orchestrator.commit_result",
            new_callable=AsyncMock,
            return_value=mock_failed_commit_result
        ):
            result = await execute_skill_order(sample_order_config)
            
            assert result.status == "failed"
            assert result.commit_result is not None
            assert result.commit_result.status == "failed"
            assert result.error_message == "Docker execution failed"


# =============================================================================
# AC-03: 支持 OrderConfig (超时/重试/回调)
# =============================================================================

class TestAC03OrderConfig:
    """AC-03: 支持 OrderConfig (超时/重试/回调)"""
    
    def test_order_config_with_custom_timeout(self, sample_skill_package, sample_input_data):
        """OrderConfig accepts custom timeout."""
        config = OrderConfig(
            order_id="test-001",
            skill_package=sample_skill_package,
            input_data=sample_input_data,
            timeout_seconds=120,
        )
        assert config.timeout_seconds == 120
    
    def test_order_config_with_retries(self, sample_skill_package, sample_input_data):
        """OrderConfig accepts retry configuration."""
        config = OrderConfig(
            order_id="test-001",
            skill_package=sample_skill_package,
            input_data=sample_input_data,
            max_retries=3,
        )
        assert config.max_retries == 3
    
    def test_order_config_with_callback_url(self, sample_skill_package, sample_input_data):
        """OrderConfig accepts callback URL."""
        config = OrderConfig(
            order_id="test-001",
            skill_package=sample_skill_package,
            input_data=sample_input_data,
            callback_url="https://example.com/callback",
        )
        assert config.callback_url == "https://example.com/callback"
    
    def test_order_config_with_sandbox_config(self, sample_skill_package, sample_input_data):
        """OrderConfig accepts custom sandbox config."""
        sandbox = SandboxConfig(mem_limit="1g", timeout_seconds=60)
        config = OrderConfig(
            order_id="test-001",
            skill_package=sample_skill_package,
            input_data=sample_input_data,
            sandbox_config=sandbox,
        )
        assert config.sandbox_config is not None
        assert config.sandbox_config.mem_limit == "1g"
    
    @pytest.mark.asyncio
    async def test_timeout_triggers_timeout_status(self, sample_order_config, mock_commit_result):
        """Timeout triggers timeout status."""
        # Create slow mock that will timeout
        async def slow_commit(*args, **kwargs):
            await asyncio.sleep(10)
            return mock_commit_result
        
        sample_order_config.timeout_seconds = 0.1  # Very short timeout
        
        with patch("orchestrator.orchestrator.commit_result", slow_commit):
            result = await execute_skill_order(sample_order_config)
            
            assert result.status == "timeout"
            assert "timeout" in result.error_message.lower()
    
    @pytest.mark.asyncio
    async def test_retry_on_failure(self, sample_order_config, mock_commit_result, mock_failed_commit_result):
        """Retries execution on failure."""
        sample_order_config.max_retries = 2
        
        call_count = 0
        
        async def mock_commit_with_retry(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                return mock_failed_commit_result
            return mock_commit_result
        
        with patch("orchestrator.orchestrator.commit_result", mock_commit_with_retry):
            result = await execute_skill_order(sample_order_config)
            
            assert call_count == 3  # 1 initial + 2 retries
            assert result.status == "completed"


# =============================================================================
# AC-04: 返回 OrderResult 包含完整执行状态
# =============================================================================

class TestAC04OrderResult:
    """AC-04: 返回 OrderResult 包含完整执行状态"""
    
    @pytest.mark.asyncio
    async def test_order_result_contains_all_fields(self, sample_order_config, mock_commit_result):
        """OrderResult contains all required fields."""
        with patch(
            "orchestrator.orchestrator.commit_result",
            new_callable=AsyncMock,
            return_value=mock_commit_result
        ):
            result = await execute_skill_order(sample_order_config)
            
            # Required fields
            assert hasattr(result, "order_id")
            assert hasattr(result, "status")
            assert hasattr(result, "commit_result")
            assert hasattr(result, "verification")
            assert hasattr(result, "execution_time_ms")
            assert hasattr(result, "error_message")
    
    @pytest.mark.asyncio
    async def test_order_result_status_values(self, sample_order_config, mock_commit_result, mock_failed_commit_result):
        """OrderResult status can be completed, failed, or timeout."""
        # Test completed status
        with patch(
            "orchestrator.orchestrator.commit_result",
            new_callable=AsyncMock,
            return_value=mock_commit_result
        ):
            result = await execute_skill_order(sample_order_config)
            assert result.status == "completed"
        
        # Test failed status
        with patch(
            "orchestrator.orchestrator.commit_result",
            new_callable=AsyncMock,
            return_value=mock_failed_commit_result
        ):
            result = await execute_skill_order(sample_order_config)
            assert result.status == "failed"
    
    @pytest.mark.asyncio
    async def test_order_result_includes_commit_result(self, sample_order_config, mock_commit_result):
        """OrderResult includes CommitResult from committer."""
        with patch(
            "orchestrator.orchestrator.commit_result",
            new_callable=AsyncMock,
            return_value=mock_commit_result
        ):
            result = await execute_skill_order(sample_order_config)
            
            assert result.commit_result is not None
            assert result.commit_result.order_id == mock_commit_result.order_id
            assert result.commit_result.result_uri == mock_commit_result.result_uri
            assert result.commit_result.result_hash == mock_commit_result.result_hash
    
    @pytest.mark.asyncio
    async def test_order_result_includes_verification(self, sample_order_config, mock_commit_result):
        """OrderResult includes verification result."""
        with patch(
            "orchestrator.orchestrator.commit_result",
            new_callable=AsyncMock,
            return_value=mock_commit_result
        ):
            result = await execute_skill_order(sample_order_config)
            
            assert result.verification is not None
            assert result.verification.is_valid is True


# =============================================================================
# AC-05: 执行失败时触发回调/记录日志
# =============================================================================

class TestAC05FailureCallbacks:
    """AC-05: 执行失败时触发回调/记录日志"""
    
    @pytest.mark.asyncio
    async def test_failure_callback_triggered_on_failure(
        self, sample_order_config, mock_failed_commit_result
    ):
        """Failure callback is triggered when execution fails."""
        callback_results = []
        
        def failure_callback(result: OrderResult):
            callback_results.append(result)
        
        register_failure_callback(failure_callback)
        
        with patch(
            "orchestrator.orchestrator.commit_result",
            new_callable=AsyncMock,
            return_value=mock_failed_commit_result
        ):
            result = await execute_skill_order(sample_order_config)
            
            assert len(callback_results) == 1
            assert callback_results[0].status == "failed"
            assert callback_results[0].order_id == sample_order_config.order_id
    
    @pytest.mark.asyncio
    async def test_no_callback_on_success(self, sample_order_config, mock_commit_result):
        """No callback triggered on successful execution."""
        callback_results = []
        
        def failure_callback(result: OrderResult):
            callback_results.append(result)
        
        register_failure_callback(failure_callback)
        
        with patch(
            "orchestrator.orchestrator.commit_result",
            new_callable=AsyncMock,
            return_value=mock_commit_result
        ):
            await execute_skill_order(sample_order_config)
            
            assert len(callback_results) == 0
    
    @pytest.mark.asyncio
    async def test_multiple_callbacks_triggered(
        self, sample_order_config, mock_failed_commit_result
    ):
        """Multiple registered callbacks are all triggered."""
        callback1_results = []
        callback2_results = []
        
        def callback1(result: OrderResult):
            callback1_results.append(result)
        
        def callback2(result: OrderResult):
            callback2_results.append(result)
        
        register_failure_callback(callback1)
        register_failure_callback(callback2)
        
        with patch(
            "orchestrator.orchestrator.commit_result",
            new_callable=AsyncMock,
            return_value=mock_failed_commit_result
        ):
            await execute_skill_order(sample_order_config)
            
            assert len(callback1_results) == 1
            assert len(callback2_results) == 1
    
    @pytest.mark.asyncio
    async def test_callback_error_does_not_break_execution(
        self, sample_order_config, mock_failed_commit_result
    ):
        """Callback errors don't break the execution flow."""
        def bad_callback(result: OrderResult):
            raise Exception("Callback error!")
        
        register_failure_callback(bad_callback)
        
        with patch(
            "orchestrator.orchestrator.commit_result",
            new_callable=AsyncMock,
            return_value=mock_failed_commit_result
        ):
            # Should not raise
            result = await execute_skill_order(sample_order_config)
            assert result.status == "failed"
    
    @pytest.mark.asyncio
    async def test_failure_callback_on_timeout(self, sample_order_config, mock_commit_result):
        """Failure callback triggered on timeout."""
        callback_results = []
        
        def failure_callback(result: OrderResult):
            callback_results.append(result)
        
        register_failure_callback(failure_callback)
        
        async def slow_commit(*args, **kwargs):
            await asyncio.sleep(10)
            return mock_commit_result
        
        sample_order_config.timeout_seconds = 0.1
        
        with patch("orchestrator.orchestrator.commit_result", slow_commit):
            result = await execute_skill_order(sample_order_config)
            
            assert len(callback_results) == 1
            assert callback_results[0].status == "timeout"


# =============================================================================
# Integration Tests
# =============================================================================

class TestIntegration:
    """Integration tests for orchestrator module."""
    
    def test_clear_callbacks(self):
        """clear_failure_callbacks removes all registered callbacks."""
        def dummy_callback(result):
            pass
        
        register_failure_callback(dummy_callback)
        register_failure_callback(dummy_callback)
        
        clear_failure_callbacks()
        
        # Manually check internal state via trigger
        result = OrderResult(
            order_id="test",
            status="failed",
            commit_result=None,
            verification=None,
            execution_time_ms=0,
            error_message="test"
        )
        
        # Should not raise even with cleared callbacks
        _trigger_failure_callbacks(result)
