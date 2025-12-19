use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT");

#[program]
pub mod exo_core {
    use super::*;

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
        instructions::register_skill(ctx, name_hash, content_hash, price_lamports)
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
        instructions::update_skill(ctx, new_content_hash, new_price)
    }

    /// 下架 Skill
    pub fn deprecate_skill(ctx: Context<DeprecateSkill>) -> Result<()> {
        instructions::deprecate_skill(ctx)
    }

    /// 创建 Agent 身份
    /// 
    /// 任何人可以调用，为自己创建一个 Agent 身份
    pub fn create_agent(ctx: Context<CreateAgent>) -> Result<()> {
        instructions::create_agent(ctx)
    }

    /// 升级 Agent Tier
    /// 
    /// 仅 Agent owner 可以调用，自动检查升级条件
    pub fn upgrade_tier(ctx: Context<UpgradeTier>) -> Result<()> {
        instructions::upgrade_tier(ctx)
    }

    /// 更新 Agent 信誉分
    /// 
    /// 仅协议 authority 可以调用
    /// # Arguments
    /// * `delta` - 信誉分变化值 (可正可负)
    pub fn update_reputation(ctx: Context<UpdateReputation>, delta: i16) -> Result<()> {
        instructions::update_reputation(ctx, delta)
    }

    /// 初始化协议配置
    /// 
    /// 仅执行一次，设置协议费率和 treasury 地址
    /// # Arguments
    /// * `fee_basis_points` - 协议费率 (basis points, 500 = 5%)
    pub fn init_protocol_config(
        ctx: Context<InitProtocolConfig>,
        fee_basis_points: u16,
    ) -> Result<()> {
        instructions::init_protocol_config(ctx, fee_basis_points)
    }

    /// 创建 Escrow 托管
    /// 
    /// 买家支付 skill.price_lamports 到 Escrow PDA
    /// # Arguments
    /// * `nonce` - 防重放 nonce
    pub fn create_escrow(ctx: Context<CreateEscrow>, nonce: u64) -> Result<()> {
        instructions::create_escrow(ctx, nonce)
    }

    /// 完成 Escrow，触发分账
    /// 
    /// 分账比例: 5% 协议费 + 10% Skill 版税 + 85% 执行者
    pub fn complete_escrow(ctx: Context<CompleteEscrow>) -> Result<()> {
        instructions::complete_escrow(ctx)
    }

    /// 取消 Escrow，退款给 buyer
    /// 
    /// 仅 Pending 状态可取消
    pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
        instructions::cancel_escrow(ctx)
    }

    /// 执行者提交结果哈希
    /// 
    /// 将状态从 Pending/InProgress -> Completed (进入挑战窗口)
    pub fn commit_result(ctx: Context<CommitResult>, result_hash: [u8; 32]) -> Result<()> {
        instructions::commit_result(ctx, result_hash)
    }

    /// 挑战已提交的结果
    /// 
    /// 条件: 状态为 Completed 且在挑战窗口内 (100 slots ≈ 40s)
    pub fn challenge(ctx: Context<ChallengeEscrow>, proof: [u8; 64]) -> Result<()> {
        instructions::challenge(ctx, proof)
    }

    /// 解决挑战 (MVP: 管理员裁决)
    /// 
    /// challenger_wins: true = Slash 执行者并退款, false = 恢复 Completed 状态
    pub fn resolve_challenge(ctx: Context<ResolveChallenge>, challenger_wins: bool) -> Result<()> {
        instructions::resolve_challenge(ctx, challenger_wins)
    }
}
