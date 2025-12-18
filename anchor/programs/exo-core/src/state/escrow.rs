use anchor_lang::prelude::*;

/// PDA 种子
pub const PROTOCOL_CONFIG_SEED: &[u8] = b"protocol_config";
pub const ESCROW_SEED: &[u8] = b"escrow";

/// 默认协议费率 (5% = 500 basis points)
pub const DEFAULT_FEE_BASIS_POINTS: u16 = 500;

/// Escrow 状态枚举
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum EscrowStatus {
    #[default]
    Pending,      // 待执行
    InProgress,   // 执行中
    Completed,    // 已完成
    Cancelled,    // 已取消
    Disputed,     // 争议中 (Phase 2 预留)
}

/// 协议配置账户
/// PDA 种子: ["protocol_config"]
#[account]
pub struct ProtocolConfig {
    /// 协议管理员 (可更新信誉分)
    pub authority: Pubkey,
    /// 协议费率 (basis points, 500 = 5%)
    pub fee_basis_points: u16,
    /// 协议费接收地址
    pub treasury: Pubkey,
    /// PDA bump
    pub bump: u8,
}

impl ProtocolConfig {
    /// 账户空间大小
    /// 8 (discriminator) + 32 (authority) + 2 (fee_basis_points) + 32 (treasury) + 1 (bump)
    pub const LEN: usize = 8 + 32 + 2 + 32 + 1;
}

/// Escrow 托管账户
/// PDA 种子: ["escrow", buyer, skill_pda, nonce]
#[account]
pub struct EscrowAccount {
    /// 买家地址
    pub buyer: Pubkey,
    /// Skill PDA 地址
    pub skill: Pubkey,
    /// 执行 Agent 地址 (完成时设置)
    pub executor: Option<Pubkey>,
    /// 托管金额 (lamports)
    pub amount: u64,
    /// 托管状态
    pub status: EscrowStatus,
    /// 创建时间
    pub created_at: i64,
    /// 过期时间 (Phase 2 用于自动退款)
    pub expires_at: i64,
    /// 防重放 nonce
    pub nonce: u64,
    /// PDA bump
    pub bump: u8,
}

impl EscrowAccount {
    /// 账户空间大小
    /// 8 (discriminator) + 32 (buyer) + 32 (skill) + 1 + 32 (Option<Pubkey>)
    /// + 8 (amount) + 1 (status) + 8 (created_at) + 8 (expires_at) + 8 (nonce) + 1 (bump)
    pub const LEN: usize = 8 + 32 + 32 + 1 + 32 + 8 + 1 + 8 + 8 + 8 + 1;

    /// 默认有效期: 7天 (秒)
    pub const DEFAULT_EXPIRY_DURATION: i64 = 7 * 24 * 60 * 60;
}
