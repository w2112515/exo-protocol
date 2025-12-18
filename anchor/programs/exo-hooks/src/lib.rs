use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount};

pub mod state;

use state::*;

declare_id!("F5CzTZpDch5gUc5FgTPPRJ8mRKgrMVzJmcPfTzTugCeK");

/// Exo Protocol Transfer Hook 错误码
#[error_code]
pub enum ExoHookError {
    #[msg("Unauthorized: Only authority can perform this action")]
    Unauthorized,
    #[msg("Invalid fee configuration: total fees exceed 100%")]
    InvalidFeeConfig,
    #[msg("Arithmetic overflow in fee calculation")]
    ArithmeticOverflow,
    #[msg("Invalid mint account")]
    InvalidMint,
}

#[program]
pub mod exo_hooks {
    use super::*;

    /// 初始化 Transfer Hook 配置
    /// 
    /// # Arguments
    /// * `protocol_fee_bps` - 协议费率 (basis points, 500 = 5%)
    /// * `creator_royalty_bps` - 创作者版税 (basis points, 1000 = 10%)
    pub fn initialize_hook(
        ctx: Context<InitializeHook>,
        protocol_fee_bps: u16,
        creator_royalty_bps: u16,
    ) -> Result<()> {
        // 验证费率配置 (不能超过 100%)
        require!(
            (protocol_fee_bps as u32 + creator_royalty_bps as u32) <= 10000,
            ExoHookError::InvalidFeeConfig
        );

        let hook_config = &mut ctx.accounts.hook_config;
        hook_config.authority = ctx.accounts.authority.key();
        hook_config.mint = ctx.accounts.mint.key();
        hook_config.protocol_treasury = ctx.accounts.protocol_treasury.key();
        hook_config.protocol_fee_bps = protocol_fee_bps;
        hook_config.creator_royalty_bps = creator_royalty_bps;
        hook_config.bump = ctx.bumps.hook_config;

        msg!("Exo Hook initialized for mint: {}", ctx.accounts.mint.key());
        msg!("Protocol fee: {} bps, Creator royalty: {} bps", protocol_fee_bps, creator_royalty_bps);

        Ok(())
    }

    /// 初始化 ExtraAccountMetas (Transfer Hook Interface 要求)
    /// 
    /// 此指令创建存储额外账户元数据的 PDA，用于 Token-2022 Transfer Hook
    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetaList>,
    ) -> Result<()> {
        msg!("ExtraAccountMetaList initialized for mint: {}", ctx.accounts.mint.key());
        Ok(())
    }

    /// Transfer Hook 执行入口 (SPL Transfer Hook Interface)
    /// 
    /// 当 Token-2022 代币发生转账时，此函数被自动调用
    /// MVP 阶段: 记录转账信息，实际分账在 exo-core 的 complete_escrow 中处理
    /// 
    /// # Arguments
    /// * `amount` - 转账金额
    pub fn transfer_hook(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
        let hook_config = &ctx.accounts.hook_config;
        
        // 计算分账金额 (仅用于日志，实际分账在 exo-core)
        let protocol_fee = hook_config
            .calculate_protocol_fee(amount)
            .ok_or(ExoHookError::ArithmeticOverflow)?;
        let creator_royalty = hook_config
            .calculate_creator_royalty(amount)
            .ok_or(ExoHookError::ArithmeticOverflow)?;
        let executor_amount = hook_config
            .calculate_executor_amount(amount)
            .ok_or(ExoHookError::ArithmeticOverflow)?;

        msg!("=== Exo Transfer Hook Executed ===");
        msg!("Transfer amount: {} lamports", amount);
        msg!("Protocol fee ({}%): {} lamports", hook_config.protocol_fee_bps / 100, protocol_fee);
        msg!("Creator royalty ({}%): {} lamports", hook_config.creator_royalty_bps / 100, creator_royalty);
        msg!("Executor receives ({}%): {} lamports", 
            (10000 - hook_config.protocol_fee_bps - hook_config.creator_royalty_bps) / 100,
            executor_amount
        );

        Ok(())
    }

    /// Fallback 指令 (SPL Transfer Hook Interface 要求)
    /// 
    /// MVP 简化版: 记录调用日志，完整 Transfer Hook Interface 集成在 Phase 2
    pub fn fallback(ctx: Context<Fallback>) -> Result<()> {
        msg!("Exo Hook Fallback called for mint: {}", ctx.accounts.hook_config.mint);
        Ok(())
    }

    /// 更新 Hook 配置
    /// 
    /// 仅 authority 可以调用
    /// # Arguments
    /// * `new_protocol_fee_bps` - 新的协议费率
    /// * `new_creator_royalty_bps` - 新的创作者版税
    pub fn update_hook_config(
        ctx: Context<UpdateHookConfig>,
        new_protocol_fee_bps: u16,
        new_creator_royalty_bps: u16,
    ) -> Result<()> {
        require!(
            (new_protocol_fee_bps as u32 + new_creator_royalty_bps as u32) <= 10000,
            ExoHookError::InvalidFeeConfig
        );

        let hook_config = &mut ctx.accounts.hook_config;
        hook_config.protocol_fee_bps = new_protocol_fee_bps;
        hook_config.creator_royalty_bps = new_creator_royalty_bps;

        msg!("Hook config updated: protocol_fee={} bps, creator_royalty={} bps",
            new_protocol_fee_bps, new_creator_royalty_bps);

        Ok(())
    }
}

/// 初始化 Hook 配置账户
#[derive(Accounts)]
pub struct InitializeHook<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Token-2022 Mint 账户
    pub mint: InterfaceAccount<'info, Mint>,

    /// 协议费接收地址
    /// CHECK: 仅用于存储地址，不进行验证
    pub protocol_treasury: UncheckedAccount<'info>,

    /// Hook 配置 PDA
    #[account(
        init,
        payer = authority,
        space = HookConfig::LEN,
        seeds = [HOOK_CONFIG_SEED, mint.key().as_ref()],
        bump
    )]
    pub hook_config: Account<'info, HookConfig>,

    pub system_program: Program<'info, System>,
}

/// 初始化 ExtraAccountMetaList
#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Token-2022 Mint 账户
    pub mint: InterfaceAccount<'info, Mint>,

    /// ExtraAccountMetas PDA (由 SPL Transfer Hook Interface 定义)
    /// CHECK: 由 Transfer Hook Interface 验证
    #[account(
        init,
        payer = payer,
        space = ExtraAccountMetaList::LEN,
        seeds = [EXTRA_ACCOUNT_METAS_SEED, mint.key().as_ref()],
        bump
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

/// Transfer Hook 执行账户
#[derive(Accounts)]
pub struct TransferHook<'info> {
    /// 源 Token 账户
    pub source_token: InterfaceAccount<'info, TokenAccount>,

    /// Token Mint
    pub mint: InterfaceAccount<'info, Mint>,

    /// 目标 Token 账户
    pub destination_token: InterfaceAccount<'info, TokenAccount>,

    /// 源账户所有者
    /// CHECK: Transfer Hook 不验证所有者
    pub owner: UncheckedAccount<'info>,

    /// ExtraAccountMetas PDA
    /// CHECK: 由 Transfer Hook Interface 验证
    #[account(
        seeds = [EXTRA_ACCOUNT_METAS_SEED, mint.key().as_ref()],
        bump
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    /// Hook 配置
    #[account(
        seeds = [HOOK_CONFIG_SEED, mint.key().as_ref()],
        bump = hook_config.bump
    )]
    pub hook_config: Account<'info, HookConfig>,
}

/// 更新 Hook 配置
#[derive(Accounts)]
pub struct UpdateHookConfig<'info> {
    #[account(
        constraint = authority.key() == hook_config.authority @ ExoHookError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub hook_config: Account<'info, HookConfig>,
}

/// Fallback 指令账户 (MVP 简化版)
#[derive(Accounts)]
pub struct Fallback<'info> {
    /// Hook 配置
    pub hook_config: Account<'info, HookConfig>,
}
