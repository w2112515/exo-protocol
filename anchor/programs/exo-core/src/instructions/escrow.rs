use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{
    AgentIdentity, 
    SkillAccount, 
    ProtocolConfig, 
    EscrowAccount,
    EscrowStatus,
    AGENT_SEED,
    PROTOCOL_CONFIG_SEED,
    ESCROW_SEED,
    DEFAULT_FEE_BASIS_POINTS,
};

/// 初始化协议配置的账户上下文
#[derive(Accounts)]
pub struct InitProtocolConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = ProtocolConfig::LEN,
        seeds = [PROTOCOL_CONFIG_SEED],
        bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    /// CHECK: 协议费接收地址，由 authority 指定
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

/// 创建 Escrow 的账户上下文
#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct CreateEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        seeds = [b"skill", skill.authority.as_ref(), &skill.content_hash[..8]],
        bump = skill.bump
    )]
    pub skill: Account<'info, SkillAccount>,

    #[account(
        init,
        payer = buyer,
        space = EscrowAccount::LEN,
        seeds = [ESCROW_SEED, buyer.key().as_ref(), skill.key().as_ref(), &nonce.to_le_bytes()],
        bump
    )]
    pub escrow: Account<'info, EscrowAccount>,

    pub system_program: Program<'info, System>,
}

/// 完成 Escrow 的账户上下文
#[derive(Accounts)]
pub struct CompleteEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, escrow.buyer.as_ref(), escrow.skill.as_ref(), &escrow.nonce.to_le_bytes()],
        bump = escrow.bump,
        has_one = buyer,
        constraint = escrow.status == EscrowStatus::Pending || escrow.status == EscrowStatus::InProgress @ EscrowError::InvalidEscrowStatus
    )]
    pub escrow: Account<'info, EscrowAccount>,

    #[account(
        mut,
        seeds = [b"skill", skill.authority.as_ref(), &skill.content_hash[..8]],
        bump = skill.bump,
        constraint = skill.key() == escrow.skill @ EscrowError::SkillMismatch
    )]
    pub skill: Account<'info, SkillAccount>,

    #[account(
        seeds = [PROTOCOL_CONFIG_SEED],
        bump = protocol_config.bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    /// CHECK: 协议费接收地址
    #[account(
        mut,
        constraint = treasury.key() == protocol_config.treasury @ EscrowError::InvalidTreasury
    )]
    pub treasury: UncheckedAccount<'info>,

    /// CHECK: Skill 创作者地址
    #[account(
        mut,
        constraint = skill_authority.key() == skill.authority @ EscrowError::InvalidSkillAuthority
    )]
    pub skill_authority: UncheckedAccount<'info>,

    /// 执行 Agent 身份账户
    #[account(
        mut,
        seeds = [AGENT_SEED, executor_agent.owner.as_ref()],
        bump = executor_agent.bump
    )]
    pub executor_agent: Account<'info, AgentIdentity>,

    /// CHECK: 执行者钱包地址
    #[account(
        mut,
        constraint = executor_wallet.key() == executor_agent.owner @ EscrowError::ExecutorMismatch
    )]
    pub executor_wallet: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

/// 取消 Escrow 的账户上下文
#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, escrow.buyer.as_ref(), escrow.skill.as_ref(), &escrow.nonce.to_le_bytes()],
        bump = escrow.bump,
        has_one = buyer,
        constraint = escrow.status == EscrowStatus::Pending @ EscrowError::CannotCancelNonPending,
        close = buyer
    )]
    pub escrow: Account<'info, EscrowAccount>,

    pub system_program: Program<'info, System>,
}

/// 初始化协议配置
/// 
/// 仅执行一次，设置协议费率和 treasury 地址
pub fn init_protocol_config(
    ctx: Context<InitProtocolConfig>,
    fee_basis_points: u16,
) -> Result<()> {
    let config = &mut ctx.accounts.protocol_config;

    config.authority = ctx.accounts.authority.key();
    config.fee_basis_points = if fee_basis_points > 0 { fee_basis_points } else { DEFAULT_FEE_BASIS_POINTS };
    config.treasury = ctx.accounts.treasury.key();
    config.bump = ctx.bumps.protocol_config;

    msg!("Protocol config initialized");
    msg!("Authority: {:?}", config.authority);
    msg!("Fee basis points: {}", config.fee_basis_points);
    msg!("Treasury: {:?}", config.treasury);

    Ok(())
}

/// 创建 Escrow 托管
/// 
/// 买家支付 skill.price_lamports 到 Escrow PDA
pub fn create_escrow(ctx: Context<CreateEscrow>, nonce: u64) -> Result<()> {
    let skill = &ctx.accounts.skill;
    let escrow = &mut ctx.accounts.escrow;
    let clock = Clock::get()?;

    // 校验 Skill 未下架
    require!(!skill.is_deprecated, EscrowError::SkillDeprecated);

    // 校验价格大于 0
    require!(skill.price_lamports > 0, EscrowError::InvalidPrice);

    // 转移资金: buyer -> escrow PDA
    let transfer_amount = skill.price_lamports;
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: escrow.to_account_info(),
            },
        ),
        transfer_amount,
    )?;

    // 初始化 escrow 账户
    escrow.buyer = ctx.accounts.buyer.key();
    escrow.skill = skill.key();
    escrow.executor = None;
    escrow.amount = transfer_amount;
    escrow.status = EscrowStatus::Pending;
    escrow.created_at = clock.unix_timestamp;
    escrow.expires_at = clock.unix_timestamp + EscrowAccount::DEFAULT_EXPIRY_DURATION;
    escrow.nonce = nonce;
    escrow.bump = ctx.bumps.escrow;
    escrow.result_hash = None;
    escrow.challenger = None;
    escrow.challenge_slot = None;

    msg!("Escrow created");
    msg!("Buyer: {:?}", escrow.buyer);
    msg!("Skill: {:?}", escrow.skill);
    msg!("Amount: {} lamports", escrow.amount);
    msg!("Expires at: {}", escrow.expires_at);

    Ok(())
}

/// 完成 Escrow，触发分账
/// 
/// 分账比例:
/// - 5% 协议费 → treasury
/// - 10% Skill 版税 → skill.authority  
/// - 85% 执行者 → executor_wallet
pub fn complete_escrow(ctx: Context<CompleteEscrow>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let skill = &mut ctx.accounts.skill;
    let executor_agent = &mut ctx.accounts.executor_agent;
    let protocol_config = &ctx.accounts.protocol_config;

    let total = escrow.amount;

    // 使用 checked_mul/checked_div 计算分账金额
    // 协议费: 5%
    let protocol_fee = total
        .checked_mul(protocol_config.fee_basis_points as u64)
        .ok_or(EscrowError::Overflow)?
        .checked_div(10000)
        .ok_or(EscrowError::Overflow)?;

    // Skill 版税: 10% (1000 basis points)
    let skill_royalty = total
        .checked_mul(1000)
        .ok_or(EscrowError::Overflow)?
        .checked_div(10000)
        .ok_or(EscrowError::Overflow)?;

    // 执行者收入: 剩余部分 (85%)
    let executor_payout = total
        .checked_sub(protocol_fee)
        .ok_or(EscrowError::Overflow)?
        .checked_sub(skill_royalty)
        .ok_or(EscrowError::Overflow)?;

    // 获取 escrow PDA 的签名种子
    let escrow_seeds = &[
        ESCROW_SEED,
        escrow.buyer.as_ref(),
        escrow.skill.as_ref(),
        &escrow.nonce.to_le_bytes(),
        &[escrow.bump],
    ];

    // 转账: escrow → treasury (协议费)
    if protocol_fee > 0 {
        **escrow.to_account_info().try_borrow_mut_lamports()? -= protocol_fee;
        **ctx.accounts.treasury.to_account_info().try_borrow_mut_lamports()? += protocol_fee;
    }

    // 转账: escrow → skill_authority (版税)
    if skill_royalty > 0 {
        **escrow.to_account_info().try_borrow_mut_lamports()? -= skill_royalty;
        **ctx.accounts.skill_authority.to_account_info().try_borrow_mut_lamports()? += skill_royalty;
    }

    // 转账: escrow → executor_wallet (执行者收入)
    if executor_payout > 0 {
        **escrow.to_account_info().try_borrow_mut_lamports()? -= executor_payout;
        **ctx.accounts.executor_wallet.to_account_info().try_borrow_mut_lamports()? += executor_payout;
    }

    // 更新 escrow 状态
    escrow.status = EscrowStatus::Completed;
    escrow.executor = Some(executor_agent.owner);

    // 更新 AgentIdentity 统计
    executor_agent.total_earnings = executor_agent.total_earnings
        .checked_add(executor_payout)
        .ok_or(EscrowError::Overflow)?;
    executor_agent.total_tasks = executor_agent.total_tasks
        .checked_add(1)
        .ok_or(EscrowError::Overflow)?;

    // 更新 SkillAccount 统计
    skill.total_calls = skill.total_calls
        .checked_add(1)
        .ok_or(EscrowError::Overflow)?;
    skill.total_revenue = skill.total_revenue
        .checked_add(skill_royalty)
        .ok_or(EscrowError::Overflow)?;

    msg!("Escrow completed - Distribution:");
    msg!("  Protocol fee: {} lamports -> treasury", protocol_fee);
    msg!("  Skill royalty: {} lamports -> skill authority", skill_royalty);
    msg!("  Executor payout: {} lamports -> executor", executor_payout);
    msg!("Agent stats updated: earnings={}, tasks={}", executor_agent.total_earnings, executor_agent.total_tasks);
    msg!("Skill stats updated: calls={}, revenue={}", skill.total_calls, skill.total_revenue);

    Ok(())
}

/// 取消 Escrow，退款给 buyer
/// 
/// 仅 Pending 状态可取消，资金自动退回 buyer (通过 close 约束)
pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
    msg!("Escrow cancelled, funds returned to buyer: {:?}", ctx.accounts.buyer.key());
    Ok(())
}

/// 执行者提交结果哈希的账户上下文
#[derive(Accounts)]
pub struct CommitResult<'info> {
    #[account(
        mut,
        seeds = [ESCROW_SEED, escrow.buyer.as_ref(), escrow.skill.as_ref(), &escrow.nonce.to_le_bytes()],
        bump = escrow.bump,
        constraint = escrow.status == EscrowStatus::Pending || escrow.status == EscrowStatus::InProgress @ EscrowError::InvalidEscrowStatus
    )]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub executor: Signer<'info>,
}

/// 挑战 Escrow 的账户上下文
#[derive(Accounts)]
pub struct ChallengeEscrow<'info> {
    #[account(
        mut,
        seeds = [ESCROW_SEED, escrow.buyer.as_ref(), escrow.skill.as_ref(), &escrow.nonce.to_le_bytes()],
        bump = escrow.bump,
        constraint = escrow.status == EscrowStatus::Completed @ EscrowError::InvalidEscrowStatus
    )]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub challenger: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// 解决挑战的账户上下文
#[derive(Accounts)]
pub struct ResolveChallenge<'info> {
    #[account(
        mut,
        seeds = [ESCROW_SEED, escrow.buyer.as_ref(), escrow.skill.as_ref(), &escrow.nonce.to_le_bytes()],
        bump = escrow.bump,
        has_one = buyer,
        constraint = escrow.status == EscrowStatus::Challenged @ EscrowError::InvalidEscrowStatus
    )]
    pub escrow: Account<'info, EscrowAccount>,
    /// CHECK: 仅接收退款
    #[account(mut)]
    pub buyer: AccountInfo<'info>,
    /// 协议管理员 (MVP: 信任管理员裁决)
    #[account(
        constraint = authority.key() == protocol_config.authority @ EscrowError::Unauthorized
    )]
    pub authority: Signer<'info>,
    #[account(
        seeds = [PROTOCOL_CONFIG_SEED],
        bump = protocol_config.bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
    pub system_program: Program<'info, System>,
}

/// 执行者提交结果哈希
/// 将状态从 Pending/InProgress -> Completed (进入挑战窗口)
pub fn commit_result(ctx: Context<CommitResult>, result_hash: [u8; 32]) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let clock = Clock::get()?;
    
    escrow.executor = Some(ctx.accounts.executor.key());
    escrow.result_hash = Some(result_hash);
    escrow.status = EscrowStatus::Completed;
    
    // 记录 commit slot (挑战窗口起点)
    escrow.challenge_slot = Some(clock.slot);
    
    msg!("Result committed by executor: {:?}", ctx.accounts.executor.key());
    msg!("Result hash: {:?}", result_hash);
    msg!("Challenge window started at slot: {}", clock.slot);
    
    Ok(())
}

/// 挑战已提交的结果
/// 条件: 状态为 Completed 且在挑战窗口内 (100 slots ≈ 40s)
pub fn challenge(ctx: Context<ChallengeEscrow>, _proof: [u8; 64]) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let clock = Clock::get()?;
    
    // 检查挑战窗口 (100 slots)
    let challenge_slot = escrow.challenge_slot.ok_or(EscrowError::NoChallengeSlot)?;
    require!(
        clock.slot <= challenge_slot + 100,
        EscrowError::ChallengeWindowExpired
    );
    
    // 更新状态
    escrow.challenger = Some(ctx.accounts.challenger.key());
    escrow.status = EscrowStatus::Challenged;
    
    msg!("Escrow challenged by: {:?}", ctx.accounts.challenger.key());
    msg!("Challenge slot: {}, Current slot: {}", challenge_slot, clock.slot);
    
    Ok(())
}

/// 解决挑战 - MVP 简化版: 管理员裁决
/// 完整版应由 Verifier Committee 投票决定
pub fn resolve_challenge(ctx: Context<ResolveChallenge>, challenger_wins: bool) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    
    if challenger_wins {
        // 挑战成功: Slash 执行者
        escrow.status = EscrowStatus::Slashed;
        
        // 退还买家本金
        let amount = escrow.amount;
        **escrow.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? += amount;
        
        msg!("Challenge resolved: Challenger wins!");
        msg!("Refunded {} lamports to buyer: {:?}", amount, ctx.accounts.buyer.key());
    } else {
        // 挑战失败: 恢复 Completed 状态，继续原流程
        escrow.status = EscrowStatus::Completed;
        msg!("Challenge resolved: Executor wins, status reverted to Completed");
    }
    
    Ok(())
}

/// Escrow 相关错误
#[error_code]
pub enum EscrowError {
    #[msg("Skill has been deprecated")]
    SkillDeprecated,
    #[msg("Invalid skill price")]
    InvalidPrice,
    #[msg("Invalid escrow status for this operation")]
    InvalidEscrowStatus,
    #[msg("Skill account mismatch")]
    SkillMismatch,
    #[msg("Invalid treasury account")]
    InvalidTreasury,
    #[msg("Invalid skill authority")]
    InvalidSkillAuthority,
    #[msg("Executor wallet mismatch")]
    ExecutorMismatch,
    #[msg("Can only cancel pending escrows")]
    CannotCancelNonPending,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Challenge window has expired (100 slots)")]
    ChallengeWindowExpired,
    #[msg("No challenge slot recorded")]
    NoChallengeSlot,
    #[msg("Unauthorized")]
    Unauthorized,
}
