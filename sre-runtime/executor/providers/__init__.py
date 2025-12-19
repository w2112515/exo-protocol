# Exo Protocol - AI Provider Abstraction Layer

from abc import ABC, abstractmethod
from typing import Dict, Any


class AIProvider(ABC):
    """AI 提供商抽象基类"""
    
    @abstractmethod
    async def execute(self, system_prompt: str, user_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行 AI 推理
        
        Args:
            system_prompt: 系统提示词
            user_input: 用户输入数据
            
        Returns:
            Dict containing:
                - result: AI 生成的结果
                - model: 使用的模型名称
                - tokens: Token 消耗数量
        """
        pass
    
    @abstractmethod
    async def close(self) -> None:
        """关闭客户端连接"""
        pass


from .simulated import SimulatedProvider

__all__ = ["AIProvider", "SimulatedProvider"]
