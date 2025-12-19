"""
Exo Protocol - Watcher Bot
监控已提交的订单，检测并挑战恶意结果。

Usage:
    python -m bots.watcher_bot
"""

import asyncio
import logging
import os
import sys
from typing import List

# 添加 sre-runtime 到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from verifier.challenger import challenge_if_invalid, get_challenge_stats

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)


async def watch_committed_orders() -> List[str]:
    """
    监听 OrderCommitted 事件，返回需要验证的订单列表。
    
    TODO: 集成 Helius WebSocket 实时监听
    当前: 使用轮询模式
    """
    # Mock: 返回测试订单
    test_orders = os.getenv("TEST_ORDERS", "").split(",")
    return [o.strip() for o in test_orders if o.strip()]


async def run_watcher():
    """运行 Watcher 监控循环"""
    logger.info("🔍 WATCHER BOT STARTED")
    logger.info("=" * 50)
    
    while True:
        try:
            # 获取待验证订单
            orders = await watch_committed_orders()
            
            if orders:
                logger.info(f"📋 Found {len(orders)} orders to verify")
                
                for order_pubkey in orders:
                    logger.info(f"🔎 Verifying order: {order_pubkey}")
                    
                    # 验证并挑战
                    result = await challenge_if_invalid(order_pubkey)
                    
                    if result.status.value == "submitted":
                        logger.warning(f"⚔️ CHALLENGE SUBMITTED: {result.tx_signature}")
                    else:
                        logger.info(f"✅ Order valid: {order_pubkey}")
            
            # 显示统计
            stats = get_challenge_stats()
            logger.info(f"📊 Stats: {stats}")
            
            # 等待下一轮
            await asyncio.sleep(5)
            
        except KeyboardInterrupt:
            logger.info("🛑 Watcher stopped by user")
            break
        except Exception as e:
            logger.exception(f"❌ Watcher error: {e}")
            await asyncio.sleep(10)


if __name__ == "__main__":
    asyncio.run(run_watcher())
