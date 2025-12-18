use anchor_lang::prelude::*;

/// PDA 种子
pub const HOOK_CONFIG_SEED: &[u8] = b"hook_config";
pub const EXTRA_ACCOUNT_METAS_SEED: &[u8] = b"extra-account-metas";

/// 默认协议费率 (5% = 500 basis points)
pub const DEFAULT_PROTOCOL_FEE_BPS: u16 = 500;
/// 默认创作者版税 (10% = 1000 basis points)
pub const DEFAULT_CREATOR_ROYALTY_BPS: u16 = 1000;
/// Basis points 分母 (10000 = 100%)
pub const BASIS_POINTS_DIVISOR: u64 = 10000;

/// Transfer Hook 配置账户
/// PDA 种子: ["hook_config", mint]
#[account]
pub struct HookConfig {
    /// 配置管理员 (可更新费率)
    pub authority: Pubkey,
    /// 关联的 Token Mint 地址
    pub mint: Pubkey,
    /// 协议费接收地址
    pub protocol_treasury: Pubkey,
    /// 协议费率 (basis points, 500 = 5%)
    pub protocol_fee_bps: u16,
    /// 创作者版税 (basis points, 1000 = 10%)
    pub creator_royalty_bps: u16,
    /// PDA bump
    pub bump: u8,
}

impl HookConfig {
    /// 账户空间大小
    /// 8 (discriminator) + 32 (authority) + 32 (mint) + 32 (treasury) 
    /// + 2 (protocol_fee_bps) + 2 (creator_royalty_bps) + 1 (bump)
    pub const LEN: usize = 8 + 32 + 32 + 32 + 2 + 2 + 1;

    /// 计算协议费
    pub fn calculate_protocol_fee(&self, amount: u64) -> Option<u64> {
        amount
            .checked_mul(self.protocol_fee_bps as u64)?
            .checked_div(BASIS_POINTS_DIVISOR)
    }

    /// 计算创作者版税
    pub fn calculate_creator_royalty(&self, amount: u64) -> Option<u64> {
        amount
            .checked_mul(self.creator_royalty_bps as u64)?
            .checked_div(BASIS_POINTS_DIVISOR)
    }

    /// 计算执行者收入 (总额 - 协议费 - 版税)
    pub fn calculate_executor_amount(&self, amount: u64) -> Option<u64> {
        let protocol_fee = self.calculate_protocol_fee(amount)?;
        let creator_royalty = self.calculate_creator_royalty(amount)?;
        amount.checked_sub(protocol_fee)?.checked_sub(creator_royalty)
    }
}

/// ExtraAccountMetas 账户 (用于 Transfer Hook Interface)
/// PDA 种子: ["extra-account-metas", mint]
/// 此账户存储 Transfer Hook 执行时需要的额外账户信息
#[account]
pub struct ExtraAccountMetaList {
    /// 数据长度 (由 SPL Transfer Hook Interface 管理)
    pub data: Vec<u8>,
}

impl ExtraAccountMetaList {
    /// 初始账户空间 (discriminator + 预留空间)
    /// Transfer Hook 需要约 128 bytes 存储 ExtraAccountMeta
    pub const LEN: usize = 8 + 128;
}
