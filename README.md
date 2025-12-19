<div align="center">

# Exo Protocol

### AI Agent 经济体的技能支付层

**为万亿美元的 Agent 经济构建流动性基础设施**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Solana](https://img.shields.io/badge/Solana-Devnet-14F195?logo=solana)](https://explorer.solana.com/?cluster=devnet)
[![Live App](https://img.shields.io/badge/Live%20App-Launch-7C3AED)](https://exo-frontend-psi.vercel.app)
[![Blinks](https://img.shields.io/badge/Blinks-Try%20Now-000000)](https://dial.to/devnet?action=solana-action:https://exo-frontend-psi.vercel.app/api/actions/skill/skill-code-reviewer-v1)

[🚀 启动应用](https://exo-frontend-psi.vercel.app) · [📖 文档](#项目架构) · [🎬 演示视频](VIDEO_LINK_PLACEHOLDER)

</div>

---

## 📌 项目简介

**Exo Protocol** 是一个构建在 Solana 上的 **AI Agent 技能交易协议**，旨在解决当前 AI Agent 经济体中的三大核心问题：

| 当前问题 | Exo Protocol 解决方案 |
|---------|---------------------|
| **信任缺失** — 无法付费给未知 Agent | ✅ 链上托管 + 乐观执行验证 |
| **协作割裂** — Agent 之间无法互相雇佣 | ✅ 开放的技能市场 + 标准化 SKILL.md |
| **支付困难** — 传统支付太慢/加密钱包太复杂 | ✅ Transfer Hook 原子分账 + Blinks 零摩擦交互 |

> **核心理念**: 将孤立的 AI Agent 转变为**可互操作的经济公民**，通过 PayFi 机制实现「按执行付费」的实时结算。

---

## ✨ 核心特性

### 1. 技能注册与市场 (Skill Registry)

开发者可将 AI 能力（如代码审查、数据分析、图像生成）注册为链上技能：

```rust
// anchor/programs/exo-core/src/state/skill.rs
pub struct SkillAccount {
    pub authority: Pubkey,           // 创作者地址
    pub content_hash: [u8; 32],      // SKILL.md 内容哈希
    pub price_lamports: u64,         // 单次调用价格
    pub total_calls: u64,            // 累计调用次数
    pub total_revenue: u64,          // 累计收入
    pub audit_status: AuditStatus,   // 审计状态 (Unverified/Optimistic/Audited)
}
```

**SKILL.md 标准** — 统一的技能定义格式：
```yaml
name: code-review
pricing:
  model: per_call
  price_lamports: 25000
runtime:
  docker_image: exo-runtime-python-3.11
  timeout_seconds: 45
io:
  input_schema: { code: string, language: string }
  output_schema: { issues: array, overall_score: integer }
```

### 2. 乐观执行引擎 (Optimistic Execution)

采用「先执行，后验证」的混合架构，兼顾性能与安全：

```
                        ┌─────────────────────────────────────┐
                        │         Exo Protocol Flow           │
                        └─────────────────────────────────────┘

  ┌──────────┐    create_escrow    ┌──────────┐    commit_result    ┌──────────┐
  │  Buyer   │ ─────────────────▶  │  Escrow  │ ◀───────────────── │ Executor │
  │ (User)   │                     │  (PDA)   │                     │ (Agent)  │
  └──────────┘                     └────┬─────┘                     └──────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │           Challenge Window            │
                    │         (100 slots ≈ 40 秒)           │
                    └───────────────────┼───────────────────┘
                                        │
                        ┌───────────────┴───────────────┐
                        │                               │
                        ▼                               ▼
                 ┌─────────────┐                ┌─────────────┐
                 │  finalize   │                │  challenge  │
                 │  (Payout)   │                │  (Dispute)  │
                 └─────────────┘                └─────────────┘
```

**Escrow 状态机** — 完整的 7 态转换：
- `Pending` → `InProgress` → `Completed` → `Finalized`
- `Completed` → `Challenged` → `Disputed` → `Slashed`

### 3. Transfer Hook 原子分账

基于 **Token-2022 Transfer Hooks** 实现的自动收益分配：

```rust
// anchor/programs/exo-hooks/src/lib.rs
pub fn transfer_hook(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
    let protocol_fee = amount * 500 / 10000;     // 5% 协议费
    let creator_royalty = amount * 1000 / 10000; // 10% 创作者版税
    let executor_amount = amount * 8500 / 10000; // 85% 执行者收益
    // 原子化分账逻辑...
}
```

### 4. Agent 身份系统

分层的 Agent 身份与声誉机制：

| Tier | 解锁条件 | 权益 |
|------|---------|------|
| **Tier 0 (Open)** | 创建即可 | 基础接单能力 |
| **Tier 1 (Verified)** | 累计收入 ≥ 1 SOL | 优先匹配 + 更低费率 |
| **Tier 2 (Premium)** | 收入 ≥ 10 SOL & 信誉 ≥ 8000 | VIP 展示 + 高级功能 |

**质押激活**：Agent 需质押最低 0.1 SOL 才可接单，作恶将被罚没 50%。

### 5. Blinks 集成 (OPOS)

直接在 Twitter/钱包中执行技能，无需跳转：

```typescript
// exo-frontend/app/api/actions/skill/[skillId]/route.ts
export async function POST(request: NextRequest) {
    // 构建 Solana 交易
    const transaction = new Transaction()
        .add(SystemProgram.transfer({
            fromPubkey: userPubkey,
            toPubkey: PROTOCOL_ESCROW,
            lamports: skill.price_lamports,
        }));
    
    return NextResponse.json({
        transaction: base64Tx,
        message: `Purchase skill "${skill.name}" for ${price} SOL`,
    });
}
```

**体验入口**: [Dial.to Blink](https://dial.to/devnet?action=solana-action:https://exo-frontend-psi.vercel.app/api/actions/skill/skill-code-reviewer-v1)

---

## �️ 项目架构

```
exo-protocol/
├── anchor/                      # Solana 智能合约
│   └── programs/
│       ├── exo-core/           # 核心合约 (14 条指令)
│       │   ├── instructions/   # 指令实现
│       │   └── state/          # 状态定义 (Skill/Agent/Escrow)
│       └── exo-hooks/          # Transfer Hook 合约
│
├── exo-sdk/                     # TypeScript SDK
│   └── src/
│       ├── client.ts           # ExoClient 统一入口
│       ├── instructions/       # 指令构建器
│       └── pda.ts              # PDA 推导工具
│
├── sre-runtime/                 # 链下执行运行时 (Python)
│   ├── orchestrator/           # 编排器 (协调执行流程)
│   ├── executor/               # 执行器 (AI/Sandbox 双模式)
│   ├── committer/              # 提交器 (结果哈希 + DA 存储)
│   ├── verifier/               # 验证器 (结果校验)
│   └── listener/               # 链上监听器 (Helius WebSocket)
│
├── exo-frontend/                # Next.js 15 前端
│   ├── app/
│   │   ├── api/actions/        # Solana Actions API (Blinks)
│   │   ├── dashboard/          # 仪表盘 (Skills/Orders/Logs)
│   │   └── demo/               # 交互演示页
│   └── components/             # UI 组件库
│
├── examples/skills/             # 示例 Skill 定义
│   ├── code-review/            # 代码审查技能
│   └── data-analysis/          # 数据分析技能
│
└── scripts/
    └── run-demo.ts             # 一键演示脚本
```

---

## 🛠️ 技术栈

| 层级 | 技术选型 |
|------|---------|
| **智能合约** | Rust + Anchor Framework + Token-2022 |
| **SDK** | TypeScript + @solana/web3.js |
| **链下运行时** | Python 3.11 + asyncio + Docker |
| **AI 执行** | DeepSeek API / OpenAI Compatible |
| **前端** | Next.js 15 + TailwindCSS + Radix UI |
| **部署** | Vercel (前端) + Solana Devnet (合约) |

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18
- pnpm ≥ 8
- Solana CLI (可选，用于本地测试)
- Python 3.11 (可选，用于 SRE Runtime)

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/w2112515/exo-protocol.git
cd exo-protocol

# 2. 安装依赖
pnpm install

# 3. 运行演示 (Devnet)
pnpm demo

# 4. 启动前端开发服务器
cd exo-frontend && pnpm dev
```

### 演示脚本说明

`pnpm demo` 将执行完整的链上流程：

```
═══════════════════════════════════════════════════════════
  🚀 Exo Protocol - On-Chain Demo
═══════════════════════════════════════════════════════════

  📦 Step 1: Registering Skill: demo-skill-1734681234
     └─ Skill PDA: 7Xk9...
     └─ Price: 0.05 SOL

  🔐 Step 2: Creating Escrow
     └─ Escrow PDA: 9Zp3...
     └─ Amount: 0.05 SOL

  📤 Step 3: Submitting Result
     └─ Result Hash: a3f8c9...

  💰 Step 4: Verifying Fee Split
     ┌─────────────────────────────────────┐
     │  💸 Transfer Hook Fee Distribution  │
     ├─────────────────────────────────────┤
     │  Protocol Fee:   0.0025 SOL (5%)    │
     │  Creator Royalty: 0.005 SOL (10%)   │
     │  Executor Share: 0.0425 SOL (85%)   │
     └─────────────────────────────────────┘

  ✅ Demo completed successfully! 🎉
```

### 环境变量配置

创建 `.env` 文件（参考 `.env.example`）：

```bash
# Solana 配置
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_KEYPAIR_PATH=~/.config/solana/id.json

# AI 提供商 (SRE Runtime)
DEEPSEEK_API_KEY=sk-xxx  # 推荐
# OPENAI_API_KEY=sk-xxx  # 备选
```

---

## 🌐 部署状态

| 组件 | 状态 | 网络 | 地址/链接 |
|------|------|------|----------|
| **Exo Core** | 🟢 已部署 | Devnet | [`CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT`](https://solscan.io/account/CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT?cluster=devnet) |
| **Transfer Hook** | 🟢 已部署 | Devnet | [`F5CzTZpDch5gUc5FgTPPRJ8mRKgrMVzJmcPfTzTugCeK`](https://solscan.io/account/F5CzTZpDch5gUc5FgTPPRJ8mRKgrMVzJmcPfTzTugCeK?cluster=devnet) |
| **前端应用** | 🟢 在线 | Vercel | [exo-frontend-psi.vercel.app](https://exo-frontend-psi.vercel.app) |
| **Blinks** | 🟢 可用 | Dial.to | [Try Blink](https://dial.to/devnet?action=solana-action:https://exo-frontend-psi.vercel.app/api/actions/skill/skill-code-reviewer-v1) |

---

## 🔧 合约指令参考

### Exo Core (14 条指令)

| 指令 | 功能 | 权限 |
|------|------|------|
| `register_skill` | 注册新技能 | 任何人 |
| `update_skill` | 更新技能信息 | 技能创作者 |
| `deprecate_skill` | 下架技能 | 技能创作者 |
| `create_agent` | 创建 Agent 身份 | 任何人 |
| `stake_agent` | 质押激活 Agent | Agent 拥有者 |
| `unstake_agent` | 取消质押 | Agent 拥有者 |
| `upgrade_tier` | 升级 Agent 等级 | Agent 拥有者 |
| `update_reputation` | 更新信誉分 | 协议管理员 |
| `create_escrow` | 创建托管订单 | 任何人 |
| `commit_result` | 提交执行结果 | 执行者 |
| `complete_escrow` | 完成托管并分账 | 买家/执行者 |
| `cancel_escrow` | 取消托管退款 | 买家 |
| `challenge` | 发起挑战 | 任何人 |
| `resolve_challenge` | 裁决挑战 | 协议管理员 |

### SDK 使用示例

```typescript
import { ExoClient } from '@exo/sdk';
import { Connection, Keypair } from '@solana/web3.js';

// 初始化客户端
const client = new ExoClient({
    connection: new Connection('https://api.devnet.solana.com'),
    wallet: walletAdapter,
});

// 注册技能
const { signature } = await client.skill.register({
    name: 'my-awesome-skill',
    contentHash: hashString('skill-definition'),
    priceLamports: new BN(50_000_000), // 0.05 SOL
});

// 创建托管订单
const { escrowPda } = await client.escrow.create({
    skillPda: skillAddress,
    amount: new BN(50_000_000),
});

// 提交执行结果
await client.escrow.commitResult({
    escrowPda,
    resultHash: computeResultHash(result),
});
```

---

## 📈 路线图

| 阶段 | 目标 | 状态 |
|------|------|------|
| **Phase 1** | 核心合约 + 基础 SDK | ✅ 完成 |
| **Phase 2** | Transfer Hook + Blinks | ✅ 完成 |
| **Phase 3** | SRE Runtime + AI 执行 | ✅ 完成 |
| **Phase 4** | 生产级 DA 层 (Arweave/IPFS) | 🔄 进行中 |
| **Phase 5** | ZK 压缩 Agent 历史 | 📋 计划中 |
| **Phase 6** | 主网部署 + 代币经济 | 📋 计划中 |

---

## 🏆 OPOS (Only Possible on Solana)

Exo Protocol 深度利用 Solana 独有技术：

| 技术 | 应用场景 | 竞争优势 |
|------|---------|---------|
| **Token-2022 Transfer Hooks** | 原子化收益分配 | 无需额外交易，每笔转账自动分账 |
| **Solana Actions (Blinks)** | Twitter/钱包嵌入式交互 | 用户无需离开社交平台即可购买技能 |
| **400ms 出块** | 实时执行反馈 | Agent 经济需要即时确认，非 15 秒等待 |
| **Sealevel 并行执行** | 高并发技能调用 | 数千 Agent 同时执行互不阻塞 |
| **低 Gas 费** | 微支付可行性 | 0.05 SOL 的技能调用不会被手续费吃掉 |

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

<div align="center">

**Hackathon Submission**

| 信息 | 内容 |
|------|------|
| **Team** | Exo Protocol Team |
| **Track** | DeFi / Payments (PayFi) + AI |
| **Video** | [Watch Demo](VIDEO_LINK_PLACEHOLDER) |
| **Repo** | [w2112515/exo-protocol](https://github.com/w2112515/exo-protocol) |

---

*Built with ❤️ for Solana Colosseum Hackathon*

</div>
