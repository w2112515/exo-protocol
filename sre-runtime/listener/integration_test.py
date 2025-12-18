"""
Helius WebSocket 集成测试

验证能否连接 Helius WebSocket 并订阅程序日志

Usage:
    python integration_test.py
"""

import asyncio
import json
import os
import sys

# 添加模块路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from chain_listener import EXO_CORE_PROGRAM_ID, HELIUS_WS_DEVNET

async def test_helius_connection():
    """测试 Helius WebSocket 连接"""
    import websockets
    
    # 获取 API Key
    api_key = os.environ.get("HELIUS_API_KEY") or os.environ.get("NEXT_PUBLIC_HELIUS_API_KEY")
    if not api_key:
        print("ERROR: HELIUS_API_KEY not set")
        return False
    
    ws_url = f"{HELIUS_WS_DEVNET}?api-key={api_key}"
    
    print(f"Connecting to: {HELIUS_WS_DEVNET}")
    print(f"API Key: {api_key[:8]}...{api_key[-4:]}")
    
    try:
        async with websockets.connect(ws_url, close_timeout=5) as ws:
            print("Connected!")
            
            # 发送订阅请求
            subscribe_msg = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "logsSubscribe",
                "params": [
                    {"mentions": [EXO_CORE_PROGRAM_ID]},
                    {"commitment": "confirmed"}
                ]
            }
            
            await ws.send(json.dumps(subscribe_msg))
            print(f"Subscription request sent for: {EXO_CORE_PROGRAM_ID[:16]}...")
            
            # 等待响应 (最多 5 秒)
            try:
                response = await asyncio.wait_for(ws.recv(), timeout=5.0)
                data = json.loads(response)
                
                if "result" in data:
                    print(f"Subscription confirmed! ID: {data['result']}")
                    print("\n=== INTEGRATION TEST PASSED ===")
                    return True
                else:
                    print(f"Unexpected response: {data}")
                    return False
                    
            except asyncio.TimeoutError:
                print("Timeout waiting for subscription confirmation")
                return False
                
    except Exception as e:
        print(f"Connection error: {e}")
        return False


if __name__ == "__main__":
    # 从 .env.local 加载 API Key
    env_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "..", "exo-frontend", ".env.local"
    )
    
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line.startswith("NEXT_PUBLIC_HELIUS_API_KEY="):
                    key = line.split("=", 1)[1]
                    os.environ["NEXT_PUBLIC_HELIUS_API_KEY"] = key
                    print(f"Loaded API Key from .env.local")
                    break
    
    result = asyncio.run(test_helius_connection())
    sys.exit(0 if result else 1)
