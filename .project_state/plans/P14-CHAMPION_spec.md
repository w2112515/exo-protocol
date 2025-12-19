# Phase 14: Champion Sprint - 冠军冲刺执行方案

**Version**: 1.0.0
**Codename**: Operation Champion
**Created**: 2024-12-19
**Status**: 🔴 ACTIVE

---

## 0. 执行摘要

本 Phase 旨在实现 4 个高冲击力功能，将项目从 "Demo" 提升到 "冠军级产品"：

| 任务 ID | 功能 | 类型 | 预估工时 | 依赖 |
|---------|------|------|----------|------|
| **P14-C01** | 真实 AI Agent 执行器 | Critical / Logic | 4-6h | 无 |
| **P14-C02** | Agent Staking 机制 | Critical / Contract | 3-4h | 无 |
| **P14-C03** | CLI 工具增强 | Standard / Tool | 2-3h | P14-C02 |
| **P14-C04** | ZK Compression Agent 身份 | Critical / Contract | 8-12h | P14-C02 |

**总预估工时**: 17-25h

---

## 1. 架构变更概览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Phase 14 架构变更                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    新增组件 (标记 ⭐)                               │   │
│   │                                                                     │   │
│   │   ⭐ AI Executor (Claude API)                                       │   │
│   │      └── sre-runtime/executor/ai_executor.py                       │   │
│   │                                                                     │   │
│   │   ⭐ Agent Staking (合约层)                                         │   │
│   │      └── anchor/programs/exo-core/src/instructions/staking.rs      │   │
│   │      └── anchor/programs/exo-core/src/state/agent.rs (修改)        │   │
│   │                                                                     │   │
│   │   ⭐ CLI Agent Commands                                             │   │
│   │      └── exo-cli/src/commands/agent.ts                             │   │
│   │                                                                     │   │
│   │   ⭐ ZK Compression Layer (Light Protocol)                          │   │
│   │      └── anchor/programs/exo-core/src/instructions/zk_identity.rs  │   │
│   │      └── exo-sdk/src/instructions/zk.ts                            │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. P14-C01: 真实 AI Agent 执行器

### 2.1 Meta

| 属性 | 值 |
|------|-----|
| **Type** | Critical / Logic |
| **Risk Level** | 🟡 Medium |
| **Estimated Hours** | 4-6h |
| **depends_on** | 无 |

### 2.2 目标

将 SRE 执行器从模拟脚本升级为**真实 AI 驱动执行**，使用 Claude/GPT API 处理 Skill 请求。

### 2.3 Input Files

| 文件 | 用途 | 修改类型 |
|------|------|----------|
| `sre-runtime/executor/sandbox.py` | 现有沙盒执行器 | 参考 |
| `sre-runtime/committer/committer.py` | 结果提交 | 修改 |
| `sre-runtime/constants.py` | 常量配置 | 修改 |

### 2.4 Output Files

| 文件 | 用途 |
|------|------|
| `sre-runtime/executor/ai_executor.py` | **新建** - AI 执行器核心 |
| `sre-runtime/executor/providers/__init__.py` | **新建** - AI 提供商抽象 |
| `sre-runtime/executor/providers/anthropic.py` | **新建** - Claude 实现 |
| `sre-runtime/executor/providers/openai.py` | **新建** - GPT 实现 (备选) |

### 2.5 External Dependencies

| 资源 | 类型 | 状态 | 获取方式 |
|------|------|------|----------|
| DeepSeek API Key | 私有 API | ✅ 已确认 | 用户提供 `DEEPSEEK_API_KEY` |
| OpenAI API Key (备选) | 私有 API | ⬜ 可选 | 用户提供或环境变量 |

### 2.6 Action Steps

```python
# Step 1: 创建 AI 提供商抽象层
# sre-runtime/executor/providers/__init__.py

from abc import ABC, abstractmethod
from typing import Dict, Any

class AIProvider(ABC):
    @abstractmethod
    async def execute(self, system_prompt: str, user_input: Dict[str, Any]) -> Dict[str, Any]:
        """执行 AI 推理"""
        pass
```

```python
# Step 2: 实现 DeepSeek 提供商 (主要)
# sre-runtime/executor/providers/deepseek.py

import httpx
import json
from . import AIProvider

class DeepSeekProvider(AIProvider):
    """DeepSeek API 提供商 - OpenAI 兼容接口"""
    
    BASE_URL = "https://api.deepseek.com/v1"
    
    def __init__(self, api_key: str, model: str = "deepseek-chat"):
        self.api_key = api_key
        self.model = model
        self.client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=60.0
        )
    
    async def execute(self, system_prompt: str, user_input: dict) -> dict:
        response = await self.client.post(
            "/chat/completions",
            json={
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": json.dumps(user_input)}
                ],
                "max_tokens": 4096,
                "temperature": 0.7
            }
        )
        response.raise_for_status()
        data = response.json()
        return {
            "result": data["choices"][0]["message"]["content"],
            "model": self.model,
            "tokens": data.get("usage", {}).get("total_tokens", 0)
        }
    
    async def close(self):
        await self.client.aclose()
```

```python
# Step 3: 创建 AI 执行器
# sre-runtime/executor/ai_executor.py

import json
import os
from typing import Dict, Any, Optional
from dataclasses import dataclass

from .providers import AIProvider
from .providers.anthropic import AnthropicProvider

@dataclass
class AIExecutionResult:
    """AI 执行结果"""
    success: bool
    output: Dict[str, Any]
    model_used: str
    tokens_used: int
    execution_time_ms: int

class AIExecutor:
    """真实 AI Agent 执行器"""
    
    def __init__(self, provider: Optional[AIProvider] = None):
        if provider is None:
            # 优先使用 DeepSeek
            api_key = os.getenv("DEEPSEEK_API_KEY")
            if api_key:
                from .providers.deepseek import DeepSeekProvider
                provider = DeepSeekProvider(api_key)
            else:
                # 降级到 OpenAI 兼容接口
                openai_key = os.getenv("OPENAI_API_KEY")
                if openai_key:
                    from .providers.openai import OpenAIProvider
                    provider = OpenAIProvider(openai_key)
                else:
                    raise ValueError("DEEPSEEK_API_KEY or OPENAI_API_KEY required")
        self.provider = provider
    
    async def execute_skill(
        self,
        skill_package: dict,
        input_data: dict
    ) -> AIExecutionResult:
        """
        使用真实 AI 执行 Skill
        
        Args:
            skill_package: SKILL.md 解析后的配置
            input_data: 用户输入
            
        Returns:
            AIExecutionResult: 执行结果
        """
        import time
        start = time.perf_counter()
        
        # 构建 system prompt
        system_prompt = self._build_system_prompt(skill_package)
        
        # 调用 AI 提供商
        result = await self.provider.execute(system_prompt, input_data)
        
        execution_time = int((time.perf_counter() - start) * 1000)
        
        return AIExecutionResult(
            success=True,
            output=result,
            model_used=result.get("model", "unknown"),
            tokens_used=result.get("tokens", 0),
            execution_time_ms=execution_time
        )
    
    def _build_system_prompt(self, skill_package: dict) -> str:
        """从 SKILL.md 构建 system prompt"""
        name = skill_package.get("name", "Unknown Skill")
        description = skill_package.get("description", "")
        output_schema = skill_package.get("io", {}).get("output_schema", {})
        
        return f"""You are an AI Agent executing the skill: {name}

Description: {description}

You must return a valid JSON response matching this schema:
{json.dumps(output_schema, indent=2)}

Respond ONLY with valid JSON. No markdown, no explanations."""
```

```python
# Step 4: 修改 committer.py 集成 AI 执行器
# 在 commit_result 函数中添加 AI 执行模式选择

async def commit_result(
    order_id: str,
    skill_package: dict,
    input_data: dict,
    execution_mode: str = "sandbox",  # "sandbox" | "ai"
    sandbox_config: Optional[SandboxConfig] = None
) -> CommitResult:
    """支持 sandbox 和 ai 两种执行模式"""
    
    if execution_mode == "ai":
        from executor.ai_executor import AIExecutor
        executor = AIExecutor()
        ai_result = await executor.execute_skill(skill_package, input_data)
        result = ai_result.output
    else:
        result = execute_in_sandbox(skill_package, input_data, sandbox_config)
    
    # ... 后续 hash 计算和存储逻辑不变
```

### 2.7 Verification

| 类型 | 命令/检查 |
|------|-----------|
| **Unit** | `pytest sre-runtime/tests/test_ai_executor.py -v` |
| **Integration** | `DEEPSEEK_API_KEY=xxx python -m executor.ai_executor --test` |
| **Evidence** | 截图: AI 返回真实结果 + Token 消耗日志 |

### 2.8 Constraints

- ❤️ 禁止硬编码 API Key (必须使用环境变量)
- ✅ 必须支持 Provider 切换 (DeepSeek/OpenAI)
- ✅ 必须保持与现有 sandbox 接口兼容
- ✅ 必须记录 Token 消耗 (成本监控)

---

## 3. P14-C02: Agent Staking 机制

### 3.1 Meta

| 属性 | 值 |
|------|-----|
| **Type** | Critical / Contract |
| **Risk Level** | 🔴 High |
| **Estimated Hours** | 3-4h |
| **depends_on** | 无 |

### 3.2 目标

为 Agent 添加质押机制，执行者必须质押 SOL 才能接单，作弊则被 Slash。

### 3.3 Input Files

| 文件 | 用途 | 修改类型 |
|------|------|----------|
| `anchor/programs/exo-core/src/state/agent.rs` | Agent 状态 | **修改** |
| `anchor/programs/exo-core/src/instructions/create_agent.rs` | Agent 指令 | **修改** |
| `anchor/programs/exo-core/src/instructions/escrow.rs` | Escrow 指令 | **修改** |
| `anchor/programs/exo-core/src/lib.rs` | 程序入口 | **修改** |

### 3.4 Action Steps

#### Step 1: 扩展 AgentIdentity 状态

```rust
// anchor/programs/exo-core/src/state/agent.rs

/// 质押常量
pub const MIN_STAKE_AMOUNT: u64 = 100_000_000;  // 0.1 SOL 最低质押
pub const SLASH_PERCENTAGE: u8 = 50;             // 50% 罚没比例

/// Agent Identity 账户结构体 (V2 - 含质押)
#[account]
pub struct AgentIdentity {
    pub owner: Pubkey,
    pub tier: u8,
    pub total_earnings: u64,
    pub total_tasks: u64,
    pub reputation_score: u16,
    pub created_at: i64,
    pub bump: u8,
    // === V2 新增字段 ===
    pub staked_amount: u64,      // 当前质押金额
    pub slashed_count: u8,       // 被罚次数
    pub is_active: bool,         // 是否激活 (需质押后激活)
}

impl AgentIdentity {
    /// 账户空间大小 (V2)
    /// 原 68 bytes + 8 (staked) + 1 (slashed) + 1 (active) = 78 bytes
    pub const LEN: usize = 8 + 32 + 1 + 8 + 8 + 2 + 8 + 1 + 8 + 1 + 1;
    
    /// 检查是否可以接单
    pub fn can_accept_order(&self) -> bool {
        self.is_active && self.staked_amount >= MIN_STAKE_AMOUNT
    }
    
    /// 计算罚没金额
    pub fn calculate_slash_amount(&self) -> u64 {
        self.staked_amount * (SLASH_PERCENTAGE as u64) / 100
    }
}
```

#### Step 2: 创建质押指令

```rust
// anchor/programs/exo-core/src/instructions/staking.rs (新建)

use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{AgentIdentity, AGENT_SEED, MIN_STAKE_AMOUNT};

/// 质押账户上下文
#[derive(Accounts)]
pub struct StakeAgent<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [AGENT_SEED, owner.key().as_ref()],
        bump = agent.bump,
        has_one = owner
    )]
    pub agent: Account<'info, AgentIdentity>,
    
    /// Agent 质押金库 PDA
    #[account(
        mut,
        seeds = [b"agent_vault", agent.key().as_ref()],
        bump
    )]
    pub agent_vault: SystemAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

/// 质押 SOL
pub fn stake_agent(ctx: Context<StakeAgent>, amount: u64) -> Result<()> {
    require!(amount >= MIN_STAKE_AMOUNT, StakingError::InsufficientStake);
    
    let agent = &mut ctx.accounts.agent;
    
    // 转账 SOL 到金库
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.owner.to_account_info(),
                to: ctx.accounts.agent_vault.to_account_info(),
            },
        ),
        amount,
    )?;
    
    // 更新 Agent 状态
    agent.staked_amount = agent.staked_amount.checked_add(amount)
        .ok_or(StakingError::Overflow)?;
    agent.is_active = true;
    
    msg!("Agent staked {} lamports, total: {}", amount, agent.staked_amount);
    
    Ok(())
}

/// 取消质押 (需无活跃订单)
pub fn unstake_agent(ctx: Context<UnstakeAgent>, amount: u64) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    
    require!(agent.staked_amount >= amount, StakingError::InsufficientBalance);
    
    // 检查剩余质押是否满足最低要求
    let remaining = agent.staked_amount.checked_sub(amount)
        .ok_or(StakingError::Overflow)?;
    
    if remaining < MIN_STAKE_AMOUNT {
        agent.is_active = false;
    }
    
    // 从金库转出
    // ... PDA 签名转账逻辑
    
    agent.staked_amount = remaining;
    
    Ok(())
}

/// Slash Agent (由 resolve_challenge 调用)
pub fn slash_agent(ctx: Context<SlashAgent>) -> Result<u64> {
    let agent = &mut ctx.accounts.agent;
    
    let slash_amount = agent.calculate_slash_amount();
    
    agent.staked_amount = agent.staked_amount.checked_sub(slash_amount)
        .ok_or(StakingError::Overflow)?;
    agent.slashed_count = agent.slashed_count.saturating_add(1);
    agent.reputation_score = agent.reputation_score.saturating_sub(1000); // -10%
    
    // 质押不足则停用
    if agent.staked_amount < MIN_STAKE_AMOUNT {
        agent.is_active = false;
    }
    
    msg!("Agent slashed {} lamports, remaining: {}", slash_amount, agent.staked_amount);
    
    Ok(slash_amount)
}

#[error_code]
pub enum StakingError {
    #[msg("Insufficient stake amount, minimum 0.1 SOL")]
    InsufficientStake,
    #[msg("Insufficient staked balance")]
    InsufficientBalance,
    #[msg("Arithmetic overflow")]
    Overflow,
}
```

#### Step 3: 修改 resolve_challenge 集成 Slash

```rust
// 修改 anchor/programs/exo-core/src/instructions/escrow.rs

/// 解决挑战时调用 slash
pub fn resolve_challenge(ctx: Context<ResolveChallenge>, challenger_wins: bool) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    
    if challenger_wins {
        // 1. Slash 执行者
        let slash_amount = slash_agent(/* ... */)?;
        
        // 2. 退还买家
        // ... 现有退款逻辑
        
        // 3. 奖励挑战者 (Slash 金额的一部分)
        let challenger_reward = slash_amount / 2;
        // ... 转账给挑战者
        
        escrow.status = EscrowStatus::Slashed;
    } else {
        escrow.status = EscrowStatus::Completed;
    }
    
    Ok(())
}
```

### 3.5 Verification

| 类型 | 命令/检查 |
|------|-----------|
| **Unit** | `anchor test -- --test stake` |
| **Integration** | 完整流程: stake → accept order → slash |
| **Evidence** | 链上交易记录: 质押/Slash 金额变化 |

### 3.6 Constraints

- ✅ 最低质押 0.1 SOL
- ✅ Slash 比例 50%
- ✅ 被 Slash 3 次自动禁止接单
- ✅ 状态迁移: 现有 Agent 需手动激活

---

## 4. P14-C03: CLI 工具增强

### 4.1 Meta

| 属性 | 值 |
|------|-----|
| **Type** | Standard / Tool |
| **Risk Level** | 🟢 Low |
| **Estimated Hours** | 2-3h |
| **depends_on** | P14-C02 (Agent Staking) |

### 4.2 目标

扩展 `exo-cli` 添加 Agent 管理命令，支持质押操作。

### 4.3 Input Files

| 文件 | 用途 |
|------|------|
| `exo-cli/src/index.ts` | CLI 入口 |
| `exo-cli/src/commands/skill.ts` | 现有命令参考 |

### 4.4 Output Files

| 文件 | 用途 |
|------|------|
| `exo-cli/src/commands/agent.ts` | **新建** - Agent 命令组 |

### 4.5 Action Steps

```typescript
// exo-cli/src/commands/agent.ts

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig } from '../utils/config.js';
import { ExoClient } from '@exo-protocol/sdk';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export const agentCommand = new Command('agent')
    .description('Manage Agent identity and staking');

// exo agent create
agentCommand
    .command('create')
    .description('Create a new Agent identity')
    .action(async () => {
        const spinner = ora('Creating Agent identity...').start();
        try {
            const config = await getConfig();
            const client = new ExoClient(config);
            const tx = await client.agent.create();
            spinner.succeed(`Agent created! TX: ${chalk.cyan(tx)}`);
        } catch (err) {
            spinner.fail(`Failed: ${err.message}`);
        }
    });

// exo agent stake <amount>
agentCommand
    .command('stake <amount>')
    .description('Stake SOL to activate Agent (minimum 0.1 SOL)')
    .action(async (amount: string) => {
        const spinner = ora(`Staking ${amount} SOL...`).start();
        try {
            const config = await getConfig();
            const client = new ExoClient(config);
            const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;
            const tx = await client.agent.stake(lamports);
            spinner.succeed(`Staked ${amount} SOL! TX: ${chalk.cyan(tx)}`);
        } catch (err) {
            spinner.fail(`Failed: ${err.message}`);
        }
    });

// exo agent unstake <amount>
agentCommand
    .command('unstake <amount>')
    .description('Unstake SOL from Agent')
    .action(async (amount: string) => {
        const spinner = ora(`Unstaking ${amount} SOL...`).start();
        try {
            const config = await getConfig();
            const client = new ExoClient(config);
            const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;
            const tx = await client.agent.unstake(lamports);
            spinner.succeed(`Unstaked ${amount} SOL! TX: ${chalk.cyan(tx)}`);
        } catch (err) {
            spinner.fail(`Failed: ${err.message}`);
        }
    });

// exo agent status [address]
agentCommand
    .command('status [address]')
    .description('View Agent status and staking info')
    .action(async (address?: string) => {
        const spinner = ora('Fetching Agent status...').start();
        try {
            const config = await getConfig();
            const client = new ExoClient(config);
            const agent = await client.agent.getStatus(address);
            
            spinner.stop();
            console.log(chalk.bold('\n📊 Agent Status\n'));
            console.log(`  ${chalk.gray('Address:')}     ${agent.address}`);
            console.log(`  ${chalk.gray('Tier:')}        ${agent.tier === 0 ? 'Open' : agent.tier === 1 ? 'Verified' : 'Premium'}`);
            console.log(`  ${chalk.gray('Staked:')}      ${chalk.green((agent.stakedAmount / LAMPORTS_PER_SOL).toFixed(2) + ' SOL')}`);
            console.log(`  ${chalk.gray('Active:')}      ${agent.isActive ? chalk.green('✓') : chalk.red('✗')}`);
            console.log(`  ${chalk.gray('Reputation:')} ${agent.reputationScore}/10000`);
            console.log(`  ${chalk.gray('Earnings:')}    ${(agent.totalEarnings / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
            console.log(`  ${chalk.gray('Tasks:')}       ${agent.totalTasks}`);
            console.log(`  ${chalk.gray('Slashed:')}     ${agent.slashedCount} times\n`);
        } catch (err) {
            spinner.fail(`Failed: ${err.message}`);
        }
    });

// exo agent list
agentCommand
    .command('list')
    .description('List all registered Agents')
    .option('-l, --limit <number>', 'Number of agents to show', '10')
    .option('--active-only', 'Show only active agents')
    .action(async (options) => {
        const spinner = ora('Fetching Agents...').start();
        try {
            const config = await getConfig();
            const client = new ExoClient(config);
            const agents = await client.agent.list({
                limit: parseInt(options.limit),
                activeOnly: options.activeOnly
            });
            
            spinner.stop();
            console.log(chalk.bold(`\n📋 Registered Agents (${agents.length})\n`));
            
            agents.forEach((agent, i) => {
                const status = agent.isActive ? chalk.green('●') : chalk.gray('○');
                const stake = (agent.stakedAmount / LAMPORTS_PER_SOL).toFixed(2);
                console.log(`  ${status} ${agent.address.slice(0, 8)}... | Stake: ${stake} SOL | Rep: ${agent.reputationScore}`);
            });
            console.log();
        } catch (err) {
            spinner.fail(`Failed: ${err.message}`);
        }
    });
```

### 4.6 Verification

| 类型 | 命令 |
|------|------|
| **Build** | `cd exo-cli && pnpm build` |
| **Test** | `exo agent create && exo agent stake 0.1 && exo agent status` |
| **Evidence** | 截图: CLI 输出 + 链上状态变化 |

---

## 5. P14-C04: ZK Compression Agent 身份

### 5.1 Meta

| 属性 | 值 |
|------|-----|
| **Type** | Critical / Contract |
| **Risk Level** | 🔴 High |
| **Estimated Hours** | 8-12h |
| **depends_on** | P14-C02 (Agent Staking) |

### 5.2 目标

使用 **Light Protocol ZK Compression** 存储 Agent 行为历史，实现：
- 百万级 Agent 身份低成本存储
- Agent 推理历史的链上证明
- 信用评分的可验证计算

### 5.3 External Dependencies

| 资源 | 类型 | 状态 | 获取方式 |
|------|------|------|----------|
| Light Protocol SDK | 公开 NPM | ⬜ 待安装 | `@lightprotocol/stateless.js` |
| Light Protocol Devnet | 公开 API | ⬜ 待确认 | Light Protocol Devnet RPC |

### 5.4 Input Files

| 文件 | 用途 |
|------|------|
| `anchor/programs/exo-core/src/state/agent.rs` | Agent 状态 |
| `exo-sdk/src/client.ts` | SDK 客户端 |

### 5.5 Output Files

| 文件 | 用途 |
|------|------|
| `exo-sdk/src/instructions/zk.ts` | **新建** - ZK 压缩指令 |
| `exo-sdk/src/types/compressed.ts` | **新建** - 压缩数据类型 |

### 5.6 Action Steps

#### Step 1: 安装 Light Protocol SDK

```bash
cd exo-sdk
pnpm add @lightprotocol/stateless.js @lightprotocol/compressed-token
```

#### Step 2: 定义压缩数据结构

```typescript
// exo-sdk/src/types/compressed.ts

export interface CompressedAgentHistory {
    /** Agent 公钥 */
    agentPubkey: string;
    /** 行为记录哈希 (Merkle Root) */
    historyRoot: string;
    /** 记录数量 */
    recordCount: number;
    /** 最后更新时间 */
    lastUpdated: number;
}

export interface AgentHistoryRecord {
    /** 记录类型 */
    type: 'execution' | 'challenge' | 'slash' | 'stake';
    /** 时间戳 */
    timestamp: number;
    /** 关联订单 */
    orderPubkey?: string;
    /** 结果哈希 */
    resultHash?: string;
    /** 信誉变化 */
    reputationDelta: number;
}
```

#### Step 3: 实现 ZK 压缩存储

```typescript
// exo-sdk/src/instructions/zk.ts

import {
    Rpc,
    createRpc,
    CompressedAccount,
    bn,
} from '@lightprotocol/stateless.js';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { AgentHistoryRecord, CompressedAgentHistory } from '../types/compressed';

const LIGHT_RPC_URL = 'https://devnet.helius-rpc.com?api-key=YOUR_API_KEY';

export class ZKAgentHistory {
    private rpc: Rpc;
    private connection: Connection;
    
    constructor(connection: Connection) {
        this.connection = connection;
        this.rpc = createRpc(LIGHT_RPC_URL, LIGHT_RPC_URL);
    }
    
    /**
     * 压缩存储 Agent 行为记录
     */
    async storeRecord(
        payer: Keypair,
        agentPubkey: PublicKey,
        record: AgentHistoryRecord
    ): Promise<string> {
        // 序列化记录
        const data = Buffer.from(JSON.stringify(record));
        
        // 创建压缩账户
        const { txId } = await this.rpc.compress(
            this.connection,
            payer,
            data,
            agentPubkey // 关联到 Agent
        );
        
        return txId;
    }
    
    /**
     * 获取 Agent 历史摘要
     */
    async getHistorySummary(agentPubkey: PublicKey): Promise<CompressedAgentHistory> {
        const accounts = await this.rpc.getCompressedAccountsByOwner(agentPubkey);
        
        // 计算 Merkle Root
        const historyRoot = this.computeMerkleRoot(accounts);
        
        return {
            agentPubkey: agentPubkey.toBase58(),
            historyRoot,
            recordCount: accounts.length,
            lastUpdated: Date.now(),
        };
    }
    
    /**
     * 验证历史记录 (用于信用借贷)
     */
    async verifyHistory(
        agentPubkey: PublicKey,
        expectedRoot: string
    ): Promise<boolean> {
        const summary = await this.getHistorySummary(agentPubkey);
        return summary.historyRoot === expectedRoot;
    }
    
    /**
     * 计算信用评分 (基于历史)
     */
    async calculateCreditScore(agentPubkey: PublicKey): Promise<number> {
        const accounts = await this.rpc.getCompressedAccountsByOwner(agentPubkey);
        
        let score = 5000; // 基础分
        
        for (const account of accounts) {
            const record: AgentHistoryRecord = JSON.parse(
                Buffer.from(account.data).toString()
            );
            
            score += record.reputationDelta;
        }
        
        return Math.max(0, Math.min(10000, score));
    }
    
    private computeMerkleRoot(accounts: CompressedAccount[]): string {
        // 简化版: 直接哈希所有数据
        const crypto = require('crypto');
        const combined = accounts.map(a => a.data).join('');
        return crypto.createHash('sha256').update(combined).digest('hex');
    }
}
```

#### Step 4: 集成到 ExoClient

```typescript
// 修改 exo-sdk/src/client.ts

import { ZKAgentHistory } from './instructions/zk';

export class ExoClient {
    // ... 现有代码
    
    /** ZK 压缩历史 */
    public readonly zkHistory: ZKAgentHistory;
    
    constructor(options: ExoClientOptions) {
        // ... 现有初始化
        this.zkHistory = new ZKAgentHistory(this.connection);
    }
}
```

### 5.7 Verification

| 类型 | 命令/检查 |
|------|-----------|
| **Unit** | `pnpm test -- --grep "ZK"` |
| **Integration** | 完整流程: 存储记录 → 获取摘要 → 计算信用分 |
| **Evidence** | Light Protocol Explorer 截图 + 压缩账户地址 |

### 5.8 演示亮点

```
演示话术: "每个 Agent 的链上信用历史，存储成本降低 1000 倍。
          百万 Agent 的信用档案，成本不到 1 SOL。
          这就是 ZK Compression 的力量。"
```

---

## 6. 执行顺序与依赖图

```
┌─────────────────────────────────────────────────────────────────┐
│                    Phase 14 执行依赖图                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   P14-C01 (AI Executor)  ──────────────────┐                   │
│        │                                    │                   │
│        │ (独立)                             │                   │
│        ▼                                    │                   │
│   [可并行]                                  │                   │
│                                             │                   │
│   P14-C02 (Agent Staking) ─────────────────┼──────────────────┐│
│        │                                    │                  ││
│        │ (依赖)                             │                  ││
│        ▼                                    ▼                  ▼│
│   P14-C03 (CLI Tool) ────────────────▶ [集成测试]  ◀────── P14-C04│
│                                             │            (ZK Compression)
│                                             │                   │
│                                             ▼                   │
│                                      [视频演示]                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

执行顺序建议:
  Phase 1: P14-C01 + P14-C02 (并行, 无依赖)
  Phase 2: P14-C03 (依赖 P14-C02)
  Phase 3: P14-C04 (依赖 P14-C02, 可与 P14-C03 并行)
  Phase 4: 集成测试 + 视频更新
```

---

## 7. 资源前置确认清单

| 资源 | 类型 | 状态 | 操作 |
|------|------|------|------|
| Anthropic API Key | 私有 API | ⬜ 待确认 | 用户提供 `ANTHROPIC_API_KEY` |
| OpenAI API Key (备选) | 私有 API | ⬜ 可选 | 用户提供 `OPENAI_API_KEY` |
| Light Protocol Devnet | 公开 API | ⬜ 待确认 | 确认 Devnet 可用性 |
| 额外 Devnet SOL | 公开 API | ✅ 4.89 SOL | 足够测试 |

---

## 8. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| **API Key 未配置** | 中 | 高 | P14-C01 提供 Mock 模式降级 |
| **合约升级兼容性** | 中 | 高 | AgentIdentity V2 使用新 PDA 种子 |
| **Light Protocol 不稳定** | 低 | 中 | P14-C04 可降级为本地存储 |
| **工时超预估** | 中 | 中 | P14-C04 可拆分为多个子任务 |

---

## 9. 验收清单

### Phase 14 Gate 条件

- [ ] P14-C01: AI Executor 可正常调用 Claude API 返回结果
- [ ] P14-C02: Agent Staking 合约部署成功，stake/slash 测试通过
- [ ] P14-C03: CLI `exo agent stake 0.1` 命令可用
- [ ] P14-C04: ZK 压缩存储可写入/读取 Agent 历史
- [ ] 集成测试: stake → execute → challenge → slash 全流程通过
- [ ] 视频脚本更新: 包含新功能演示点

---

**文档版本**: 1.0.0
**最后更新**: 2024-12-19 19:15 UTC+8
**作者**: CSA (Chief System Architect)
