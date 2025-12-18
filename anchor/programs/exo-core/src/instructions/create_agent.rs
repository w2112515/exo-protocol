use anchor_lang::prelude::*;
use crate::state::{
    AgentIdentity, 
    ProtocolConfig,
    AGENT_SEED, 
    PROTOCOL_CONFIG_SEED,
    DEFAULT_REPUTATION, 
    MAX_REPUTATION, 
    MIN_REPUTATION
};

/// 创建 Agent 指令的账户上下文
#[derive(Accounts)]
pub struct CreateAgent<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = AgentIdentity::LEN,
        seeds = [AGENT_SEED, owner.key().as_ref()],
        bump
    )]
    pub agent: Account<'info, AgentIdentity>,

    pub system_program: Program<'info, System>,
}

/// 升级 Tier 指令的账户上下文
#[derive(Accounts)]
pub struct UpgradeTier<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [AGENT_SEED, owner.key().as_ref()],
        bump = agent.bump,
        has_one = owner
    )]
    pub agent: Account<'info, AgentIdentity>,
}

/// 更新信誉分指令的账户上下文
#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    /// 协议权限账户 (仅此账户可修改信誉分)
    pub authority: Signer<'info>,

    /// 协议配置账户 (用于校验 authority)
    #[account(
        seeds = [PROTOCOL_CONFIG_SEED],
        bump = protocol_config.bump,
        constraint = protocol_config.authority == authority.key() @ AgentError::UnauthorizedAuthority
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    #[account(
        mut,
        seeds = [AGENT_SEED, agent.owner.as_ref()],
        bump = agent.bump
    )]
    pub agent: Account<'info, AgentIdentity>,
}

/// 创建 Agent 身份
/// 
/// 任何人可以调用，为自己创建一个 Agent 身份
/// 默认 tier=0, reputation_score=5000
pub fn create_agent(ctx: Context<CreateAgent>) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    let clock = Clock::get()?;

    agent.owner = ctx.accounts.owner.key();
    agent.tier = 0;
    agent.total_earnings = 0;
    agent.total_tasks = 0;
    agent.reputation_score = DEFAULT_REPUTATION;
    agent.created_at = clock.unix_timestamp;
    agent.bump = ctx.bumps.agent;

    msg!("Agent created for owner: {:?}", agent.owner);
    msg!("Initial tier: {}, reputation: {}", agent.tier, agent.reputation_score);

    Ok(())
}

/// 升级 Agent Tier
/// 
/// 仅 Agent owner 可以调用，自动检查升级条件
/// Tier 0 → 1: total_earnings >= 1 SOL
/// Tier 1 → 2: total_earnings >= 10 SOL && reputation_score >= 8000
pub fn upgrade_tier(ctx: Context<UpgradeTier>) -> Result<()> {
    let agent = &mut ctx.accounts.agent;

    let old_tier = agent.tier;

    if agent.can_upgrade_to_tier_1() {
        agent.tier = 1;
        msg!("Agent upgraded from Tier 0 to Tier 1");
    } else if agent.can_upgrade_to_tier_2() {
        agent.tier = 2;
        msg!("Agent upgraded from Tier 1 to Tier 2");
    } else {
        return Err(AgentError::UpgradeConditionNotMet.into());
    }

    msg!(
        "Agent tier upgraded: {} -> {} (earnings: {}, reputation: {})",
        old_tier,
        agent.tier,
        agent.total_earnings,
        agent.reputation_score
    );

    Ok(())
}

/// 更新 Agent 信誉分
/// 
/// 仅协议 authority 可以调用
/// delta > 0: 增加信誉分
/// delta < 0: 减少信誉分
/// 使用 saturating 算法确保边界安全 (0-10000)
pub fn update_reputation(ctx: Context<UpdateReputation>, delta: i16) -> Result<()> {
    let agent = &mut ctx.accounts.agent;

    let old_score = agent.reputation_score;

    if delta >= 0 {
        // 增加信誉分 (saturating add，不超过 MAX)
        let addition = delta as u16;
        agent.reputation_score = agent.reputation_score
            .saturating_add(addition)
            .min(MAX_REPUTATION);
    } else {
        // 减少信誉分 (saturating sub，不低于 MIN)
        let subtraction = delta.unsigned_abs();
        agent.reputation_score = agent.reputation_score
            .saturating_sub(subtraction)
            .max(MIN_REPUTATION);
    }

    msg!(
        "Reputation updated: {} -> {} (delta: {})",
        old_score,
        agent.reputation_score,
        delta
    );

    Ok(())
}

/// Agent 相关错误
#[error_code]
pub enum AgentError {
    #[msg("Upgrade condition not met")]
    UpgradeConditionNotMet,
    #[msg("Unauthorized: signer is not protocol authority")]
    UnauthorizedAuthority,
}
