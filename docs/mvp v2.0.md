# Exo Protocol: Solana 黑客松 MVP v2.0 执行方案

**版本**: 2.2.0 | **代号**: Skill-Native PayFi for Agent Economy
**发布日期**: 2024-12-14
**V5.0 对齐**: Tool Annotations + Schema 验证增强
**V2.2 更新**: Challenger 机制 + DA 流程 + Blinks 范围锁定 (ADR-009/010)
**目标赛事**: Solana Colosseum Hackathon (Renaissance/Radar/Breakpoint)

---

## 执行摘要

本方案是城邦 V5.0 总纲的**黑客松精简实现**，聚焦 **AI Agent 经济体 + PayFi** 双蓝海赛道。

**核心叙事**：为 Agent Economy 提供标准化的**能力交易**与**链上强制结算层**。

**技术壁垒**：
- Token-2022 Transfer Hooks (链级强制分账)
- State Compression cNFT (低成本 Agent 身份)
- Blinks (Twitter 嵌入式交互)
- Optimistic Execution (乐观执行 + 挑战回滚)

**OPOS 得分点**: 4/5 Solana 独有技术特性

---

## 目录

1. [架构总览](#1-架构总览)
2. [Phase 0: 标准定义](#2-phase-0-标准定义-day-1-2)
3. [Phase 1: 协议层](#3-phase-1-协议层-week-1)
4. [Phase 2: SRE 运行时](#4-phase-2-sre-运行时-week-2)
5. [Phase 3: 交互层](#5-phase-3-交互层-week-3)
6. [Phase 4: 交付与演示](#6-phase-4-交付与演示-week-4)
7. [代码仓库结构](#7-代码仓库结构)
8. [技术规范](#8-技术规范)
9. [风险与缓解](#9-风险与缓解)
10. [验收清单](#10-验收清单)

---

## 1. 架构总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Exo Protocol 架构                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     交互层 (Phase 3)                                │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │   │
│   │   │ Blinks API   │  │  Dashboard   │  │  TS SDK      │             │   │
│   │   │ (Twitter嵌入) │  │  (开发者)    │  │ (@exo/sdk)   │             │   │
│   │   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │   │
│   └──────────┼─────────────────┼─────────────────┼─────────────────────┘   │
│              │                 │                 │                         │
│   ┌──────────┴─────────────────┴─────────────────┴─────────────────────┐   │
│   │                     SRE 运行时 (Phase 2)                           │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │   │
│   │   │  Executor    │  │  Sandbox     │  │  Committer   │             │   │
│   │   │  (事件监听)   │  │  (Docker)    │  │  (结果提交)   │             │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘             │   │
│   │   ┌──────────────────────────────────────────────────┐             │   │
│   │   │  Bots: User / Executor / Watcher (压力测试)      │             │   │
│   │   └──────────────────────────────────────────────────┘             │   │
│   └────────────────────────────────┬───────────────────────────────────┘   │
│                                    │                                       │
│   ┌────────────────────────────────┴───────────────────────────────────┐   │
│   │                     协议层 (Phase 1)                               │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │   │
│   │   │ Skill        │  │ Agent        │  │ Escrow       │             │   │
│   │   │ Registry     │  │ Identity     │  │ Settlement   │             │   │
│   │   │ (NFT铸造)    │  │ (cNFT凭证)   │  │ (托管分账)   │             │   │
│   │   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │   │
│   │          └─────────────────┴─────────────────┘                     │   │
│   │                            │                                       │   │
│   │   ┌────────────────────────┴────────────────────────────────────┐  │   │
│   │   │         Token-2022 Transfer Hook (自动税收/版税)            │  │   │
│   │   └─────────────────────────────────────────────────────────────┘  │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     基础设施                                        │   │
│   │   Solana Devnet/Mainnet │ Arweave (存储) │ Helius RPC │ Docker     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 核心数据流

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Blink  │───▶│  链上   │───▶│  SRE    │───▶│  链上   │───▶│  结算   │
│  下单   │    │  锁定   │    │  执行   │    │  提交   │    │  释放   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼
 用户签名      Escrow.Open    Docker沙盒    Escrow.Commit   Transfer Hook
                                             (Hash上链)      (自动分账)
                                                  │
                                                  ▼
                                           ┌─────────────┐
                                           │ 挑战窗口    │
                                           │ (100 blocks │
                                           │  ≈40秒)     │
                                           └─────────────┘
```

---

## 2. Phase 0: 标准定义 (Day 1-2)

### 2.1 SKILL.md JSON Schema

**文件位置**: `docs/SKILL_SCHEMA.md`

```yaml
# SKILL.md 规范 v1.1
# 基于城邦 V5.0 §7.3 标准 + V5.0 新增 Tool Annotations

---
# 元数据 (必填)
name: string                    # Skill 唯一标识符 (kebab-case)
version: string                 # 语义化版本号 (semver)
description: string             # 简短描述 (<100字符)
author: string                  # 创作者 Solana 地址

# 定价 (必填)
pricing:
  model: "per_call" | "subscription"  # MVP 仅支持 per_call
  price_lamports: number              # 单次调用价格 (lamports)
  
# 运行时要求 (必填)
runtime:
  docker_image: string          # 标准镜像 (exo-runtime-python-3.11)
  docker_image_hash: string     # SHA256 哈希 (确定性构建)
  entrypoint: string            # 入口脚本 (scripts/main.py)
  timeout_seconds: number       # 最大执行时间 (默认60)

# 输入输出 Schema (必填)
io:
  input_schema:                 # JSON Schema
    type: object
    properties: {}
    additionalProperties: false # 【V2.1 新增】禁止额外字段，防止注入
    maxProperties: 20           # 【V2.1 新增】限制最大属性数
  output_schema:                # JSON Schema
    type: object
    properties: {}

# 【V2.1 新增】Tool Annotations - 行为注解 (可选，默认值如下)
# 参考: 城邦 V5.0 §7.3.2.1
annotations:
  readOnlyHint: true            # 工具只读，不修改环境 (默认 true)
  destructiveHint: false        # 工具不执行破坏性操作 (默认 false)
  idempotentHint: true          # 重复调用无副作用 (默认 true, 沙盒可重放)
  openWorldHint: false          # 工具不与外部系统交互 (默认 false, 网络禁用)

# 审计状态 (链上维护)
# audit_status: Unverified | Optimistic | Audited
---

# Skill 说明文档 (Markdown)

## 功能描述
...

## 使用示例
...
```

### 2.2 Agent Identity 标准

**文件位置**: `docs/AGENT_STANDARD.md`

```yaml
# Agent Identity cNFT 标准 v1.0

## 元数据结构
metadata:
  name: "Exo Agent #{id}"
  symbol: "EXOAGENT"
  uri: "arweave://{tx_id}"      # 指向完整元数据 JSON

## 链上账户结构
AgentIdentity:
  owner: Pubkey                 # 所有者钱包
  tier: u8                      # 0=Open, 1=Verified, 2=Premium
  total_earnings: u64           # 累计收入 (lamports)
  total_tasks: u64              # 累计完成任务数
  reputation_score: u16         # 信誉分 (0-10000, 默认5000)
  created_at: i64               # 创建时间戳
  bump: u8                      # PDA bump

## Tier 升级规则
- Tier 0 → 1: total_earnings >= 1 SOL
- Tier 1 → 2: total_earnings >= 10 SOL && reputation_score >= 8000
```

### 2.3 示例 Skill 包

创建 5 个示例 Skill 验证 Schema 通用性：

| Skill Name | 类型 | 输入 | 输出 | annotations |
|------------|------|------|------|-------------|
| `token-analyzer` | 数据分析 | Token Address | 安全评分 + 报告 | readOnly✅ idempotent✅ |
| `tweet-sentiment` | NLP | 推文内容 | 情感分数 | readOnly✅ idempotent✅ |
| `code-reviewer` | 代码审计 | 代码片段 | 问题列表 | readOnly✅ idempotent✅ |
| `image-generator` | 生成式 | Prompt | 图片 URL | openWorld✅ (API调用) |
| `price-oracle` | 数据获取 | Token Symbol | 当前价格 | openWorld✅ (API调用) |

---

## 3. Phase 1: 协议层 (Week 1)

### 3.1 技术栈

| 组件 | 技术选型 | 版本 |
|------|----------|------|
| 合约框架 | Anchor | 0.30.x |
| Token 标准 | Token-2022 | - |
| 身份凭证 | Metaplex Bubblegum (cNFT) | - |
| 测试 | Bankrun + TypeScript | - |

### 3.2 合约模块

#### 3.2.1 Skill Registry (技能注册表)

**文件**: `anchor/programs/exo-core/src/instructions/register_skill.rs`

```rust
// 账户结构
#[account]
pub struct SkillAccount {
    pub authority: Pubkey,           // 创作者地址
    pub content_hash: [u8; 32],      // SKILL.md Arweave TxID 哈希
    pub price_lamports: u64,         // 单次调用价格
    pub total_calls: u64,            // 累计调用次数
    pub total_revenue: u64,          // 累计收入
    pub version: u8,                 // 版本号
    pub audit_status: AuditStatus,   // 审计状态
    pub created_at: i64,             // 创建时间
    pub bump: u8,                    // PDA bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AuditStatus {
    Unverified,     // 未验证 (任何人可用)
    Optimistic,     // 乐观上架 (质押保证金)
    Audited,        // 通过审计 (Verifier签名)
}

// 关键指令
- register_skill(content_hash, price_lamports)
- update_skill(new_content_hash, new_price)  // 版本号自增
- deprecate_skill()                          // 下架
```

**PDA 种子**: `["skill", authority, name_hash]`

#### 3.2.2 Agent Identity (身份凭证)

**文件**: `anchor/programs/exo-core/src/instructions/create_agent.rs`

```rust
// 账户结构
#[account]
pub struct AgentIdentity {
    pub owner: Pubkey,               // 所有者
    pub tier: u8,                    // 0/1/2
    pub total_earnings: u64,         // 累计收入
    pub total_tasks: u64,            // 累计任务数
    pub reputation_score: u16,       // 信誉分 (0-10000)
    pub created_at: i64,
    pub bump: u8,
}

// 关键指令
- create_agent()                     // 铸造 Agent 身份
- upgrade_tier()                     // 升级 Tier (检查条件)
- update_reputation(delta: i16)      // 更新信誉分 (仅协议可调用)
```

**PDA 种子**: `["agent", owner]`

#### 3.2.3 Escrow Settlement (托管结算)

**文件**: `anchor/programs/exo-core/src/instructions/escrow.rs`

```rust
// 订单状态机
pub enum OrderStatus {
    Open,           // 甲方已存款
    Committed,      // 乙方已提交结果
    Challenged,     // 进入挑战期
    Finalized,      // 结算完成
    Disputed,       // 争议中
    Refunded,       // 已退款
}

// 账户结构
#[account]
pub struct Order {
    pub client: Pubkey,              // 甲方 (下单者)
    pub executor: Pubkey,            // 乙方 (执行者)
    pub skill: Pubkey,               // 关联 Skill
    pub amount: u64,                 // 托管金额
    pub result_hash: [u8; 32],       // 结果哈希 (乙方提交)
    pub status: OrderStatus,
    pub commit_slot: u64,            // 提交时的 slot
    pub challenge_window: u64,       // 挑战窗口 (默认100 blocks)
    pub created_at: i64,
    pub bump: u8,
}

// 关键指令
- create_order(skill, amount)        // 创建订单 + 存款
- commit_result(result_hash)         // 提交结果哈希
- finalize()                         // 结算 (挑战窗口后)
- challenge(proof)                   // 发起挑战
- resolve_dispute(winner)            // 解决争议 (MVP: 管理员权限)
```

**状态机流程**:
```
Open ──commit──▶ Committed ──wait 100 blocks──▶ Finalized
                     │                              │
                     │◀───challenge───┐             │
                     ▼                │             ▼
                 Disputed ──resolve──▶ Finalized/Refunded
```

> **📋 NOTE: MVP 简化版状态机**
> 
> 当前 MVP 实现**简化版状态机**：`Open → Committed → Finalized`
> 
> - ✅ **已实现**: `create_order`, `commit_result`, `finalize`
> - ⏳ **v2.1 规划**: `challenge`, `resolve_dispute` (挑战窗口机制)
> 
> 简化原因: 黑客松 Demo 聚焦核心 PayFi 流程，挑战机制作为安全增强在后续版本实现。

#### 3.2.4 Token-2022 Transfer Hook

**文件**: `anchor/programs/exo-hooks/src/lib.rs`

**核心逻辑**: 当 Escrow 结算时，Hook 自动分账

```rust
// Transfer Hook 执行逻辑
pub fn execute_transfer_hook(
    ctx: Context<ExecuteTransferHook>,
    amount: u64,
) -> Result<()> {
    // 1. 检查是否为 Escrow 结算 (通过 ExtraAccountMeta)
    // 2. 计算分账
    let protocol_fee = amount * 5 / 100;    // 5% 协议费
    let creator_royalty = amount * 10 / 100; // 10% 创作者版税
    let executor_amount = amount - protocol_fee - creator_royalty;
    
    // 3. 执行分账转账
    // ... CPI 调用
    
    Ok(())
}
```

**分账规则**:
| 接收方 | 比例 | 说明 |
|--------|------|------|
| 协议国库 | 5% | 用于生态发展 |
| Skill 创作者 | 10% | 版税 |
| Executor | 85% | 执行者收入 |

### 3.3 测试覆盖

```typescript
// tests/skill.test.ts
describe("Skill Registry", () => {
  it("should register a new skill", async () => {});
  it("should update skill with version increment", async () => {});
  it("should deprecate skill", async () => {});
});

// tests/agent.test.ts
describe("Agent Identity", () => {
  it("should create agent identity", async () => {});
  it("should upgrade tier when conditions met", async () => {});
});

// tests/escrow.test.ts
describe("Escrow Settlement", () => {
  it("should create order and lock funds", async () => {});
  it("should commit result and start challenge window", async () => {});
  it("should finalize after challenge window", async () => {});
  it("should handle challenge correctly", async () => {});
});

// tests/hook.test.ts
describe("Transfer Hook", () => {
  it("should split payment correctly", async () => {});
});
```

### 3.4 基础设施配置

```bash
# Arweave 上传脚本
npm install @irys/sdk

# Helius RPC 配置
HELIUS_API_KEY=xxx
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}

# 部署配置 (Anchor.toml)
[programs.devnet]
exo_core = "ExoC..."
exo_hooks = "ExoH..."

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```

---

## 4. Phase 2: SRE 运行时 (Week 2)

### 4.1 技术栈

| 组件 | 技术选型 |
|------|----------|
| 语言 | Python 3.11 |
| 链交互 | solana-py / anchorpy |
| 容器 | Docker |
| 消息队列 | Redis (可选) |

### 4.2 Executor 模块

**文件**: `sre-runtime/executor/`

#### 4.2.1 Listener (链上事件监听)

```python
# listener.py
import asyncio
from solana.rpc.websocket_api import connect
from anchorpy import Program

async def listen_orders(program: Program):
    """监听 OrderCreated 事件"""
    async with connect(HELIUS_WS_URL) as ws:
        await ws.logs_subscribe(
            filter_={"mentions": [str(program.program_id)]}
        )
        async for msg in ws:
            if "OrderCreated" in str(msg):
                order_pubkey = parse_order_pubkey(msg)
                await process_order(order_pubkey)

async def process_order(order_pubkey: str):
    """处理新订单"""
    # 1. 获取订单详情
    order = await fetch_order(order_pubkey)
    
    # 2. 获取 Skill 信息
    skill = await fetch_skill(order.skill)
    
    # 3. 从 Arweave 下载 SKILL.md
    skill_package = await fetch_from_arweave(skill.content_hash)
    
    # 4. 执行任务
    result = await execute_in_sandbox(skill_package, order.input)
    
    # 5. 提交结果
    await commit_result(order_pubkey, result)
```

#### 4.2.2 Sandbox (Docker 沙盒执行)

```python
# sandbox.py
import docker
import hashlib

def execute_in_sandbox(skill_package: dict, input_data: dict) -> dict:
    """在隔离 Docker 容器中执行 Skill"""
    client = docker.from_env()
    
    # 0. 【V2.1 新增】输入验证 - 防止注入攻击
    input_json = json.dumps(input_data)
    if len(input_json) > 100_000:  # 100KB 限制
        raise ValueError("Input too large")
    if len(input_data.keys()) > 20:  # 最大属性数限制
        raise ValueError("Too many input fields")
    
    # 1. 验证镜像哈希
    image = skill_package["runtime"]["docker_image"]
    expected_hash = skill_package["runtime"]["docker_image_hash"]
    # ... 验证逻辑
    
    # 2. 启动容器
    container = client.containers.run(
        image=image,
        command=f"python {skill_package['runtime']['entrypoint']}",
        environment={"INPUT_JSON": json.dumps(input_data)},
        mem_limit="512m",
        cpu_period=100000,
        cpu_quota=50000,  # 50% CPU
        network_disabled=True,  # 禁用网络
        detach=True,
        remove=True,
    )
    
    # 3. 等待执行完成
    timeout = skill_package["runtime"]["timeout_seconds"]
    result = container.wait(timeout=timeout)
    
    # 4. 获取输出
    output = container.logs().decode()
    return json.loads(output)
```

#### 4.2.3 Committer (结果提交 - V2.2 增强)

> **ADR-010**: 优化方案审计 - 数据可用性 (DA) 流程明确

**文件**: `sre-runtime/executor/committer.py`

```python
# committer.py
import hashlib
import json
from solana.transaction import Transaction

async def commit_result(order_pubkey: str, result: dict):
    """
    提交结果到链上 (完整 DA 流程)
    
    流程:
    1. 结果 JSON → 上传存储 → 获取 URL
    2. hash(URL + content) → 上链
    3. 前端通过 URL 检索结果
    """
    # 1. 序列化结果
    result_json = json.dumps(result, sort_keys=True)
    
    # 2. 上传到存储层 (Arweave/Irys 或降级方案)
    storage_url = await upload_result(result_json)
    
    # 3. 计算复合哈希 (URL + 内容)
    composite = f"{storage_url}:{result_json}"
    result_hash = hashlib.sha256(composite.encode()).digest()
    
    # 4. 构建链上交易 (存储 URL 和 Hash)
    ix = program.instruction["commit_result"](
        result_hash=list(result_hash),
        result_url=storage_url,  # V2.2: 链上存储 URL
        ctx=Context(
            accounts={
                "order": order_pubkey,
                "executor": executor_keypair.pubkey(),
                # ...
            }
        )
    )
    
    # 5. 发送交易
    tx = Transaction().add(ix)
    await client.send_transaction(tx, executor_keypair)
    
    return {"hash": result_hash.hex(), "url": storage_url}

async def upload_result(result_json: str) -> str:
    """
    上传结果到存储层
    
    优先级: Arweave/Irys > GitHub Gist > 本地存储
    (ADR-003: 黑客松降级为本地/GitHub)
    """
    try:
        # 尝试 Arweave/Irys
        return await upload_to_arweave(result_json)
    except Exception:
        # 降级: GitHub Gist
        return await upload_to_gist(result_json)
```

**前端读取流程**:
```typescript
// Dashboard 获取结果
const order = await program.account.order.fetch(orderPubkey);
const resultUrl = order.resultUrl;  // 链上存储的 URL
const result = await fetch(resultUrl).then(r => r.json());
```

#### 4.2.4 Verifier (结果验证 - V2.2 新增)

> **ADR-010**: 优化方案审计 - Challenger 机制补充

**文件**: `sre-runtime/verifier/`

```python
# verifier.py
import hashlib
from typing import Optional

async def verify_result(order_pubkey: str) -> Optional[str]:
    """
    验证已提交结果的正确性
    返回: None 表示验证通过, 否则返回错误原因
    """
    # 1. 获取订单和已提交的结果哈希
    order = await fetch_order(order_pubkey)
    submitted_hash = order.result_hash
    
    # 2. 获取 Skill 信息
    skill = await fetch_skill(order.skill)
    skill_package = await fetch_skill_package(skill.content_hash)
    
    # 3. 获取原始输入 (从链上事件或存储)
    original_input = await fetch_order_input(order_pubkey)
    
    # 4. 重新执行 Skill (确定性重放)
    replay_result = await execute_in_sandbox(skill_package, original_input)
    
    # 5. 计算重放结果哈希
    replay_json = json.dumps(replay_result, sort_keys=True)
    replay_hash = hashlib.sha256(replay_json.encode()).digest()
    
    # 6. 对比哈希
    if replay_hash != submitted_hash:
        return f"Hash mismatch: expected {replay_hash.hex()}, got {submitted_hash.hex()}"
    
    return None  # 验证通过

async def challenge_if_invalid(order_pubkey: str):
    """验证失败时发起链上挑战"""
    error = await verify_result(order_pubkey)
    if error:
        print(f"🚨 Invalid result detected: {error}")
        # 构建 challenge 指令
        ix = program.instruction["challenge"](
            proof=error.encode()[:64],  # 截断证明
            ctx=Context(
                accounts={
                    "order": order_pubkey,
                    "challenger": challenger_keypair.pubkey(),
                    # ...
                }
            )
        )
        tx = Transaction().add(ix)
        await client.send_transaction(tx, challenger_keypair)
        print(f"✅ Challenge submitted for order {order_pubkey}")
```

**演示场景**: 手动模拟 "恶意提交 → Verifier 检测 → 触发回滚"

### 4.3 Bot 脚本 (压力测试)

**文件**: `sre-runtime/bots/`

```python
# user_bot.py
async def user_bot():
    """模拟用户下单"""
    while True:
        skill = random.choice(SKILLS)
        await create_order(skill, random_input())
        await asyncio.sleep(random.uniform(5, 15))

# executor_bot.py
async def executor_bot():
    """模拟执行者接单"""
    async for order in listen_orders():
        await process_and_commit(order)

# watcher_bot.py (增强版 - V2.2)
async def watcher_bot():
    """监督者: 验证结果并挑战恶意提交"""
    async for committed_order in listen_committed():
        # 确定性验证 (替代概率挑战)
        error = await verify_result(committed_order)
        if error:
            await challenge_if_invalid(committed_order)
```

### 4.4 Dockerfile

```dockerfile
# sre-runtime/Dockerfile
FROM python:3.11-slim

# 确定性构建
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY executor/ /app/executor/
COPY bots/ /app/bots/

WORKDIR /app

# 默认入口
CMD ["python", "-m", "executor.listener"]
```

---

## 5. Phase 3: 交互层 (Week 3)

### 5.1 技术栈

> **ADR-011**: Phase 3 技术栈升级 (2024-12-15)
> 
> 详细设计文档: `.project_state/plans/P3-FRONTEND-DESIGN.md` (v2.0 Terminal Minimalism)

| 组件 | 技术选型 | 说明 |
|------|----------|------|
| 框架 | **Next.js 15** (App Router + Server Actions) | 稳定版发布，Server Actions 更丝滑 |
| 样式 | TailwindCSS + **shadcn/ui + CVA** | CVA 管理组件变体状态 |
| 状态 | **TanStack Query 5.x + Zustand 4.x** | Query 用于链上数据轮询/缓存 |
| 钱包 | @solana/wallet-adapter | - |
| 可视化 | **React Flow + Recharts 2.x + R3F (Hero Only)** | 节点图替代静态 Sankey |
| 字体 | Inter Tight (UI) + JetBrains Mono (Terminal/Data) | 终端风格强化 |
| 动画 | Framer Motion (Spring Physics) | 磁吸按钮、扫描线效果 |
| 图标 | Lucide React (Stroke 1.5px) | 极简线条风格 |

**设计风格**: Terminal Minimalism (融合 Linear 风格 + Computational Beauty + Solana 品牌色)

**风格约束**:
- ❌ 粗糙霓虹发光 (High Contrast Neon)
- ❌ 纯黑背景 → 使用 Zinc-950 + 动态噪点
- ❌ R3F 在 Dashboard 区域 (仅限 Hero)


### 5.2 Blinks API

> **ADR-009**: Blinks 演示范围锁定 (V2.2 新增)
> 
> **范围限制**: Blinks 仅支持**短文本输入** Skill:
> - ✅ `price-oracle` (Token Symbol)
> - ✅ `tweet-sentiment` (短文本)
> - ❌ `code-reviewer` → Deep Link 跳转 Dashboard
> 
> **原因**: Blinks URL 长度和 Metadata 限制，复杂输入无法优雅传递

**文件**: `web/app/api/actions/execute-skill/route.ts`

```typescript
// GET: 返回 Action 元数据
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const skillId = searchParams.get("skill");
  
  const skill = await fetchSkill(skillId);
  
  const payload: ActionGetResponse = {
    title: `Execute: ${skill.name}`,
    icon: skill.icon_url,
    description: skill.description,
    label: "Execute Skill",
    links: {
      actions: [
        {
          label: `Pay ${skill.price_lamports / LAMPORTS_PER_SOL} SOL`,
          href: `/api/actions/execute-skill?skill=${skillId}&input={input}`,
          parameters: [
            {
              name: "input",
              label: "Input Data (JSON)",
              required: true,
            },
          ],
        },
      ],
    },
  };
  
  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
}

// POST: 构建交易
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const skillId = searchParams.get("skill");
  const input = searchParams.get("input");
  
  const body: ActionPostRequest = await req.json();
  const userPubkey = new PublicKey(body.account);
  
  // 构建 create_order 指令
  const ix = await program.methods
    .createOrder(JSON.parse(input))
    .accounts({
      client: userPubkey,
      skill: new PublicKey(skillId),
      // ...
    })
    .instruction();
  
  const tx = new Transaction().add(ix);
  tx.feePayer = userPubkey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  
  const payload: ActionPostResponse = {
    transaction: tx.serialize({ requireAllSignatures: false }).toString("base64"),
    message: `Executing skill: ${skillId}`,
  };
  
  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
}
```

### 5.3 Dashboard 组件

**文件**: `web/app/dashboard/page.tsx`

```tsx
export default function Dashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 p-6">
      {/* 左侧: 实时日志 */}
      <div className="col-span-4">
        <RealtimeLog />
      </div>
      
      {/* 中间: 资金流 Agent Flow Graph */}
      <div className="col-span-5">
        <SankeyDiagram />
      </div>
      
      {/* 右侧: 统计面板 */}
      <div className="col-span-3">
        <StatsPanel />
        <MySkills />
        <MyAgentProfile />
      </div>
    </div>
  );
}
```

#### 5.3.1 实时日志组件

```tsx
// components/RealtimeLog.tsx
export function RealtimeLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  useEffect(() => {
    const ws = new WebSocket(HELIUS_WS_URL);
    ws.onmessage = (event) => {
      const log = parseLog(event.data);
      setLogs((prev) => [log, ...prev].slice(0, 100));
    };
    return () => ws.close();
  }, []);
  
  return (
    <div className="bg-black/90 rounded-lg p-4 h-[600px] overflow-auto font-mono text-sm">
      {logs.map((log, i) => (
        <div key={i} className={cn(
          "py-1",
          log.type === "order" && "text-green-400",
          log.type === "commit" && "text-blue-400",
          log.type === "settle" && "text-yellow-400",
        )}>
          [{log.timestamp}] {log.message}
        </div>
      ))}
    </div>
  );
}
```

#### 5.3.2 资金流 Agent Flow Graph

```tsx
// components/SankeyDiagram.tsx
import { Sankey, Tooltip, Layer } from "recharts";

const data = {
  nodes: [
    { name: "Users" },
    { name: "Escrow" },
    { name: "Executor" },
    { name: "Creator" },
    { name: "Protocol" },
  ],
  links: [
    { source: 0, target: 1, value: 100 },  // Users → Escrow
    { source: 1, target: 2, value: 85 },   // Escrow → Executor (85%)
    { source: 1, target: 3, value: 10 },   // Escrow → Creator (10%)
    { source: 1, target: 4, value: 5 },    // Escrow → Protocol (5%)
  ],
};

export function SankeyDiagram() {
  return (
    <Sankey
      width={600}
      height={400}
      data={data}
      node={{ fill: "#8884d8" }}
      link={{ stroke: "#77c" }}
    >
      <Tooltip />
    </Sankey>
  );
}
```

#### 5.3.3 Mock 数据注入 (演示兜底 - V2.2 新增)

> **ADR-010**: 优化方案审计 - 演示稳定性保障

**文件**: `scripts/seed-demo-data.ts`

```typescript
// 预埋演示数据 - 确保评委看到完整价值
import { demoTasks, demoSankeyData, demoLogs } from './fixtures';

export async function seedDemoData() {
  // 1. 预埋历史任务记录 (3-5条已完成任务)
  for (const task of demoTasks) {
    await insertTask({
      id: task.id,
      skill: task.skill,
      status: 'finalized',
      amount: task.amount,
      executorEarnings: task.amount * 0.85,
      creatorRoyalty: task.amount * 0.10,
      protocolFee: task.amount * 0.05,
      completedAt: task.timestamp,
    });
  }
  
  // 2. 预埋 Agent Flow Graph 数据 (资金流可视化)
  await setSankeyData(demoSankeyData);
  
  // 3. 预埋日志记录 (展示完整生命周期)
  for (const log of demoLogs) {
    await insertLog(log);
  }
  
  console.log('✅ Demo data seeded successfully');
}

// fixtures/demo-tasks.ts
export const demoTasks = [
  {
    id: 'demo-001',
    skill: 'price-oracle',
    amount: 0.05 * LAMPORTS_PER_SOL,
    timestamp: Date.now() - 3600000,  // 1小时前
  },
  {
    id: 'demo-002', 
    skill: 'tweet-sentiment',
    amount: 0.03 * LAMPORTS_PER_SOL,
    timestamp: Date.now() - 1800000,  // 30分钟前
  },
  // ...
];
```

**使用方式**:
```bash
# 演示前运行
npx ts-node scripts/seed-demo-data.ts
```

### 5.4 TypeScript SDK

**文件**: `sdk/src/index.ts`

```typescript
// @exo/sdk

import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";

export class ExoClient {
  private program: Program;
  private connection: Connection;
  
  constructor(connection: Connection, wallet: Keypair) {
    this.connection = connection;
    const provider = new AnchorProvider(connection, wallet, {});
    this.program = new Program(IDL, PROGRAM_ID, provider);
  }
  
  // ===== Skill 相关 =====
  
  async registerSkill(params: RegisterSkillParams): Promise<string> {
    const [skillPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("skill"), this.wallet.publicKey.toBuffer(), params.nameHash],
      this.program.programId
    );
    
    const tx = await this.program.methods
      .registerSkill(params.contentHash, params.priceLamports)
      .accounts({ skill: skillPda, authority: this.wallet.publicKey })
      .rpc();
    
    return tx;
  }
  
  async getSkill(skillPubkey: PublicKey): Promise<Skill> {
    return this.program.account.skillAccount.fetch(skillPubkey);
  }
  
  // ===== Agent 相关 =====
  
  async createAgent(): Promise<string> {
    const [agentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), this.wallet.publicKey.toBuffer()],
      this.program.programId
    );
    
    const tx = await this.program.methods
      .createAgent()
      .accounts({ agent: agentPda, owner: this.wallet.publicKey })
      .rpc();
    
    return tx;
  }
  
  async getAgentProfile(owner: PublicKey): Promise<AgentIdentity> {
    const [agentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), owner.toBuffer()],
      this.program.programId
    );
    return this.program.account.agentIdentity.fetch(agentPda);
  }
  
  // ===== Order 相关 =====
  
  async createOrder(skillPubkey: PublicKey, input: any): Promise<string> {
    // ...
  }
  
  async commitResult(orderPubkey: PublicKey, resultHash: Buffer): Promise<string> {
    // ...
  }
  
  async finalizeOrder(orderPubkey: PublicKey): Promise<string> {
    // ...
  }
}

// 导出类型
export type { Skill, AgentIdentity, Order, OrderStatus };
```

**NPM 包配置**:
```json
// sdk/package.json
{
  "name": "@exo/sdk",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "@coral-xyz/anchor": "^0.30.0",
    "@solana/web3.js": "^1.90.0"
  }
}
```

---

## 6. Phase 4: 交付与演示 (Week 4)

### 6.1 端到端联调清单

| 测试场景 | 预期结果 | 通过标准 |
|----------|----------|----------|
| Blink 下单 | 用户签名后资金锁入 Escrow | 链上状态 = Open |
| SRE 监听 | 5秒内捕获事件 | 日志可见 |
| Docker 执行 | 沙盒内执行完成 | 容器退出码 = 0 |
| 结果提交 | Hash 上链 | 链上状态 = Committed |
| 挑战窗口 | 100 blocks (~40秒) 后可结算 | slot 差值 >= 100 |
| 结算释放 | Transfer Hook 自动分账 | 三方余额正确 |

**全链路时延目标**: < 3秒 (不含挑战窗口)

### 6.2 品牌资产生成

| 资产 | 工具 | 风格 |
|------|------|------|
| Logo | Midjourney | Cyberpunk / 未来城市 |
| Banner | DALL-E 3 | 宽幅科技感 |
| 架构图 | Mermaid + Excalidraw | 技术文档风格 |
| UI 配色 | Coolors | 深色系 + 霓虹强调色 |

### 6.3 视频剧本 (3分钟)

```
┌─────────────────────────────────────────────────────────────────┐
│ 0:00 - 0:15  THE HOOK (痛点)                                   │
├─────────────────────────────────────────────────────────────────┤
│ 画面: 快速剪辑 - AI Agent 孤岛、无法协作、支付摩擦             │
│ 旁白: "AI Agents are powerful, but isolated.                   │
│        They can't trade skills. They can't trust each other.   │
│        They can't get paid."                                   │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 0:15 - 0:30  THE SOLUTION (方案)                               │
├─────────────────────────────────────────────────────────────────┤
│ 画面: Exo Protocol Logo 展示                                   │
│ 旁白: "Introducing Exo Protocol —                              │
│        The Skill-Native PayFi layer for the Agent Economy."    │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 0:30 - 1:15  THE MAGIC (Blinks 演示) ⭐ 高潮                   │
├─────────────────────────────────────────────────────────────────┤
│ 画面: Twitter 界面 → 点击 Blink → 钱包弹出 → 签名              │
│       → 后台 SRE 日志滚动 → 结果返回                           │
│ 旁白: "See this? One click on Twitter.                         │
│        No app switch. No wallet dance.                         │
│        The Agent executes. You pay. Done."                     │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1:15 - 2:00  THE TECH (硬核展示)                               │
├─────────────────────────────────────────────────────────────────┤
│ 画面: 代码高亮 - Transfer Hook / Escrow 状态机                 │
│       架构图动画 / 资金流 Agent Flow Graph                                │
│ 旁白: "Under the hood:                                         │
│        - Token-2022 Transfer Hooks for atomic fee splits       │
│        - Optimistic execution with challenge rollback          │
│        - State Compression for million-agent scalability"      │
│ 字幕: "Only Possible on Solana" ← OPOS 得分点                  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2:00 - 2:30  THE ECOSYSTEM (工程密度)                          │
├─────────────────────────────────────────────────────────────────┤
│ 画面: SDK 文档 / CLI 工具 / Dashboard 截图 / 测试覆盖率        │
│ 旁白: "Not just a demo. We built the full stack:               │
│        - TypeScript SDK for developers                         │
│        - Python runtime for executors                          │
│        - Real-time dashboard for transparency"                 │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2:30 - 3:00  THE VISION (愿景)                                 │
├─────────────────────────────────────────────────────────────────┤
│ 画面: 路线图 / TAM 数据 / 团队                                 │
│ 旁白: "The Agent Economy is coming.                            │
│        Exo Protocol is the backbone.                           │
│        Join us."                                               │
│ 结尾: Logo + Website + Twitter handle                          │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 README 黄金结构

```markdown
# Exo Protocol

> Skill-Native PayFi for the Agent Economy

[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()
[![Solana](https://img.shields.io/badge/Solana-Devnet-green)]()

## 🎯 Problem

AI Agents are isolated silos. They can't:
- Trade skills with each other
- Trust execution results
- Get paid automatically

## 💡 Solution

Exo Protocol provides:
- **Skill Registry**: Standardized, tradeable AI capabilities
- **PayFi Settlement**: Atomic fee splits via Token-2022 Hooks
- **Optimistic Execution**: Low-cost verification with challenge rollback
- **Blinks Integration**: Execute skills directly from Twitter

## 🏗️ Architecture

[Mermaid 时序图]

## 🚀 Quick Start

\`\`\`bash
# Clone
git clone https://github.com/xxx/exo-protocol

# Install
cd exo-protocol && npm install

# Deploy (Devnet)
anchor build && anchor deploy

# Run SRE
cd sre-runtime && docker-compose up
\`\`\`

## 📦 SDK Usage

\`\`\`typescript
import { ExoClient } from "@exo/sdk";

const client = new ExoClient(connection, wallet);
await client.createOrder(skillPubkey, { prompt: "..." });
\`\`\`

## 🔗 Links

- [Demo Video](https://youtube.com/xxx)
- [Live Blink](https://dial.to/xxx)
- [Documentation](https://docs.exo.xxx)

## 📄 License

MIT
```

---

## 7. 代码仓库结构

```
exo-protocol/
├── anchor/                          # 智能合约
│   ├── programs/
│   │   ├── exo-core/               # 核心合约
│   │   │   ├── src/
│   │   │   │   ├── instructions/
│   │   │   │   │   ├── mod.rs
│   │   │   │   │   ├── register_skill.rs
│   │   │   │   │   ├── create_agent.rs
│   │   │   │   │   ├── create_order.rs
│   │   │   │   │   ├── commit_result.rs
│   │   │   │   │   ├── finalize.rs
│   │   │   │   │   └── challenge.rs
│   │   │   │   ├── state/
│   │   │   │   │   ├── mod.rs
│   │   │   │   │   ├── skill.rs
│   │   │   │   │   ├── agent.rs
│   │   │   │   │   └── order.rs
│   │   │   │   ├── errors.rs
│   │   │   │   └── lib.rs
│   │   │   └── Cargo.toml
│   │   └── exo-hooks/              # Token-2022 Hook
│   │       ├── src/lib.rs
│   │       └── Cargo.toml
│   ├── tests/
│   │   ├── skill.test.ts
│   │   ├── agent.test.ts
│   │   ├── escrow.test.ts
│   │   └── hook.test.ts
│   ├── Anchor.toml
│   └── Cargo.toml
│
├── sre-runtime/                     # Python 运行时
│   ├── executor/
│   │   ├── __init__.py
│   │   ├── listener.py             # 链上事件监听
│   │   ├── fetcher.py              # Arweave 拉取
│   │   ├── sandbox.py              # Docker 沙盒
│   │   └── committer.py            # 结果提交
│   ├── bots/
│   │   ├── user_bot.py
│   │   ├── executor_bot.py
│   │   └── watcher_bot.py
│   ├── examples/
│   │   └── token-analyzer/         # 示例 Skill
│   │       ├── SKILL.md
│   │       └── scripts/main.py
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── requirements.txt
│
├── exo-sdk/                         # TypeScript SDK (重命名)
│   ├── src/
│   │   ├── index.ts
│   │   ├── client.ts
│   │   ├── instructions/
│   │   │   ├── skill.ts
│   │   │   ├── agent.ts
│   │   │   └── escrow.ts
│   │   └── pda.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── exo-frontend/                    # Next.js 前端 (重命名)
│   ├── app/
│   │   ├── api/
│   │   │   └── actions/
│   │   │       └── execute-skill/
│   │   │           └── route.ts
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── terminal-feed.tsx
│   │   │   ├── flow-canvas.tsx
│   │   │   └── stats-panel.tsx
│   │   └── ui/
│   ├── hooks/
│   │   └── use-helius-logs.ts
│   ├── lib/
│   │   ├── solana.ts
│   │   └── log-parser.ts
│   ├── package.json
│   └── tailwind.config.ts
│
├── docs/                            # 文档
│   ├── SKILL_SCHEMA.md
│   ├── AGENT_STANDARD.md
│   ├── architecture.md
│   └── api-reference.md
│
├── assets/                          # 品牌资产
│   ├── logo.png
│   ├── banner.png
│   └── architecture-diagram.png
│
├── .github/
│   └── workflows/
│       └── test.yml
│
├── README.md
├── LICENSE
└── .gitignore
```

---

## 8. 技术规范

### 8.1 合约常量

```rust
// 协议参数
pub const PROTOCOL_FEE_BPS: u16 = 500;      // 5%
pub const CREATOR_ROYALTY_BPS: u16 = 1000;  // 10%
pub const CHALLENGE_WINDOW_SLOTS: u64 = 100; // ~40秒
pub const MIN_ORDER_AMOUNT: u64 = 10_000;   // 0.00001 SOL

// Tier 升级阈值
pub const TIER_1_THRESHOLD: u64 = 1_000_000_000;  // 1 SOL
pub const TIER_2_THRESHOLD: u64 = 10_000_000_000; // 10 SOL
pub const TIER_2_REPUTATION: u16 = 8000;          // 80%

// PDA Seeds
pub const SKILL_SEED: &[u8] = b"skill";
pub const AGENT_SEED: &[u8] = b"agent";
pub const ORDER_SEED: &[u8] = b"order";
pub const ESCROW_SEED: &[u8] = b"escrow";
```

### 8.2 错误码

```rust
#[error_code]
pub enum ExoError {
    #[msg("Skill already exists")]
    SkillAlreadyExists,
    
    #[msg("Invalid content hash")]
    InvalidContentHash,
    
    #[msg("Agent already exists")]
    AgentAlreadyExists,
    
    #[msg("Insufficient tier")]
    InsufficientTier,
    
    #[msg("Order not in correct status")]
    InvalidOrderStatus,
    
    #[msg("Challenge window not elapsed")]
    ChallengeWindowActive,
    
    #[msg("Challenge window expired")]
    ChallengeWindowExpired,
    
    #[msg("Unauthorized")]
    Unauthorized,
    
    #[msg("Arithmetic overflow")]
    Overflow,
}
```

### 8.3 事件定义

```rust
#[event]
pub struct SkillRegistered {
    pub skill: Pubkey,
    pub authority: Pubkey,
    pub content_hash: [u8; 32],
    pub price_lamports: u64,
}

#[event]
pub struct AgentCreated {
    pub agent: Pubkey,
    pub owner: Pubkey,
}

#[event]
pub struct OrderCreated {
    pub order: Pubkey,
    pub client: Pubkey,
    pub skill: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ResultCommitted {
    pub order: Pubkey,
    pub executor: Pubkey,
    pub result_hash: [u8; 32],
    pub commit_slot: u64,
}

#[event]
pub struct OrderFinalized {
    pub order: Pubkey,
    pub executor_amount: u64,
    pub creator_royalty: u64,
    pub protocol_fee: u64,
}

#[event]
pub struct ChallengeFiled {
    pub order: Pubkey,
    pub challenger: Pubkey,
}
```

---

## 9. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| **Transfer Hook 开发超时** | 中 | 高 | Week 1 Day 1-3 优先攻克；准备降级方案：后端分账 |
| **Blinks API 不稳定** | 低 | 中 | 使用 Helius 官方示例；保留普通 URL 降级入口 |
| **Docker 沙盒逃逸** | 低 | 高 | 使用 gVisor 增强隔离；限制资源配额 |
| **演示时链上拥堵** | 低 | 高 | 使用 Devnet 演示；主网部署作为附加分 |
| **评委对概念陌生** | 中 | 中 | 视频前 30 秒强化痛点教育；准备备用解释 |

---

## 10. 验收清单

### 10.1 Phase 0 验收 (Day 2)

- [x] SKILL_SCHEMA.md 定义完成
- [x] AGENT_STANDARD.md 定义完成
- [x] 5 个示例 Skill 包创建

### 10.2 Phase 1 验收 (Week 1)

- [x] Skill Registry 合约部署 (Devnet)
- [x] Agent Identity 合约部署
- [x] Escrow Settlement 合约部署
- [x] Transfer Hook 合约部署
- [x] 单元测试覆盖率 > 80%
- [x] Arweave 上传脚本可用 (降级为本地/GitHub)
- [x] Helius RPC 配置完成

### 10.3 Phase 2 验收 (Week 2)

- [x] Listener 可监听链上事件
- [x] Fetcher 可从 Arweave/GitHub 下载
- [x] Sandbox Docker 执行正常
- [x] Committer 可提交结果 (含 DA 流程)
- [x] **Verifier 可验证结果** (V2.2 新增)
- [x] **挑战演示可执行** (V2.2 新增)
- [x] 3 个 Bot 脚本可运行 (含增强版 watcher_bot)
- [x] docker-compose up 一键启动

### 10.4 Phase 3 验收 (Week 3)

- [x] Blinks GET API 返回正确 metadata
- [x] Blinks POST API 构建交易正确
- [x] Dashboard 实时日志显示
- [x] Agent Flow Graph 资金流可视化 (React Flow 节点图)
- [x] SDK npm 包可发布 (@exo/sdk)
- [x] SDK 核心方法可用

### 10.5 Phase 4 验收 (Week 4)

- [x] 端到端链路 < 3 秒
- [x] Logo/Banner 生成
- [x] 架构图完成
- [x] README 完整
- [ ] 3 分钟视频制作
- [ ] 仓库 Public
- [ ] 提交 Hackathon

---

## 附录 A: 资源前置确认清单

| 资源 | 类型 | 获取方式 | 状态 |
|------|------|----------|------|
| Helius API Key | 私有 API | https://dev.helius.xyz | ⬜ 待确认 |
| Arweave/Irys 钱包 | 私有 API | https://irys.xyz | ⬜ 待确认 |
| Docker Desktop | 本地服务 | https://docker.com | ⬜ 待确认 |
| Solana CLI | 本地服务 | `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"` | ⬜ 待确认 |
| Anchor CLI | 本地服务 | `cargo install --git https://github.com/coral-xyz/anchor anchor-cli` | ⬜ 待确认 |
| Node.js 18+ | 本地服务 | https://nodejs.org | ⬜ 待确认 |
| Python 3.11 | 本地服务 | https://python.org | ⬜ 待确认 |

---

## 附录 B: 参考资料

- [城邦 V5.0 总纲](../../../.project_state/references/Docs/v5.0.md)
- [Solana 黑客松战略报告](./Solana%20黑客松参赛战略报告.md)
- [Token-2022 Transfer Hooks 文档](https://spl.solana.com/token-2022/extensions#transfer-hook)
- [Solana Actions & Blinks](https://solana.com/docs/advanced/actions)
- [Anchor 框架文档](https://www.anchor-lang.com/)
- [Helius 开发者文档](https://docs.helius.dev/)

---

## 附录 C: V2.1 变更记录

| 变更项 | 描述 | 关联 V5.0 章节 |
|--------|------|---------------|
| **SKILL.md 规范升级** | 新增 `annotations` 字段 (Tool Annotations) | §7.3.2.1 |
| **输入 Schema 增强** | 新增 `additionalProperties: false` + `maxProperties` | §7.4.1.1 |
| **Sandbox 输入验证** | 新增 100KB 输入限制 + 属性数限制 | §7.4.1 安全扫描 |
| **示例 Skill annotations** | 为 5 个示例 Skill 标记行为注解 | §7.3.2.1 |

---

## 附录 D: V2.2 变更记录 (ADR-009/010)

| 变更项 | 描述 | 关联 ADR |
|--------|------|---------|
| **Verifier 模块** | 新增 §4.2.4 - 结果验证与挑战机制 | ADR-010 |
| **Committer DA 流程** | 更新 §4.2.3 - 明确结果上传 + URL 上链流程 | ADR-010 |
| **watcher_bot 增强** | 概率挑战 → 确定性验证 | ADR-010 |
| **Blinks 范围锁定** | 更新 §5.2 - 仅支持短文本输入 Skill | ADR-009 |
| **Mock 数据注入** | 新增 §5.3.3 - 演示兜底脚本 | ADR-010 |

**触发来源**: 用户优化方案审计 (Phase 2 Gate 前)

**参考文档**:
- 城邦 V5.0 总纲: `../.project_state/references/Docs/v5.0.md`
- Anthropic 技术模式: `../.project_state/references/Docs/anthropic_patterns.md`
- DECISION_LOG.md: ADR-009, ADR-010

---

**文档版本**: 2.2.0
**最后更新**: 2024-12-14
**作者**: CSA (Chief System Architect)
