use anchor_lang::prelude::*;
use crate::state::{SkillAccount, AuditStatus};

/// 注册 Skill 指令的账户上下文
#[derive(Accounts)]
#[instruction(name_hash: [u8; 32], content_hash: [u8; 32], price_lamports: u64)]
pub struct RegisterSkill<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = SkillAccount::LEN,
        seeds = [b"skill", authority.key().as_ref(), name_hash.as_ref()],
        bump
    )]
    pub skill_account: Account<'info, SkillAccount>,

    pub system_program: Program<'info, System>,
}

/// 更新 Skill 指令的账户上下文
#[derive(Accounts)]
pub struct UpdateSkill<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority,
        constraint = !skill_account.is_deprecated @ SkillError::SkillDeprecated
    )]
    pub skill_account: Account<'info, SkillAccount>,
}

/// 下架 Skill 指令的账户上下文
#[derive(Accounts)]
pub struct DeprecateSkill<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority,
        constraint = !skill_account.is_deprecated @ SkillError::SkillAlreadyDeprecated
    )]
    pub skill_account: Account<'info, SkillAccount>,
}

/// 注册新的 Skill
/// 
/// # Arguments
/// * `name_hash` - Skill 名称哈希 (用于 PDA 推导)
/// * `content_hash` - SKILL.md 内容哈希
/// * `price_lamports` - 单次调用价格
pub fn register_skill(
    ctx: Context<RegisterSkill>,
    name_hash: [u8; 32],
    content_hash: [u8; 32],
    price_lamports: u64,
) -> Result<()> {
    let skill_account = &mut ctx.accounts.skill_account;
    let clock = Clock::get()?;

    skill_account.authority = ctx.accounts.authority.key();
    skill_account.content_hash = content_hash;
    skill_account.price_lamports = price_lamports;
    skill_account.total_calls = 0;
    skill_account.total_revenue = 0;
    skill_account.version = 1;
    skill_account.audit_status = AuditStatus::Unverified;
    skill_account.created_at = clock.unix_timestamp;
    skill_account.bump = ctx.bumps.skill_account;
    skill_account.is_deprecated = false;

    msg!("Skill registered: {:?}", skill_account.authority);
    msg!("Content hash: {:?}", content_hash);
    msg!("Price: {} lamports", price_lamports);

    Ok(())
}

/// 更新 Skill 信息
/// 
/// # Arguments
/// * `new_content_hash` - 新的内容哈希
/// * `new_price` - 新的价格
pub fn update_skill(
    ctx: Context<UpdateSkill>,
    new_content_hash: [u8; 32],
    new_price: u64,
) -> Result<()> {
    let skill_account = &mut ctx.accounts.skill_account;

    skill_account.content_hash = new_content_hash;
    skill_account.price_lamports = new_price;
    skill_account.version = skill_account.version.checked_add(1).ok_or(SkillError::VersionOverflow)?;

    msg!("Skill updated to version: {}", skill_account.version);

    Ok(())
}

/// 下架 Skill
pub fn deprecate_skill(ctx: Context<DeprecateSkill>) -> Result<()> {
    let skill_account = &mut ctx.accounts.skill_account;

    skill_account.is_deprecated = true;

    msg!("Skill deprecated: {:?}", skill_account.authority);

    Ok(())
}

/// Skill 相关错误
#[error_code]
pub enum SkillError {
    #[msg("Skill has been deprecated")]
    SkillDeprecated,
    #[msg("Skill is already deprecated")]
    SkillAlreadyDeprecated,
    #[msg("Version number overflow")]
    VersionOverflow,
}
