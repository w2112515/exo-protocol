# Exo Protocol - DeepSeek AI Provider
# OpenAI-compatible API implementation for DeepSeek

import json
import logging
from typing import Dict, Any

import httpx

from . import AIProvider

logger = logging.getLogger(__name__)


class DeepSeekProvider(AIProvider):
    """DeepSeek API 提供商 - OpenAI 兼容接口"""
    
    BASE_URL = "https://api.deepseek.com/v1"
    
    def __init__(self, api_key: str, model: str = "deepseek-chat"):
        """
        初始化 DeepSeek Provider
        
        Args:
            api_key: DeepSeek API Key
            model: 模型名称，默认 deepseek-chat
        """
        self.api_key = api_key
        self.model = model
        self.client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            timeout=60.0
        )
    
    async def execute(self, system_prompt: str, user_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行 AI 推理 (带重试机制)
        
        Args:
            system_prompt: 系统提示词
            user_input: 用户输入数据
            
        Returns:
            Dict containing result, model, tokens
        """
        max_retries = 3
        base_delay = 1.0
        
        for attempt in range(max_retries):
            try:
                response = await self.client.post(
                    "/chat/completions",
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": json.dumps(user_input, ensure_ascii=False)}
                        ],
                        "max_tokens": 4096,
                        "temperature": 0.7
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                result_content = data["choices"][0]["message"]["content"]
                tokens_used = data.get("usage", {}).get("total_tokens", 0)
                
                logger.info(f"DeepSeek execution completed. Model: {self.model}, Tokens: {tokens_used}")
                
                # 尝试解析 JSON 结果
                try:
                    # 清理 markdown 代码块 (如果存在)
                    cleaned_content = result_content.replace("```json", "").replace("```", "").strip()
                    parsed_result = json.loads(cleaned_content)
                except json.JSONDecodeError:
                    logger.warning("Failed to parse JSON from AI response, returning raw content")
                    parsed_result = {"raw_response": result_content}
                
                return {
                    "result": parsed_result,
                    "model": self.model,
                    "tokens": tokens_used
                }
                
            except httpx.HTTPStatusError as e:
                # 4xx 错误通常不重试 (除了 429)
                if e.response.status_code == 429 or e.response.status_code >= 500:
                    if attempt < max_retries - 1:
                        delay = base_delay * (2 ** attempt)  # 指数退避
                        logger.warning(f"DeepSeek API error {e.response.status_code}, retrying in {delay}s...")
                        import asyncio
                        await asyncio.sleep(delay)
                        continue
                
                logger.error(f"DeepSeek API error: {e.response.status_code} - {e.response.text}")
                raise RuntimeError(f"DeepSeek API error: {e.response.status_code}") from e
                
            except (httpx.TimeoutException, httpx.NetworkError) as e:
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    logger.warning(f"Network error {type(e).__name__}, retrying in {delay}s...")
                    import asyncio
                    await asyncio.sleep(delay)
                    continue
                logger.error(f"DeepSeek execution failed after {max_retries} attempts: {e}")
                raise

        raise RuntimeError(f"DeepSeek execution failed after {max_retries} retries")
    
    async def close(self) -> None:
        """关闭客户端连接"""
        await self.client.aclose()


class OpenAICompatibleProvider(AIProvider):
    """通用 OpenAI 兼容接口提供商 (可用于 OpenAI, Azure, 其他兼容 API)"""
    
    def __init__(
        self, 
        api_key: str, 
        base_url: str = "https://api.openai.com/v1",
        model: str = "gpt-4o-mini"
    ):
        """
        初始化 OpenAI 兼容 Provider
        
        Args:
            api_key: API Key
            base_url: API Base URL
            model: 模型名称
        """
        self.api_key = api_key
        self.base_url = base_url
        self.model = model
        self.client = httpx.AsyncClient(
            base_url=base_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            timeout=60.0
        )
    
    async def execute(self, system_prompt: str, user_input: Dict[str, Any]) -> Dict[str, Any]:
        """执行 AI 推理"""
        try:
            response = await self.client.post(
                "/chat/completions",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": json.dumps(user_input, ensure_ascii=False)}
                    ],
                    "max_tokens": 4096,
                    "temperature": 0.7
                }
            )
            response.raise_for_status()
            data = response.json()
            
            result_content = data["choices"][0]["message"]["content"]
            tokens_used = data.get("usage", {}).get("total_tokens", 0)
            
            logger.info(f"OpenAI-compatible execution completed. Model: {self.model}, Tokens: {tokens_used}")
            
            try:
                parsed_result = json.loads(result_content)
            except json.JSONDecodeError:
                parsed_result = {"raw_response": result_content}
            
            return {
                "result": parsed_result,
                "model": self.model,
                "tokens": tokens_used
            }
            
        except httpx.HTTPStatusError as e:
            logger.error(f"API error: {e.response.status_code} - {e.response.text}")
            raise RuntimeError(f"API error: {e.response.status_code}") from e
        except Exception as e:
            logger.error(f"Execution failed: {e}")
            raise
    
    async def close(self) -> None:
        """关闭客户端连接"""
        await self.client.aclose()


__all__ = ["DeepSeekProvider", "OpenAICompatibleProvider"]
