# Exo Protocol - AI Executor Tests
# Tests for AI-driven skill execution

import pytest
import json
import os
from unittest.mock import AsyncMock, MagicMock, patch

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from executor.providers import AIProvider
from executor.providers.deepseek import DeepSeekProvider, OpenAICompatibleProvider
from executor.ai_executor import AIExecutor, AIExecutionResult


class MockProvider(AIProvider):
    """Mock AI Provider for testing"""
    
    def __init__(self, response: dict = None, should_fail: bool = False):
        self.response = response or {
            "result": {"summary": "Test result"},
            "model": "mock-model",
            "tokens": 100
        }
        self.should_fail = should_fail
        self.execute_called = False
        self.last_system_prompt = None
        self.last_user_input = None
    
    async def execute(self, system_prompt: str, user_input: dict) -> dict:
        self.execute_called = True
        self.last_system_prompt = system_prompt
        self.last_user_input = user_input
        
        if self.should_fail:
            raise RuntimeError("Mock provider failure")
        
        return self.response
    
    async def close(self) -> None:
        pass


class TestAIProvider:
    """Test AI Provider abstraction"""
    
    def test_mock_provider_implements_interface(self):
        """Mock provider should implement AIProvider interface"""
        provider = MockProvider()
        assert isinstance(provider, AIProvider)
    
    @pytest.mark.asyncio
    async def test_mock_provider_execute(self):
        """Mock provider should return configured response"""
        expected = {"result": {"data": "test"}, "model": "test-model", "tokens": 50}
        provider = MockProvider(response=expected)
        
        result = await provider.execute("system prompt", {"input": "data"})
        
        assert result == expected
        assert provider.execute_called
        assert provider.last_system_prompt == "system prompt"
        assert provider.last_user_input == {"input": "data"}


class TestDeepSeekProvider:
    """Test DeepSeek Provider"""
    
    def test_initialization(self):
        """Provider should initialize with API key"""
        provider = DeepSeekProvider(api_key="test-key")
        assert provider.api_key == "test-key"
        assert provider.model == "deepseek-chat"
        assert provider.BASE_URL == "https://api.deepseek.com/v1"
    
    def test_custom_model(self):
        """Provider should accept custom model"""
        provider = DeepSeekProvider(api_key="test-key", model="deepseek-coder")
        assert provider.model == "deepseek-coder"
    
    @pytest.mark.asyncio
    async def test_execute_success(self):
        """Provider should make correct API call"""
        provider = DeepSeekProvider(api_key="test-key")
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"content": '{"result": "success"}'}}],
            "usage": {"total_tokens": 150}
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(provider.client, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            
            result = await provider.execute("system prompt", {"test": "input"})
            
            assert result["model"] == "deepseek-chat"
            assert result["tokens"] == 150
            assert result["result"] == {"result": "success"}
            
            mock_post.assert_called_once()
            call_args = mock_post.call_args
            assert "/chat/completions" in str(call_args)
    
    @pytest.mark.asyncio
    async def test_close(self):
        """Provider should close client"""
        provider = DeepSeekProvider(api_key="test-key")
        
        with patch.object(provider.client, 'aclose', new_callable=AsyncMock) as mock_close:
            await provider.close()
            mock_close.assert_called_once()


class TestOpenAICompatibleProvider:
    """Test OpenAI Compatible Provider"""
    
    def test_initialization(self):
        """Provider should initialize with custom base URL"""
        provider = OpenAICompatibleProvider(
            api_key="test-key",
            base_url="https://custom.api.com/v1",
            model="custom-model"
        )
        assert provider.api_key == "test-key"
        assert provider.base_url == "https://custom.api.com/v1"
        assert provider.model == "custom-model"
    
    def test_default_values(self):
        """Provider should have sensible defaults"""
        provider = OpenAICompatibleProvider(api_key="test-key")
        assert provider.base_url == "https://api.openai.com/v1"
        assert provider.model == "gpt-4o-mini"


class TestAIExecutor:
    """Test AI Executor"""
    
    def test_initialization_with_provider(self):
        """Executor should accept custom provider"""
        mock_provider = MockProvider()
        executor = AIExecutor(provider=mock_provider)
        assert executor.provider == mock_provider
    
    def test_initialization_no_api_key_fallback(self):
        """Executor should fallback to SimulatedProvider without API key"""
        with patch.dict(os.environ, {}, clear=True):
            # Remove any existing API keys
            os.environ.pop("DEEPSEEK_API_KEY", None)
            os.environ.pop("OPENAI_API_KEY", None)
            
            executor = AIExecutor()
            from executor.providers.simulated import SimulatedProvider
            assert isinstance(executor.provider, SimulatedProvider)
    
    def test_initialization_with_deepseek_key(self):
        """Executor should use DeepSeek when key is available"""
        with patch.dict(os.environ, {"DEEPSEEK_API_KEY": "test-key"}):
            executor = AIExecutor()
            assert isinstance(executor.provider, DeepSeekProvider)
    
    def test_initialization_with_openai_key(self):
        """Executor should fallback to OpenAI when DeepSeek not available"""
        with patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}, clear=True):
            os.environ.pop("DEEPSEEK_API_KEY", None)
            executor = AIExecutor()
            assert isinstance(executor.provider, OpenAICompatibleProvider)
    
    @pytest.mark.asyncio
    async def test_execute_skill_success(self):
        """Executor should execute skill successfully"""
        mock_provider = MockProvider(response={
            "result": {"summary": "Code looks good"},
            "model": "mock-model",
            "tokens": 200
        })
        executor = AIExecutor(provider=mock_provider)
        
        skill_package = {
            "name": "code-review",
            "description": "Review code for issues",
            "io": {
                "output_schema": {
                    "type": "object",
                    "properties": {
                        "summary": {"type": "string"}
                    }
                }
            }
        }
        
        input_data = {"code": "print('hello')", "language": "python"}
        
        result = await executor.execute_skill(skill_package, input_data)
        
        assert result.success is True
        assert result.model_used == "mock-model"
        assert result.tokens_used == 200
        assert result.execution_time_ms >= 0
        assert result.output == {"summary": "Code looks good"}
        assert result.error_message is None
    
    @pytest.mark.asyncio
    async def test_execute_skill_failure(self):
        """Executor should handle execution failure"""
        mock_provider = MockProvider(should_fail=True)
        executor = AIExecutor(provider=mock_provider)
        
        skill_package = {"name": "test-skill", "description": "Test"}
        input_data = {"test": "data"}
        
        result = await executor.execute_skill(skill_package, input_data)
        
        assert result.success is False
        assert result.error_message == "Mock provider failure"
        assert result.output == {}
    
    @pytest.mark.asyncio
    async def test_build_system_prompt(self):
        """Executor should build correct system prompt"""
        mock_provider = MockProvider()
        executor = AIExecutor(provider=mock_provider)
        
        skill_package = {
            "name": "test-skill",
            "description": "A test skill for testing",
            "io": {
                "output_schema": {
                    "type": "object",
                    "properties": {
                        "result": {"type": "string"}
                    }
                }
            },
            "examples": [{"input": "test", "output": "result"}]
        }
        
        prompt = executor._build_system_prompt(skill_package)
        
        assert "test-skill" in prompt
        assert "A test skill for testing" in prompt
        assert "JSON" in prompt
        assert "result" in prompt
    
    @pytest.mark.asyncio
    async def test_close(self):
        """Executor should close provider"""
        mock_provider = MockProvider()
        executor = AIExecutor(provider=mock_provider)
        
        with patch.object(mock_provider, 'close', new_callable=AsyncMock) as mock_close:
            await executor.close()
            mock_close.assert_called_once()


class TestAIExecutionResult:
    """Test AIExecutionResult dataclass"""
    
    def test_success_result(self):
        """Should create success result"""
        result = AIExecutionResult(
            success=True,
            output={"data": "test"},
            model_used="gpt-4",
            tokens_used=100,
            execution_time_ms=500
        )
        
        assert result.success is True
        assert result.output == {"data": "test"}
        assert result.model_used == "gpt-4"
        assert result.tokens_used == 100
        assert result.execution_time_ms == 500
        assert result.error_message is None
    
    def test_failure_result(self):
        """Should create failure result with error"""
        result = AIExecutionResult(
            success=False,
            output={},
            model_used="unknown",
            tokens_used=0,
            execution_time_ms=100,
            error_message="API error"
        )
        
        assert result.success is False
        assert result.error_message == "API error"


class TestIntegration:
    """Integration tests (require API key)"""
    
    @pytest.mark.asyncio
    @pytest.mark.skipif(
        not os.getenv("DEEPSEEK_API_KEY"),
        reason="DEEPSEEK_API_KEY not set"
    )
    async def test_real_deepseek_execution(self):
        """Test real DeepSeek API call (skipped if no key)"""
        executor = AIExecutor()
        
        skill_package = {
            "name": "echo",
            "description": "Echo the input message",
            "io": {
                "output_schema": {
                    "type": "object",
                    "properties": {
                        "message": {"type": "string"}
                    }
                }
            }
        }
        
        input_data = {"message": "Hello, AI!"}
        
        result = await executor.execute_skill(skill_package, input_data)
        
        assert result.success is True
        assert result.tokens_used > 0
        assert result.model_used == "deepseek-chat"
        
        await executor.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
