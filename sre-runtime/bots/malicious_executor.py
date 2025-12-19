"""
Exo Protocol - Malicious Executor Bot
用于演示: 故意提交错误的 Result Hash，模拟恶意行为。

Usage:
    python -m bots.malicious_executor --order <ORDER_PUBKEY>
"""

import asyncio
import hashlib
import logging
import os
from solana.rpc.async_api import AsyncClient
from solders.keypair import Keypair
from solders.pubkey import Pubkey

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 配置
RPC_URL = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")
PROGRAM_ID = "CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT"


async def submit_malicious_result(order_pubkey: str) -> str:
    """
    提交一个故意错误的结果哈希。
    
    正常 Executor 会计算: hash(真实执行结果)
    恶意 Executor 提交: hash("MALICIOUS_FAKE_RESULT")
    """
    logger.warning("🦹 MALICIOUS EXECUTOR ACTIVATED")
    
    # 生成假的结果哈希
    fake_result = "MALICIOUS_FAKE_RESULT_" + order_pubkey[:8]
    fake_hash = hashlib.sha256(fake_result.encode()).digest()
    
    logger.info(f"📛 Fake result hash: {fake_hash.hex()[:16]}...")
    
    # 连接 RPC
    client = AsyncClient(RPC_URL)
    
    # 加载 Executor 密钥对 (从环境变量或文件)
    executor_keypair = Keypair()  # Demo: 使用临时密钥
    if os.getenv("EXECUTOR_KEYPAIR"):
        # 从 base58 加载
        executor_keypair = Keypair.from_base58_string(os.getenv("EXECUTOR_KEYPAIR"))
    
    # 构建 commit_result 指令
    # TODO: 使用 anchorpy 构建真实指令
    # 以下为伪代码示意
    """
    program = await Program.at(PROGRAM_ID, Provider(client, Wallet(executor_keypair)))
    tx = await program.rpc["commit_result"](
        list(fake_hash),  # result_hash: [u8; 32]
        ctx=Context(
            accounts={
                "escrow": order_pubkey,
                "skill": skill_pubkey,  # 从 escrow 账户读取
                "executor": executor_keypair.pubkey(),
            }
        )
    )
    """
    
    # Mock 返回
    logger.info(f"✅ Malicious result submitted for order: {order_pubkey}")
    await client.close()
    return f"mock_malicious_tx_{order_pubkey[:8]}"


async def run_malicious_demo():
    """运行恶意演示流程"""
    # 1. 监听新订单
    logger.info("👀 Watching for new orders...")
    
    # 2. Demo: 使用固定的测试订单
    test_order = os.getenv("TEST_ORDER_PUBKEY", "demo_order_pubkey")
    
    # 3. 提交恶意结果
    tx_sig = await submit_malicious_result(test_order)
    
    logger.warning(f"🦹 Malicious submission complete: {tx_sig}")
    logger.warning("⏳ Waiting for Watcher to detect and challenge...")
    
    return tx_sig


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Malicious Executor Bot")
    parser.add_argument("--order", type=str, help="Order pubkey to attack")
    args = parser.parse_args()
    
    if args.order:
        asyncio.run(submit_malicious_result(args.order))
    else:
        asyncio.run(run_malicious_demo())
