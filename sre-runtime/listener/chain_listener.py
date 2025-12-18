"""
Exo Protocol - Chain Event Listener

链上事件监听模块，使用 Helius WebSocket API 订阅 Exo Protocol 合约事件

Events:
- Skill: 注册、更新、弃用
- Agent: 创建身份、更新资料
- Escrow: 创建、资金注入、结算释放、取消、争议

@usage
    python chain_listener.py --mainnet  # 主网监听
    python chain_listener.py --devnet   # Devnet 监听 (默认)
    python chain_listener.py --test     # 测试模式 (Mock 事件)
"""

import asyncio
import json
import logging
import os
import sys
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional
import base64

# ============================================================================
# Configuration
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

# Program IDs
EXO_CORE_PROGRAM_ID = "CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT"
EXO_HOOKS_PROGRAM_ID = "F5CzTZpDch5gUc5FgTPPRJ8mRKgrMVzJmcPfTzTugCeK"

# Helius endpoints
HELIUS_WS_MAINNET = "wss://atlas-mainnet.helius-rpc.com"
HELIUS_WS_DEVNET = "wss://devnet.helius-rpc.com"

# Reconnect settings
RECONNECT_DELAY = 3  # seconds
MAX_RECONNECT_ATTEMPTS = 5


# ============================================================================
# Event Types
# ============================================================================

class EventType(Enum):
    """Exo Protocol 事件类型"""
    # Skill Events
    SKILL_REGISTERED = "skill_registered"
    SKILL_UPDATED = "skill_updated"
    SKILL_DEPRECATED = "skill_deprecated"
    
    # Agent Events
    AGENT_CREATED = "agent_created"
    AGENT_UPDATED = "agent_updated"
    AGENT_CLOSED = "agent_closed"
    
    # Escrow Events
    ESCROW_CREATED = "escrow_created"
    ESCROW_FUNDED = "escrow_funded"
    ESCROW_RELEASED = "escrow_released"
    ESCROW_CANCELLED = "escrow_cancelled"
    ESCROW_DISPUTED = "escrow_disputed"
    
    # Transfer Hook Events
    HOOK_INITIALIZED = "hook_initialized"
    HOOK_CONFIG_UPDATED = "hook_config_updated"
    TRANSFER_HOOKED = "transfer_hooked"
    
    # Unknown
    UNKNOWN = "unknown"


@dataclass
class ChainEvent:
    """链上事件数据结构"""
    event_type: EventType
    signature: str
    slot: int
    timestamp: datetime
    program_id: str
    data: Dict[str, Any] = field(default_factory=dict)
    raw_logs: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "event_type": self.event_type.value,
            "signature": self.signature,
            "slot": self.slot,
            "timestamp": self.timestamp.isoformat(),
            "program_id": self.program_id,
            "data": self.data,
        }
    
    def to_json(self) -> str:
        """转换为 JSON 字符串"""
        return json.dumps(self.to_dict(), indent=2)


# ============================================================================
# Log Parser
# ============================================================================

class LogParser:
    """
    解析 Solana Program 日志，提取 Exo Protocol 事件
    
    Anchor 程序日志格式:
    - Program ABC... invoke [N]
    - Program log: [message]
    - Program data: [base64 data]
    - Program ABC... success
    """
    
    # 事件关键字映射
    EVENT_KEYWORDS = {
        # Skill
        "Skill registered": EventType.SKILL_REGISTERED,
        "skill registered": EventType.SKILL_REGISTERED,
        "RegisterSkill": EventType.SKILL_REGISTERED,
        "Skill updated": EventType.SKILL_UPDATED,
        "UpdateSkill": EventType.SKILL_UPDATED,
        "Skill deprecated": EventType.SKILL_DEPRECATED,
        "DeprecateSkill": EventType.SKILL_DEPRECATED,
        
        # Agent
        "Agent created": EventType.AGENT_CREATED,
        "CreateIdentity": EventType.AGENT_CREATED,
        "Agent updated": EventType.AGENT_UPDATED,
        "UpdateProfile": EventType.AGENT_UPDATED,
        "Agent closed": EventType.AGENT_CLOSED,
        "CloseIdentity": EventType.AGENT_CLOSED,
        
        # Escrow
        "Escrow created": EventType.ESCROW_CREATED,
        "CreateEscrow": EventType.ESCROW_CREATED,
        "Escrow funded": EventType.ESCROW_FUNDED,
        "FundEscrow": EventType.ESCROW_FUNDED,
        "Escrow released": EventType.ESCROW_RELEASED,
        "ReleaseEscrow": EventType.ESCROW_RELEASED,
        "Escrow cancelled": EventType.ESCROW_CANCELLED,
        "CancelEscrow": EventType.ESCROW_CANCELLED,
        "Escrow disputed": EventType.ESCROW_DISPUTED,
        
        # Transfer Hook
        "Hook initialized": EventType.HOOK_INITIALIZED,
        "Hook config updated": EventType.HOOK_CONFIG_UPDATED,
        "Transfer hooked": EventType.TRANSFER_HOOKED,
        "fee_bps": EventType.TRANSFER_HOOKED,  # Hook 日志包含费率
    }
    
    @classmethod
    def parse(cls, signature: str, logs: List[str], slot: int = 0) -> Optional[ChainEvent]:
        """
        解析日志，提取事件
        
        Args:
            signature: 交易签名
            logs: 日志行列表
            slot: Slot 号
            
        Returns:
            解析后的 ChainEvent 或 None
        """
        event_type = EventType.UNKNOWN
        program_id = ""
        data: Dict[str, Any] = {}
        
        for log in logs:
            # 提取 Program ID
            if "Program " in log and " invoke" in log:
                parts = log.split()
                if len(parts) >= 2:
                    program_id = parts[1]
            
            # 检测事件类型
            for keyword, etype in cls.EVENT_KEYWORDS.items():
                if keyword in log:
                    event_type = etype
                    break
            
            # 提取数据 (简化版本)
            if "Program data:" in log:
                try:
                    b64_data = log.split("Program data:")[1].strip()
                    decoded = base64.b64decode(b64_data)
                    data["raw_data"] = decoded.hex()
                except Exception:
                    pass
            
            # 提取费率信息 (Transfer Hook)
            if "fee_bps" in log:
                try:
                    # 日志格式: "fee_bps: 500"
                    parts = log.split(":")
                    if len(parts) >= 2:
                        data["fee_bps"] = int(parts[-1].strip())
                except ValueError:
                    pass
            
            # 提取金额信息
            if "amount" in log.lower():
                try:
                    # 日志格式: "Amount: 1000000"
                    parts = log.split(":")
                    if len(parts) >= 2:
                        data["amount"] = int(parts[-1].strip())
                except ValueError:
                    pass
        
        # 只返回有效事件
        if event_type == EventType.UNKNOWN and program_id not in [EXO_CORE_PROGRAM_ID, EXO_HOOKS_PROGRAM_ID]:
            return None
        
        return ChainEvent(
            event_type=event_type,
            signature=signature,
            slot=slot,
            timestamp=datetime.utcnow(),
            program_id=program_id,
            data=data,
            raw_logs=logs,
        )


# ============================================================================
# WebSocket Listener
# ============================================================================

class ChainListener:
    """
    链上事件监听器
    
    使用 Helius WebSocket API 实时订阅 Exo Protocol 程序日志
    """
    
    def __init__(
        self,
        api_key: str,
        network: str = "devnet",
        program_ids: Optional[List[str]] = None,
    ):
        """
        初始化监听器
        
        Args:
            api_key: Helius API Key
            network: 网络类型 ("mainnet" 或 "devnet")
            program_ids: 要监听的 Program ID 列表
        """
        self.api_key = api_key
        self.network = network
        self.program_ids = program_ids or [EXO_CORE_PROGRAM_ID, EXO_HOOKS_PROGRAM_ID]
        
        # WebSocket 状态
        self._ws = None
        self._running = False
        self._reconnect_attempts = 0
        self._subscription_id: Optional[int] = None
        
        # 事件回调
        self._callbacks: List[Callable[[ChainEvent], None]] = []
        
        # 选择端点
        self._ws_url = HELIUS_WS_DEVNET if network == "devnet" else HELIUS_WS_MAINNET
    
    @property
    def ws_url(self) -> str:
        """WebSocket URL (带 API Key)"""
        return f"{self._ws_url}?api-key={self.api_key}"
    
    def on_event(self, callback: Callable[[ChainEvent], None]) -> None:
        """
        注册事件回调
        
        Args:
            callback: 回调函数，接收 ChainEvent 参数
        """
        self._callbacks.append(callback)
    
    def _emit(self, event: ChainEvent) -> None:
        """触发事件回调"""
        for callback in self._callbacks:
            try:
                callback(event)
            except Exception as e:
                logger.error(f"Event callback error: {e}")
    
    async def connect(self) -> bool:
        """
        建立 WebSocket 连接
        
        Returns:
            是否连接成功
        """
        try:
            import websockets
        except ImportError:
            logger.error("websockets library not installed. Run: pip install websockets")
            return False
        
        try:
            logger.info(f"Connecting to Helius WebSocket ({self.network})...")
            self._ws = await websockets.connect(self.ws_url)
            logger.info("WebSocket connected!")
            
            # 订阅日志
            await self._subscribe()
            
            self._reconnect_attempts = 0
            return True
            
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            return False
    
    async def _subscribe(self) -> None:
        """订阅程序日志"""
        if not self._ws:
            return
        
        # 构建订阅消息
        # 支持多 Program ID 订阅
        for i, program_id in enumerate(self.program_ids):
            subscribe_msg = {
                "jsonrpc": "2.0",
                "id": i + 1,
                "method": "logsSubscribe",
                "params": [
                    {"mentions": [program_id]},
                    {"commitment": "confirmed"}
                ]
            }
            
            await self._ws.send(json.dumps(subscribe_msg))
            logger.info(f"Subscribed to program: {program_id[:8]}...")
    
    async def _handle_message(self, message: str) -> None:
        """处理 WebSocket 消息"""
        try:
            data = json.loads(message)
            
            # 订阅确认
            if "result" in data and "method" not in data:
                self._subscription_id = data.get("result")
                logger.info(f"Subscription confirmed, ID: {self._subscription_id}")
                return
            
            # 日志通知
            if data.get("method") == "logsNotification":
                result = data.get("params", {}).get("result", {})
                value = result.get("value", {})
                
                signature = value.get("signature", "unknown")
                logs = value.get("logs", [])
                slot = result.get("context", {}).get("slot", 0)
                
                # 解析事件
                event = LogParser.parse(signature, logs, slot)
                if event:
                    logger.info(f"Event detected: {event.event_type.value} | sig: {signature[:16]}...")
                    self._emit(event)
                    
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse message: {e}")
        except Exception as e:
            logger.error(f"Message handling error: {e}")
    
    async def run(self) -> None:
        """运行监听循环"""
        self._running = True
        
        while self._running:
            # 连接
            if not await self.connect():
                self._reconnect_attempts += 1
                if self._reconnect_attempts >= MAX_RECONNECT_ATTEMPTS:
                    logger.error("Max reconnection attempts reached. Stopping.")
                    break
                
                logger.info(f"Reconnecting in {RECONNECT_DELAY}s (attempt {self._reconnect_attempts})...")
                await asyncio.sleep(RECONNECT_DELAY)
                continue
            
            # 监听消息
            try:
                async for message in self._ws:
                    await self._handle_message(message)
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
            
            # 连接断开，准备重连
            if self._running:
                logger.warning("Connection lost. Reconnecting...")
                await asyncio.sleep(RECONNECT_DELAY)
    
    async def stop(self) -> None:
        """停止监听"""
        self._running = False
        if self._ws:
            await self._ws.close()
            self._ws = None
        logger.info("Listener stopped.")


# ============================================================================
# Mock Listener (for testing)
# ============================================================================

class MockChainListener:
    """
    Mock 监听器，用于测试事件处理逻辑
    """
    
    def __init__(self):
        self._callbacks: List[Callable[[ChainEvent], None]] = []
        self._running = False
    
    def on_event(self, callback: Callable[[ChainEvent], None]) -> None:
        """注册事件回调"""
        self._callbacks.append(callback)
    
    def _emit(self, event: ChainEvent) -> None:
        """触发事件回调"""
        for callback in self._callbacks:
            try:
                callback(event)
            except Exception as e:
                logger.error(f"Event callback error: {e}")
    
    async def run(self, interval: float = 3.0) -> None:
        """运行 Mock 事件生成循环"""
        import random
        
        self._running = True
        event_count = 0
        
        mock_events = [
            (EventType.SKILL_REGISTERED, {"skill_name": "code-reviewer", "price": 100_000_000}),
            (EventType.AGENT_CREATED, {"tier": 0, "owner": "User123..."}),
            (EventType.ESCROW_CREATED, {"amount": 500_000_000, "skill": "tweet-sentiment"}),
            (EventType.ESCROW_FUNDED, {"amount": 500_000_000}),
            (EventType.TRANSFER_HOOKED, {"fee_bps": 500, "protocol_fee": 25_000_000}),
            (EventType.ESCROW_RELEASED, {"executor_share": 425_000_000}),
        ]
        
        logger.info("Mock listener started. Generating events...")
        
        while self._running:
            # 随机选择事件
            event_type, data = random.choice(mock_events)
            event_count += 1
            
            # 生成 Mock 签名
            mock_sig = f"mock_{event_count:05d}_" + "".join(
                random.choices("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz", k=44)
            )
            
            event = ChainEvent(
                event_type=event_type,
                signature=mock_sig,
                slot=random.randint(200_000_000, 300_000_000),
                timestamp=datetime.utcnow(),
                program_id=EXO_CORE_PROGRAM_ID if "HOOK" not in event_type.value else EXO_HOOKS_PROGRAM_ID,
                data=data,
            )
            
            logger.info(f"[MOCK] Event: {event.event_type.value} | sig: {event.signature[:20]}...")
            self._emit(event)
            
            await asyncio.sleep(interval)
    
    async def stop(self) -> None:
        """停止 Mock 监听"""
        self._running = False
        logger.info("Mock listener stopped.")


# ============================================================================
# CLI Entry Point
# ============================================================================

def default_event_handler(event: ChainEvent) -> None:
    """默认事件处理器：打印到控制台"""
    print(f"\n{'='*60}")
    print(f"🔔 Event: {event.event_type.value.upper()}")
    print(f"   Signature: {event.signature[:24]}...")
    print(f"   Slot: {event.slot}")
    print(f"   Program: {event.program_id[:16]}...")
    if event.data:
        print(f"   Data: {json.dumps(event.data)}")
    print(f"{'='*60}\n")


async def main():
    """CLI 入口"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Exo Protocol Chain Event Listener")
    parser.add_argument("--mainnet", action="store_true", help="Connect to mainnet")
    parser.add_argument("--devnet", action="store_true", help="Connect to devnet (default)")
    parser.add_argument("--test", action="store_true", help="Run in test mode with mock events")
    parser.add_argument("--interval", type=float, default=3.0, help="Mock event interval (seconds)")
    args = parser.parse_args()
    
    # 测试模式
    if args.test:
        logger.info("Starting in TEST mode (mock events)...")
        listener = MockChainListener()
        listener.on_event(default_event_handler)
        
        try:
            await listener.run(interval=args.interval)
        except KeyboardInterrupt:
            await listener.stop()
        return
    
    # 获取 API Key
    api_key = os.environ.get("HELIUS_API_KEY") or os.environ.get("NEXT_PUBLIC_HELIUS_API_KEY")
    if not api_key:
        logger.error("HELIUS_API_KEY or NEXT_PUBLIC_HELIUS_API_KEY environment variable not set")
        sys.exit(1)
    
    # 选择网络
    network = "mainnet" if args.mainnet else "devnet"
    
    # 创建监听器
    listener = ChainListener(
        api_key=api_key,
        network=network,
        program_ids=[EXO_CORE_PROGRAM_ID, EXO_HOOKS_PROGRAM_ID],
    )
    listener.on_event(default_event_handler)
    
    logger.info(f"Starting chain listener ({network})...")
    logger.info(f"Watching programs: {EXO_CORE_PROGRAM_ID[:8]}..., {EXO_HOOKS_PROGRAM_ID[:8]}...")
    
    try:
        await listener.run()
    except KeyboardInterrupt:
        await listener.stop()


if __name__ == "__main__":
    asyncio.run(main())
