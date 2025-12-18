use anchor_lang::prelude::*;

/// 审计状态枚举
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum AuditStatus {
    #[default]
    Unverified,     // 未验证 (任何人可用)
    Optimistic,     // 乐观上架 (质押保证金)
    Audited,        // 通过审计 (Verifier签名)
}

/// Skill 账户结构体
/// PDA 种子: ["skill", authority, name_hash]
#[account]
pub struct SkillAccount {
    /// 创作者地址
    pub authority: Pubkey,
    /// SKILL.md 内容哈希 (Arweave TxID 或本地哈希)
    pub content_hash: [u8; 32],
    /// 单次调用价格 (lamports)
    pub price_lamports: u64,
    /// 累计调用次数
    pub total_calls: u64,
    /// 累计收入 (lamports)
    pub total_revenue: u64,
    /// 版本号
    pub version: u8,
    /// 审计状态
    pub audit_status: AuditStatus,
    /// 创建时间 (Unix timestamp)
    pub created_at: i64,
    /// PDA bump seed
    pub bump: u8,
    /// 是否已下架
    pub is_deprecated: bool,
}

impl SkillAccount {
    /// 账户空间大小
    /// 8 (discriminator) + 32 (authority) + 32 (content_hash) + 8 (price) 
    /// + 8 (calls) + 8 (revenue) + 1 (version) + 1 (audit_status) 
    /// + 8 (created_at) + 1 (bump) + 1 (is_deprecated)
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 8 + 1 + 1 + 8 + 1 + 1;
}
