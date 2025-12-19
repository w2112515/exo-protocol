# Exo Protocol - Simulated AI Provider
# Fallback provider for demo/testing when no API key is available

import asyncio
import json
import logging
import random
from typing import Dict, Any

from . import AIProvider

logger = logging.getLogger(__name__)


class SimulatedProvider(AIProvider):
    """
    模拟 AI 提供商
    用于无 API Key 时的降级运行，返回预定义的确定性结果
    """
    
    def __init__(self, latency_ms: int = 2000):
        self.latency_ms = latency_ms
        logger.warning("⚠️ Using SimulatedProvider (Mock Mode). Results are pre-defined.")
    
    async def execute(self, system_prompt: str, user_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行模拟推理
        """
        # 模拟网络延迟
        delay = self.latency_ms / 1000.0
        # 添加一点随机抖动
        await asyncio.sleep(delay + random.uniform(0, 0.5))
        
        # 基于输入的简单的规则匹配
        result = self._generate_mock_response(system_prompt, user_input)
        
        return {
            "result": result,
            "model": "simulated-gpt-4",
            "tokens": 42
        }
    
    def _generate_mock_response(self, system_prompt: str, user_input: Dict[str, Any]) -> Any:
        """根据输入生成 Mock 数据"""
        
        # 1. Code Review Skill
        if "code-review" in system_prompt.lower():
            return {
                "summary": "Simulated Code Review: No critical issues found.",
                "issues": [
                    {
                        "severity": "info",
                        "description": "This is a simulated review result.",
                        "suggestion": "Configure DEEPSEEK_API_KEY for real AI analysis."
                    }
                ],
                "score": 85
            }
        
        # 2. Sentiment Analysis Skill
        if "sentiment" in system_prompt.lower():
            return {
                "sentiment": "positive",
                "confidence": 0.95,
                "analysis": "Simulated analysis: Text appears positive."
            }
            
        # 3. Default fallback
        return {
            "status": "success",
            "message": "Simulated execution successful",
            "note": "This is a mock response from Exo Protocol SimulatedProvider"
        }

    async def close(self) -> None:
        pass
