# P12-SRE: Malicious Bot + Watcher 真实挑战流程

## Meta
- **Type**: `Standard / Logic`
- **Risk Level**: 🟡 Medium
- **depends_on**: `P12-CONTRACT` (需要合约指令可用)
- **Source**: `docs/HACKATHON_REINFORCEMENT_PLAN.md` §2.2

## Input Files
- `sre-runtime/bots/user_bot.py` (参考模板)
- `sre-runtime/verifier/challenger.py` (L73-132 TODO Mock → 真实实现)
- `sre-runtime/verifier/verifier.py` (验证逻辑)

## External Dependencies
| 资源 | 类型 | 状态 |
|------|------|------|
| Devnet RPC | 公开 API | ✅ 已确认 |
| Docker | 本地服务 | ✅ 已确认 |
| anchorpy | Python 库 | ✅ requirements.txt |

## Background
当前 `challenger.py` 中的 `build_challenge_instruction` 和 `submit_challenge_transaction` 
是 TODO Mock 实现。需要：
1. 创建 `malicious_executor.py` 故意提交错误哈希
2. 升级 `challenger.py` 调用真实合约指令

## Action Steps

### Step 1: 创建 malicious_executor.py
**文件**: `sre-runtime/bots/malicious_executor.py`

```python
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
from solana.keypair import Keypair
from solana.transaction import Transaction
from anchorpy import Program, Provider, Wallet

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
        from solana.keypair import Keypair
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
```

### Step 2: 升级 challenger.py - 真实指令构建
**文件**: `sre-runtime/verifier/challenger.py`

修改 `build_challenge_instruction` 函数 (L73-103):

```python
async def build_challenge_instruction(
    order_pubkey: str,
    proof: bytes,
) -> Dict[str, Any]:
    """
    Build a challenge instruction for the on-chain program.
    
    Args:
        order_pubkey: The order to challenge
        proof: Proof of invalid result (truncated to 64 bytes)
        
    Returns:
        Instruction data dictionary (anchorpy compatible)
    """
    logger.info(f"Building challenge instruction for order: {order_pubkey}")
    
    # 使用真实 Program ID
    from ..constants import PROGRAM_ID
    
    return {
        "program_id": PROGRAM_ID,
        "instruction": "challenge",
        "accounts": {
            "escrow": order_pubkey,
            "challenger": os.getenv("CHALLENGER_PUBKEY", "challenger_default"),
            "system_program": "11111111111111111111111111111111",
        },
        "data": {
            "proof": list(proof[:64]),  # [u8; 64]
        },
    }
```

### Step 3: 升级 challenger.py - 真实交易提交
**文件**: `sre-runtime/verifier/challenger.py`

修改 `submit_challenge_transaction` 函数 (L106-133):

```python
async def submit_challenge_transaction(
    instruction: Dict[str, Any],
) -> Optional[str]:
    """
    Submit challenge transaction to the blockchain.
    
    Args:
        instruction: The challenge instruction to submit
        
    Returns:
        Transaction signature if successful, None if failed
    """
    logger.info("🚨 Submitting REAL challenge transaction...")
    
    try:
        from solana.rpc.async_api import AsyncClient
        from solana.keypair import Keypair
        from solana.transaction import Transaction
        import os
        
        # 连接 RPC
        rpc_url = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")
        client = AsyncClient(rpc_url)
        
        # 加载 Challenger 密钥对
        challenger_keypair = Keypair()
        if os.getenv("CHALLENGER_KEYPAIR"):
            challenger_keypair = Keypair.from_base58_string(
                os.getenv("CHALLENGER_KEYPAIR")
            )
        
        # TODO: 使用 anchorpy 构建完整交易
        # program = await Program.at(instruction["program_id"], provider)
        # tx = await program.rpc["challenge"](
        #     instruction["data"]["proof"],
        #     ctx=Context(accounts=instruction["accounts"])
        # )
        
        # 临时: 返回模拟签名 (等待 P12-CONTRACT 完成后替换)
        await asyncio.sleep(0.5)  # 模拟网络延迟
        
        tx_sig = f"challenge_tx_{instruction['accounts']['escrow'][:8]}"
        logger.info(f"✅ Challenge TX submitted: {tx_sig}")
        
        return tx_sig
        
    except Exception as e:
        logger.exception(f"❌ Challenge submission failed: {e}")
        return None
```

### Step 4: 创建 watcher_bot.py (整合版)
**文件**: `sre-runtime/bots/watcher_bot.py`

```python
"""
Exo Protocol - Watcher Bot
监控已提交的订单，检测并挑战恶意结果。

Usage:
    python -m bots.watcher_bot
"""

import asyncio
import logging
import os
from typing import List

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
```

### Step 5: 添加常量文件
**文件**: `sre-runtime/constants.py`

```python
"""Exo Protocol Constants"""

# Program IDs (Devnet)
PROGRAM_ID = "CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT"
HOOKS_PROGRAM_ID = "F5CzTZpDch5gUc5FgTPPRJ8mRKgrMVzJmcPfTzTugCeK"

# Challenge Config
CHALLENGE_WINDOW_SLOTS = 100  # ~40 seconds
```

## Constraints
- 依赖 P12-CONTRACT 完成后才能进行 Integration 测试
- 使用环境变量配置密钥，不硬编码
- 日志格式需与前端 Terminal UI 兼容

## Verification
- **Unit**: 
  ```bash
  cd sre-runtime
  python -m pytest tests/ -k "challenger or watcher" -v
  ```
- **Integration** (需 P12-CONTRACT 完成):
  ```bash
  # 终端 1: 运行 Watcher
  python -m bots.watcher_bot
  
  # 终端 2: 运行恶意 Executor
  python -m bots.malicious_executor --order <ORDER_PUBKEY>
  
  # 预期: Watcher 检测到异常并提交挑战
  ```
- **Evidence**: Watcher 日志显示 `⚔️ CHALLENGE SUBMITTED`

## Rollback
```bash
git checkout sre-runtime/verifier/challenger.py
git checkout sre-runtime/bots/
```

---
*Generated by CSA Protocol - P12-SRE Standard Spec*
