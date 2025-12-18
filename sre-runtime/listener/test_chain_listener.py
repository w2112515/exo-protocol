"""
Chain Listener 单元测试

测试事件解析逻辑和 Mock 监听器
"""

import pytest
from datetime import datetime, timedelta
from typing import List

from chain_listener import (
    ChainEvent,
    EventType,
    LogParser,
    MockChainListener,
    EXO_CORE_PROGRAM_ID,
    EXO_HOOKS_PROGRAM_ID,
)


# ============================================================================
# LogParser Tests
# ============================================================================

class TestLogParser:
    """LogParser 测试类"""
    
    def test_parse_skill_registered_event(self):
        """测试解析 Skill 注册事件"""
        logs = [
            f"Program {EXO_CORE_PROGRAM_ID} invoke [1]",
            "Program log: Skill registered: code-reviewer",
            "Program log: price: 100000000",
            f"Program {EXO_CORE_PROGRAM_ID} success",
        ]
        
        event = LogParser.parse("sig123", logs, slot=12345)
        
        assert event is not None
        assert event.event_type == EventType.SKILL_REGISTERED
        assert event.signature == "sig123"
        assert event.slot == 12345
        assert event.program_id == EXO_CORE_PROGRAM_ID
    
    def test_parse_escrow_created_event(self):
        """测试解析 Escrow 创建事件"""
        logs = [
            f"Program {EXO_CORE_PROGRAM_ID} invoke [1]",
            "Program log: Escrow created",
            "Program log: amount: 500000000",
            f"Program {EXO_CORE_PROGRAM_ID} success",
        ]
        
        event = LogParser.parse("sig456", logs, slot=12346)
        
        assert event is not None
        assert event.event_type == EventType.ESCROW_CREATED
        assert event.data.get("amount") == 500000000
    
    def test_parse_transfer_hook_event(self):
        """测试解析 Transfer Hook 事件"""
        logs = [
            f"Program {EXO_HOOKS_PROGRAM_ID} invoke [1]",
            "Program log: Transfer hooked",
            "Program log: fee_bps: 500",
            f"Program {EXO_HOOKS_PROGRAM_ID} success",
        ]
        
        event = LogParser.parse("sig789", logs, slot=12347)
        
        assert event is not None
        assert event.event_type == EventType.TRANSFER_HOOKED
        assert event.data.get("fee_bps") == 500
    
    def test_parse_agent_created_event(self):
        """测试解析 Agent 创建事件"""
        logs = [
            f"Program {EXO_CORE_PROGRAM_ID} invoke [1]",
            "Program log: Agent created",
            f"Program {EXO_CORE_PROGRAM_ID} success",
        ]
        
        event = LogParser.parse("sigabc", logs, slot=12348)
        
        assert event is not None
        assert event.event_type == EventType.AGENT_CREATED
    
    def test_parse_unknown_program_returns_none(self):
        """测试未知程序日志返回 None"""
        logs = [
            "Program OtherProgram111111111111111111111111 invoke [1]",
            "Program log: Some other event",
            "Program OtherProgram111111111111111111111111 success",
        ]
        
        event = LogParser.parse("sigxyz", logs, slot=12349)
        
        assert event is None
    
    def test_parse_empty_logs(self):
        """测试空日志"""
        event = LogParser.parse("sig000", [], slot=0)
        
        # 应该返回 None (未知事件且非 Exo 程序)
        assert event is None


# ============================================================================
# ChainEvent Tests
# ============================================================================

class TestChainEvent:
    """ChainEvent 测试类"""
    
    def test_to_dict(self):
        """测试转换为字典"""
        event = ChainEvent(
            event_type=EventType.SKILL_REGISTERED,
            signature="testsig123",
            slot=12345,
            timestamp=datetime(2024, 12, 16, 10, 0, 0),
            program_id=EXO_CORE_PROGRAM_ID,
            data={"skill_name": "test-skill"},
        )
        
        result = event.to_dict()
        
        assert result["event_type"] == "skill_registered"
        assert result["signature"] == "testsig123"
        assert result["slot"] == 12345
        assert result["data"]["skill_name"] == "test-skill"
    
    def test_to_json(self):
        """测试转换为 JSON"""
        event = ChainEvent(
            event_type=EventType.ESCROW_FUNDED,
            signature="testsig456",
            slot=12346,
            timestamp=datetime(2024, 12, 16, 10, 0, 0),
            program_id=EXO_CORE_PROGRAM_ID,
            data={"amount": 1000000},
        )
        
        json_str = event.to_json()
        
        assert '"event_type": "escrow_funded"' in json_str
        assert '"amount": 1000000' in json_str


# ============================================================================
# MockChainListener Tests
# ============================================================================

class TestMockChainListener:
    """MockChainListener 测试类"""
    
    def test_event_callback_registration(self):
        """测试事件回调注册"""
        listener = MockChainListener()
        received_events: List[ChainEvent] = []
        
        def handler(event: ChainEvent):
            received_events.append(event)
        
        listener.on_event(handler)
        
        # 手动触发事件
        test_event = ChainEvent(
            event_type=EventType.SKILL_REGISTERED,
            signature="test123",
            slot=100,
            timestamp=datetime.utcnow(),
            program_id=EXO_CORE_PROGRAM_ID,
        )
        listener._emit(test_event)
        
        assert len(received_events) == 1
        assert received_events[0].signature == "test123"
    
    def test_multiple_callbacks(self):
        """测试多个回调"""
        listener = MockChainListener()
        call_count = {"count": 0}
        
        def handler1(event: ChainEvent):
            call_count["count"] += 1
        
        def handler2(event: ChainEvent):
            call_count["count"] += 10
        
        listener.on_event(handler1)
        listener.on_event(handler2)
        
        test_event = ChainEvent(
            event_type=EventType.AGENT_CREATED,
            signature="test456",
            slot=200,
            timestamp=datetime.utcnow(),
            program_id=EXO_CORE_PROGRAM_ID,
        )
        listener._emit(test_event)
        
        assert call_count["count"] == 11


# ============================================================================
# Integration Test (Mock)
# ============================================================================

@pytest.mark.asyncio
async def test_mock_listener_generates_events():
    """测试 Mock 监听器生成事件"""
    import asyncio
    
    listener = MockChainListener()
    events: List[ChainEvent] = []
    
    def handler(event: ChainEvent):
        events.append(event)
    
    listener.on_event(handler)
    
    # 启动监听 (短暂运行)
    async def run_briefly():
        task = asyncio.create_task(listener.run(interval=0.1))
        await asyncio.sleep(0.35)  # 等待生成 3+ 个事件
        await listener.stop()
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
    
    await run_briefly()
    
    # 应该收到至少 3 个事件
    assert len(events) >= 3
    assert all(isinstance(e, ChainEvent) for e in events)


# ============================================================================
# Run Tests
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
