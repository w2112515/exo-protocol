use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{
    AgentIdentity, 
    AGENT_SEED, 
    MIN_STAKE_AMOUNT,
    MAX_SLASH_COUNT,
};

/// Agent 质押金库 PDA 种子
pub const AGENT_VAULT_SEED: &[u8] = b"agent_vault";

/// 质押 Agent 的账户上下文
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
    /// CHECK: 这是一个 PDA 地址，用于存储质押的 SOL
    #[account(
        mut,
        seeds = [AGENT_VAULT_SEED, agent.key().as_ref()],
        bump
    )]
    pub agent_vault: SystemAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

/// 取消质押的账户上下文
#[derive(Accounts)]
pub struct UnstakeAgent<'info> {
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
    /// CHECK: 这是一个 PDA 地址，用于存储质押的 SOL
    #[account(
        mut,
        seeds = [AGENT_VAULT_SEED, agent.key().as_ref()],
        bump
    )]
    pub agent_vault: SystemAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

/// Slash Agent 的账户上下文 (由 resolve_challenge 内部调用)
#[derive(Accounts)]
pub struct SlashAgent<'info> {
    #[account(
        mut,
        seeds = [AGENT_SEED, agent.owner.as_ref()],
        bump = agent.bump
    )]
    pub agent: Account<'info, AgentIdentity>,
    
    /// Agent 质押金库 PDA
    /// CHECK: 这是一个 PDA 地址
    #[account(
        mut,
        seeds = [AGENT_VAULT_SEED, agent.key().as_ref()],
        bump
    )]
    pub agent_vault: SystemAccount<'info>,
    
    /// 挑战者，接收部分 slash 奖励
    /// CHECK: 挑战者钱包地址
    #[account(mut)]
    pub challenger: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

/// 质押 SOL 激活 Agent
/// 
/// 最低质押 0.1 SOL，质押后 Agent 可以接单
pub fn stake_agent(ctx: Context<StakeAgent>, amount: u64) -> Result<()> {
    require!(amount >= MIN_STAKE_AMOUNT, StakingError::InsufficientStake);
    
    let agent = &mut ctx.accounts.agent;
    
    // 检查是否被禁止
    require!(
        agent.slashed_count < MAX_SLASH_COUNT,
        StakingError::AgentBanned
    );
    
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
    msg!("Agent is now active: {}", agent.is_active);
    
    Ok(())
}

/// 取消质押 (需无活跃订单)
/// 
/// 若剩余质押低于最低要求，Agent 将被停用
pub fn unstake_agent(ctx: Context<UnstakeAgent>, amount: u64) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    
    require!(agent.staked_amount >= amount, StakingError::InsufficientBalance);
    
    // 计算剩余质押
    let remaining = agent.staked_amount.checked_sub(amount)
        .ok_or(StakingError::Overflow)?;
    
    // 构建 vault PDA 签名种子
    let agent_key = agent.key();
    let vault_bump = ctx.bumps.agent_vault;
    let vault_seeds = &[
        AGENT_VAULT_SEED,
        agent_key.as_ref(),
        &[vault_bump],
    ];
    let signer_seeds = &[&vault_seeds[..]];
    
    // 从金库转出到 owner
    // 使用 lamports 直接转账 (PDA 签名)
    let vault_info = ctx.accounts.agent_vault.to_account_info();
    let owner_info = ctx.accounts.owner.to_account_info();
    
    **vault_info.try_borrow_mut_lamports()? -= amount;
    **owner_info.try_borrow_mut_lamports()? += amount;
    
    // 更新 Agent 状态
    agent.staked_amount = remaining;
    
    // 质押不足则停用
    if remaining < MIN_STAKE_AMOUNT {
        agent.is_active = false;
        msg!("Agent deactivated due to insufficient stake");
    }
    
    msg!("Agent unstaked {} lamports, remaining: {}", amount, agent.staked_amount);
    
    Ok(())
}

/// Slash Agent - 罚没质押
/// 
/// 由 resolve_challenge 调用，挑战成功时执行:
/// - 罚没 50% 质押
/// - 增加 slashed_count
/// - 降低信誉分
/// - 质押不足或被罚 3 次则停用
/// 
/// 返回: 罚没的金额
pub fn slash_agent(ctx: Context<SlashAgent>) -> Result<u64> {
    let agent = &mut ctx.accounts.agent;
    
    let slash_amount = agent.calculate_slash_amount();
    
    // 更新 Agent 状态
    agent.staked_amount = agent.staked_amount.checked_sub(slash_amount)
        .ok_or(StakingError::Overflow)?;
    agent.slashed_count = agent.slashed_count.saturating_add(1);
    agent.reputation_score = agent.reputation_score.saturating_sub(1000); // -10%
    
    // 从金库转出 slash 金额
    let vault_info = ctx.accounts.agent_vault.to_account_info();
    let challenger_info = ctx.accounts.challenger.to_account_info();
    
    // 50% 给挑战者作为奖励
    let challenger_reward = slash_amount / 2;
    
    **vault_info.try_borrow_mut_lamports()? -= challenger_reward;
    **challenger_info.try_borrow_mut_lamports()? += challenger_reward;
    
    // 质押不足或被罚 3 次则停用
    if agent.staked_amount < MIN_STAKE_AMOUNT || agent.slashed_count >= MAX_SLASH_COUNT {
        agent.is_active = false;
        msg!("Agent deactivated: staked={}, slashed_count={}", 
            agent.staked_amount, agent.slashed_count);
    }
    
    msg!("Agent slashed {} lamports, challenger reward: {}", slash_amount, challenger_reward);
    msg!("Agent remaining stake: {}, slashed_count: {}", agent.staked_amount, agent.slashed_count);
    
    Ok(slash_amount)
}

/// Staking 相关错误
#[error_code]
pub enum StakingError {
    #[msg("Insufficient stake amount, minimum 0.1 SOL")]
    InsufficientStake,
    #[msg("Insufficient staked balance")]
    InsufficientBalance,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Agent is banned due to too many slashes")]
    AgentBanned,
}
