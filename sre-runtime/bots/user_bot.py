"""
Exo Protocol - User Traffic Simulator Bot
模拟真实用户流量，生成随机订单以驱动 Dashboard 演示。

依赖:
    - Node.js 环境 (用于运行 TS 脚本)
    - scripts/run-demo.ts
"""

import subprocess
import time
import random
import logging
import sys
import os

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [USER-BOT] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("UserBot")

def run_demo_transaction():
    """调用 run-demo.ts 执行一次完整的 Skill 交易流程"""
    try:
        # 获取项目根目录
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # sre-runtime/bots -> sre-runtime -> root
        project_root = os.path.dirname(os.path.dirname(current_dir))
        script_path = os.path.join(project_root, "scripts", "run-demo.ts")
        
        logger.info("🚀 Initiating new Skill execution...")
        
        # 使用 npx tsx 执行脚本
        # 注意: Windows 下可能需要 shell=True
        process = subprocess.run(
            ["npx", "tsx", script_path],
            capture_output=True,
            text=True,
            shell=True if sys.platform == "win32" else False,
            cwd=project_root
        )
        
        if process.returncode == 0:
            logger.info("✅ Transaction sequence completed successfully!")
            # 提取签名以便在日志中展示
            for line in process.stdout.split('\n'):
                if "Tx Signature" in line:
                    logger.info(line.strip())
        else:
            logger.error(f"❌ Transaction failed: {process.stderr}")
            
    except Exception as e:
        logger.error(f"Error executing transaction: {e}")

def main():
    logger.info("🤖 Exo User Bot starting...")
    logger.info("   Target: Devnet")
    logger.info("   Action: Simulating continuous user activity")
    
    try:
        while True:
            # 执行交易
            run_demo_transaction()
            
            # 随机等待 5-15 秒，模拟真实用户间隔
            delay = random.uniform(5, 15)
            logger.info(f"😴 Waiting {delay:.1f}s before next order...")
            time.sleep(delay)
            
    except KeyboardInterrupt:
        logger.info("\n🛑 Bot stopped by user")

if __name__ == "__main__":
    main()
