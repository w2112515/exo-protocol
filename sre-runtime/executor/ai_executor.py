# Exo Protocol - AI Executor
# Real AI-driven skill execution using LLM providers

import json
import logging
import os
import time
from dataclasses import dataclass
from typing import Dict, Any, Optional

from .providers import AIProvider, SimulatedProvider
from .providers.deepseek import DeepSeekProvider, OpenAICompatibleProvider

logger = logging.getLogger(__name__)



@dataclass
class AIExecutionResult:
    """AI 执行结果"""
    success: bool
    output: Dict[str, Any]
    model_used: str
    tokens_used: int
    execution_time_ms: int
    error_message: Optional[str] = None


class AIExecutor:
    """真实 AI Agent 执行器"""
    
    def __init__(self, provider: Optional[AIProvider] = None):
        """
        初始化 AI 执行器
        
        Args:
            provider: AI 提供商实例，如果为 None 则从环境变量自动选择
        """
        if provider is None:
            provider = self._create_default_provider()
        self.provider = provider
    
    def _create_default_provider(self) -> AIProvider:
        """从环境变量创建默认 Provider"""
        # 优先使用 DeepSeek
        deepseek_key = os.getenv("DEEPSEEK_API_KEY")
        if deepseek_key:
            logger.info("Using DeepSeek provider")
            return DeepSeekProvider(deepseek_key)
        
        # 降级到 OpenAI
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            logger.info("Using OpenAI provider")
            return OpenAICompatibleProvider(
                openai_key, 
                base_url="https://api.openai.com/v1",
                model="gpt-4o-mini"
            )
        
        # 最后的防线：Mock Provider
        logger.warning("⚠️ No AI provider configured. Falling back to SimulatedProvider.")
        logger.warning("   (Set DEEPSEEK_API_KEY to use real AI)")
        return SimulatedProvider()
    
    async def execute_skill(
        self,
        skill_package: dict,
        input_data: dict
    ) -> AIExecutionResult:
        """
        使用真实 AI 执行 Skill
        
        Args:
            skill_package: SKILL.md 解析后的配置
            input_data: 用户输入
            
        Returns:
            AIExecutionResult: 执行结果
        """
        start = time.perf_counter()
        
        try:
            # 构建 system prompt
            system_prompt = self._build_system_prompt(skill_package)
            
            logger.info(f"Executing skill: {skill_package.get('name', 'Unknown')}")
            logger.debug(f"System prompt: {system_prompt[:200]}...")
            logger.debug(f"Input data: {input_data}")
            
            # 调用 AI 提供商
            result = await self.provider.execute(system_prompt, input_data)
            
            execution_time = int((time.perf_counter() - start) * 1000)
            
            logger.info(
                f"Skill execution completed. "
                f"Model: {result.get('model', 'unknown')}, "
                f"Tokens: {result.get('tokens', 0)}, "
                f"Time: {execution_time}ms"
            )
            
            return AIExecutionResult(
                success=True,
                output=result.get("result", result),
                model_used=result.get("model", "unknown"),
                tokens_used=result.get("tokens", 0),
                execution_time_ms=execution_time
            )
            
        except Exception as e:
            execution_time = int((time.perf_counter() - start) * 1000)
            logger.error(f"Skill execution failed: {e}")
            
            return AIExecutionResult(
                success=False,
                output={},
                model_used="unknown",
                tokens_used=0,
                execution_time_ms=execution_time,
                error_message=str(e)
            )
    
    def _build_system_prompt(self, skill_package: dict) -> str:
        """从 SKILL.md 构建 system prompt"""
        name = skill_package.get("name", "Unknown Skill")
        description = skill_package.get("description", "")
        
        # 获取输出 schema
        io_config = skill_package.get("io", {})
        output_schema = io_config.get("output_schema", {})
        
        # 获取示例 (如果有)
        examples = skill_package.get("examples", [])
        examples_str = ""
        if examples:
            examples_str = "\n\nExamples:\n" + json.dumps(examples, indent=2, ensure_ascii=False)
        
        return f"""You are an AI Agent executing the skill: {name}

Description: {description}

You must return a valid JSON response matching this schema:
{json.dumps(output_schema, indent=2, ensure_ascii=False) if output_schema else "Return a JSON object with appropriate fields."}
{examples_str}

IMPORTANT RULES:
1. Respond ONLY with valid JSON. No markdown, no explanations, no code blocks.
2. The response must be parseable by JSON.parse()
3. Follow the output schema exactly if provided.
4. Be helpful, accurate, and concise in your response content."""
    
    async def close(self) -> None:
        """关闭 Provider 连接"""
        if self.provider:
            await self.provider.close()


async def test_ai_executor():
    """测试 AI 执行器"""
    import asyncio
    
    logging.basicConfig(level=logging.INFO)
    
    executor = AIExecutor()
    
    # 测试 Skill 配置
    skill_package = {
        "name": "code-review",
        "description": "Review code for bugs, security issues, and improvements",
        "io": {
            "output_schema": {
                "type": "object",
                "properties": {
                    "issues": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "severity": {"type": "string"},
                                "description": {"type": "string"},
                                "suggestion": {"type": "string"}
                            }
                        }
                    },
                    "summary": {"type": "string"}
                }
            }
        }
    }
    
    input_data = {
        "code": "def add(a, b): return a + b",
        "language": "python"
    }
    
    result = await executor.execute_skill(skill_package, input_data)
    
    print(f"\n{'='*50}")
    print(f"Success: {result.success}")
    print(f"Model: {result.model_used}")
    print(f"Tokens: {result.tokens_used}")
    print(f"Time: {result.execution_time_ms}ms")
    print(f"Output: {json.dumps(result.output, indent=2, ensure_ascii=False)}")
    print(f"{'='*50}\n")
    
    await executor.close()
    
    return result


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_ai_executor())
