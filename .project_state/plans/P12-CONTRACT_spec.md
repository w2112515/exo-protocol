# P12-CONTRACT: 实现 Challenge & Resolve 指令

## Meta
- **Type**: `Critical / Contract`
- **Risk Level**: 🔴 High
- **depends_on**: None (Phase 12 首任务)
- **Source**: `docs/HACKATHON_REINFORCEMENT_PLAN.md` §2.1

## Input Files
- `anchor/programs/exo-core/src/lib.rs` (L82-103)
- `anchor/programs/exo-core/src/state/escrow.rs` (L10-19 EscrowStatus)
- `anchor/programs/exo-core/src/instructions/escrow.rs` (全文)
- `anchor/programs/exo-core/src/instructions/mod.rs`

## External Dependencies
| 资源 | 类型 | 状态 |
|------|------|------|
| Devnet RPC | 公开 API | ✅ 已确认 |
| Anchor CLI 0.31 | 本地服务 | ✅ 已确认 |

## Background
当前 `EscrowStatus` 已预留 `Disputed` 状态，但缺少触发该状态的指令。
需要实现最小化挑战机制，支持演示 "恶意提交 -> 挑战 -> Slash" 流程。

## Action Steps

### Step 1: 扩展 EscrowStatus 枚举
**文件**: `anchor/programs/exo-core/src/state/escrow.rs`

```rust
// 在现有枚举基础上添加 Challenged 状态
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum EscrowStatus {
    #[default]
    Pending,      // 待执行
    InProgress,   // 执行中  
    Completed,    // 已完成
    Cancelled,    // 已取消
    Challenged,   // 🆕 被挑战 (等待裁决)
    Disputed,     // 争议中 (裁决进行)
    Slashed,      // 🆕 已罚没 (挑战成功)
}
```

### Step 2: 扩展 EscrowAccount 字段
**文件**: `anchor/programs/exo-core/src/state/escrow.rs`

在 `EscrowAccount` 结构体中添加:
```rust
pub struct EscrowAccount {
    // ... 现有字段 ...
    
    /// 🆕 执行者提交的结果哈希 (用于挑战验证)
    pub result_hash: Option<[u8; 32]>,
    /// 🆕 挑战者地址
    pub challenger: Option<Pubkey>,
    /// 🆕 挑战时的 slot (用于超时判断)
    pub challenge_slot: Option<u64>,
}
```

更新 `LEN` 常量:
```rust
// + 1 + 32 (Option<[u8;32]>) + 1 + 32 (Option<Pubkey>) + 1 + 8 (Option<u64>)
pub const LEN: usize = 8 + 32 + 32 + 1 + 32 + 8 + 1 + 8 + 8 + 8 + 1 + 1 + 32 + 1 + 32 + 1 + 8;
```

### Step 3: 实现 commit_result 指令
**文件**: `anchor/programs/exo-core/src/instructions/escrow.rs`

```rust
/// 执行者提交结果哈希
/// 将状态从 Pending/InProgress -> Completed (进入挑战窗口)
pub fn commit_result(ctx: Context<CommitResult>, result_hash: [u8; 32]) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    
    require!(
        escrow.status == EscrowStatus::Pending || escrow.status == EscrowStatus::InProgress,
        EscrowError::InvalidStatus
    );
    
    escrow.executor = Some(ctx.accounts.executor.key());
    escrow.result_hash = Some(result_hash);
    escrow.status = EscrowStatus::Completed;
    
    // 记录 commit slot (挑战窗口起点)
    let clock = Clock::get()?;
    escrow.challenge_slot = Some(clock.slot);
    
    Ok(())
}

#[derive(Accounts)]
pub struct CommitResult<'info> {
    #[account(mut, has_one = skill)]
    pub escrow: Account<'info, EscrowAccount>,
    pub skill: Account<'info, SkillAccount>,
    #[account(mut)]
    pub executor: Signer<'info>,
}
```

### Step 4: 实现 challenge 指令
**文件**: `anchor/programs/exo-core/src/instructions/escrow.rs`

```rust
/// 挑战已提交的结果
/// 条件: 状态为 Completed 且在挑战窗口内 (100 slots ≈ 40s)
pub fn challenge(ctx: Context<ChallengeEscrow>, proof: [u8; 64]) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let clock = Clock::get()?;
    
    // 检查状态
    require!(escrow.status == EscrowStatus::Completed, EscrowError::InvalidStatus);
    
    // 检查挑战窗口 (100 slots)
    let challenge_slot = escrow.challenge_slot.ok_or(EscrowError::NoChallengeSlot)?;
    require!(
        clock.slot <= challenge_slot + 100,
        EscrowError::ChallengeWindowExpired
    );
    
    // 更新状态
    escrow.challenger = Some(ctx.accounts.challenger.key());
    escrow.status = EscrowStatus::Challenged;
    
    // TODO: 存储 proof 用于后续验证 (MVP 简化: 信任挑战者)
    
    Ok(())
}

#[derive(Accounts)]
pub struct ChallengeEscrow<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub challenger: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

### Step 5: 实现 resolve_challenge 指令 (Hackathon Shortcut)
**文件**: `anchor/programs/exo-core/src/instructions/escrow.rs`

```rust
/// 解决挑战 - MVP 简化版: 直接 Slash
/// 完整版应由 Verifier Committee 投票决定
pub fn resolve_challenge(ctx: Context<ResolveChallenge>, challenger_wins: bool) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    
    require!(escrow.status == EscrowStatus::Challenged, EscrowError::InvalidStatus);
    
    if challenger_wins {
        // 挑战成功: Slash 执行者
        escrow.status = EscrowStatus::Slashed;
        
        // 退还买家本金
        let amount = escrow.amount;
        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? += amount;
        
        // TODO: 从执行者押金中奖励挑战者 (Phase 2)
    } else {
        // 挑战失败: 恢复 Completed 状态，继续原流程
        escrow.status = EscrowStatus::Completed;
    }
    
    Ok(())
}

#[derive(Accounts)]
pub struct ResolveChallenge<'info> {
    #[account(mut, has_one = buyer)]
    pub escrow: Account<'info, EscrowAccount>,
    /// CHECK: 仅接收退款
    #[account(mut)]
    pub buyer: AccountInfo<'info>,
    /// 协议管理员 (MVP: 信任管理员裁决)
    #[account(
        constraint = authority.key() == protocol_config.authority @ EscrowError::Unauthorized
    )]
    pub authority: Signer<'info>,
    pub protocol_config: Account<'info, ProtocolConfig>,
    pub system_program: Program<'info, System>,
}
```

### Step 6: 更新 mod.rs 导出
**文件**: `anchor/programs/exo-core/src/instructions/mod.rs`

```rust
pub use escrow::{
    create_escrow, CreateEscrow,
    complete_escrow, CompleteEscrow,
    cancel_escrow, CancelEscrow,
    commit_result, CommitResult,       // 🆕
    challenge, ChallengeEscrow,        // 🆕
    resolve_challenge, ResolveChallenge, // 🆕
};
```

### Step 7: 更新 lib.rs 入口
**文件**: `anchor/programs/exo-core/src/lib.rs`

在 `#[program]` mod 中添加:
```rust
/// 执行者提交结果哈希
pub fn commit_result(ctx: Context<CommitResult>, result_hash: [u8; 32]) -> Result<()> {
    instructions::commit_result(ctx, result_hash)
}

/// 挑战已提交的结果
pub fn challenge(ctx: Context<ChallengeEscrow>, proof: [u8; 64]) -> Result<()> {
    instructions::challenge(ctx, proof)
}

/// 解决挑战 (MVP: 管理员裁决)
pub fn resolve_challenge(ctx: Context<ResolveChallenge>, challenger_wins: bool) -> Result<()> {
    instructions::resolve_challenge(ctx, challenger_wins)
}
```

### Step 8: 添加错误类型
**文件**: `anchor/programs/exo-core/src/instructions/escrow.rs` (或独立 errors.rs)

```rust
#[error_code]
pub enum EscrowError {
    #[msg("Invalid escrow status for this operation")]
    InvalidStatus,
    #[msg("Challenge window has expired (100 slots)")]
    ChallengeWindowExpired,
    #[msg("No challenge slot recorded")]
    NoChallengeSlot,
    #[msg("Unauthorized")]
    Unauthorized,
}
```

## Constraints
- 必须使用 Anchor 0.31.x 语法
- 挑战窗口固定为 100 slots (约 40 秒，适合演示)
- MVP 阶段: `resolve_challenge` 由 protocol authority 调用，跳过委员会投票
- 不修改现有 `complete_escrow` 逻辑 (Transfer Hook 分账保持不变)

## Verification
- **Unit**: `cd anchor && anchor test -- --test challenge`
- **Integration**: 
  ```bash
  # 部署到 devnet
  anchor deploy --provider.cluster devnet
  # 运行 E2E 测试
  pnpm --filter exo-sdk test:e2e
  ```
- **Evidence**: 
  - `anchor build` 无错误
  - 测试覆盖 `commit_result -> challenge -> resolve_challenge` 完整流程

## Rollback
```bash
git checkout anchor/programs/exo-core/src/
anchor build
```

---
*Generated by CSA Protocol - P12-CONTRACT Critical Spec*
