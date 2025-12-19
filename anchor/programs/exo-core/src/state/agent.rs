use anchor_lang::prelude::*;

/// Agent Tier 常量
pub const DEFAULT_REPUTATION: u16 = 5000;
pub const MAX_REPUTATION: u16 = 10000;
pub const MIN_REPUTATION: u16 = 0;

/// 质押常量
pub const MIN_STAKE_AMOUNT: u64 = 100_000_000;  // 0.1 SOL 最低质押
pub const SLASH_PERCENTAGE: u8 = 50;             // 50% 罚没比例
pub const MAX_SLASH_COUNT: u8 = 3;               // 超过 3 次禁止接单

/// Tier 升级阈值
pub const TIER_1_EARNINGS_THRESHOLD: u64 = 1_000_000_000;  // 1 SOL
pub const TIER_2_EARNINGS_THRESHOLD: u64 = 10_000_000_000; // 10 SOL
pub const TIER_2_REPUTATION_THRESHOLD: u16 = 8000;

/// PDA 种子
pub const AGENT_SEED: &[u8] = b"agent";

/// Agent Identity 账户结构体 (V2 - 含质押)
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
    // === V2 新增字段 ===
    /// 当前质押金额 (lamports)
    pub staked_amount: u64,
    /// 被罚次数
    pub slashed_count: u8,
    /// 是否激活 (需质押后激活)
    pub is_active: bool,
}

impl AgentIdentity {
    /// 账户空间大小 (V2)
    /// 原 68 bytes + 8 (staked) + 1 (slashed) + 1 (active) = 78 bytes
    pub const LEN: usize = 8 + 32 + 1 + 8 + 8 + 2 + 8 + 1 + 8 + 1 + 1;

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

    /// 检查是否可以接单
    pub fn can_accept_order(&self) -> bool {
        self.is_active 
            && self.staked_amount >= MIN_STAKE_AMOUNT
            && self.slashed_count < MAX_SLASH_COUNT
    }

    /// 计算罚没金额
    pub fn calculate_slash_amount(&self) -> u64 {
        self.staked_amount * (SLASH_PERCENTAGE as u64) / 100
    }
}
