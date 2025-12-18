use anchor_lang::prelude::*;

/// Agent Tier 常量
pub const DEFAULT_REPUTATION: u16 = 5000;
pub const MAX_REPUTATION: u16 = 10000;
pub const MIN_REPUTATION: u16 = 0;

/// Tier 升级阈值
pub const TIER_1_EARNINGS_THRESHOLD: u64 = 1_000_000_000;  // 1 SOL
pub const TIER_2_EARNINGS_THRESHOLD: u64 = 10_000_000_000; // 10 SOL
pub const TIER_2_REPUTATION_THRESHOLD: u16 = 8000;

/// PDA 种子
pub const AGENT_SEED: &[u8] = b"agent";

/// Agent Identity 账户结构体
/// PDA 种子: ["agent", owner]
#[account]
pub struct AgentIdentity {
    /// 所有者钱包
    pub owner: Pubkey,
    /// Tier 等级: 0=Open, 1=Verified, 2=Premium
    pub tier: u8,
    /// 累计收入 (lamports)
    pub total_earnings: u64,
    /// 累计完成任务数
    pub total_tasks: u64,
    /// 信誉分 (0-10000, 默认5000)
    pub reputation_score: u16,
    /// 创建时间戳
    pub created_at: i64,
    /// PDA bump
    pub bump: u8,
}

impl AgentIdentity {
    /// 账户空间大小
    /// 8 (discriminator) + 32 (owner) + 1 (tier) + 8 (total_earnings)
    /// + 8 (total_tasks) + 2 (reputation_score) + 8 (created_at) + 1 (bump)
    pub const LEN: usize = 8 + 32 + 1 + 8 + 8 + 2 + 8 + 1;

    /// 检查是否可以升级到 Tier 1
    pub fn can_upgrade_to_tier_1(&self) -> bool {
        self.tier == 0 && self.total_earnings >= TIER_1_EARNINGS_THRESHOLD
    }

    /// 检查是否可以升级到 Tier 2
    pub fn can_upgrade_to_tier_2(&self) -> bool {
        self.tier == 1 
            && self.total_earnings >= TIER_2_EARNINGS_THRESHOLD
            && self.reputation_score >= TIER_2_REPUTATION_THRESHOLD
    }
}
