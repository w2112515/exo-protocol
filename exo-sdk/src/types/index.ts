/**
 * @exo/sdk - Type Definitions
 *
 * TypeScript types mapped from Anchor State definitions
 * Source: anchor/programs/exo-core/src/state/*.rs
 *
 * @packageDocumentation
 */

import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

// ============================================================================
// Skill Types (from skill.rs)
// ============================================================================

/**
 * Skill 审计状态枚举
 *
 * @remarks
 * 映射自 Rust: `enum AuditStatus { Unverified, Optimistic, Audited }`
 */
export enum AuditStatus {
    /** 未验证 - 任何人可用 */
    Unverified = 0,
    /** 乐观上架 - 质押保证金 */
    Optimistic = 1,
    /** 通过审计 - Verifier 签名 */
    Audited = 2,
}

/**
 * Skill 账户结构体
 *
 * @remarks
 * PDA 种子: ["skill", authority, name_hash]
 * 账户大小: 108 bytes (含 8 byte discriminator)
 */
export interface SkillAccount {
    /** 创作者地址 */
    authority: PublicKey;
    /** SKILL.md 内容哈希 (Arweave TxID 或本地哈希) */
    contentHash: Uint8Array; // [u8; 32]
    /** 单次调用价格 (lamports) */
    priceLamports: BN;
    /** 累计调用次数 */
    totalCalls: BN;
    /** 累计收入 (lamports) */
    totalRevenue: BN;
    /** 版本号 */
    version: number;
    /** 审计状态 */
    auditStatus: AuditStatus;
    /** 创建时间 (Unix timestamp) */
    createdAt: BN;
    /** PDA bump seed */
    bump: number;
    /** 是否已下架 */
    isDeprecated: boolean;
}

// ============================================================================
// Agent Types (from agent.rs)
// ============================================================================

/**
 * Agent Tier 等级枚举
 *
 * @remarks
 * Tier 0: Open - 开放等级
 * Tier 1: Verified - 累计收入 >= 1 SOL
 * Tier 2: Premium - 累计收入 >= 10 SOL && 信誉分 >= 8000
 */
export enum AgentTier {
    /** 开放等级 */
    Open = 0,
    /** 验证等级 - 累计收入 >= 1 SOL */
    Verified = 1,
    /** 高级等级 - 累计收入 >= 10 SOL && 信誉分 >= 8000 */
    Premium = 2,
}

/**
 * Agent Identity 账户结构体
 *
 * @remarks
 * PDA 种子: ["agent", owner]
 * 账户大小: 68 bytes (含 8 byte discriminator)
 */
export interface AgentIdentity {
    /** 所有者钱包 */
    owner: PublicKey;
    /** Tier 等级: 0=Open, 1=Verified, 2=Premium */
    tier: AgentTier;
    /** 累计收入 (lamports) */
    totalEarnings: BN;
    /** 累计完成任务数 */
    totalTasks: BN;
    /** 信誉分 (0-10000, 默认 5000) */
    reputationScore: number;
    /** 创建时间戳 */
    createdAt: BN;
    /** PDA bump */
    bump: number;
}

// ============================================================================
// Escrow Types (from escrow.rs)
// ============================================================================

/**
 * Escrow 状态枚举
 *
 * @remarks
 * 映射自 Rust: `enum EscrowStatus { Pending, InProgress, Completed, Cancelled, Disputed }`
 */
export enum EscrowStatus {
    /** 待执行 */
    Pending = 0,
    /** 执行中 */
    InProgress = 1,
    /** 已完成 */
    Completed = 2,
    /** 已取消 */
    Cancelled = 3,
    /** 争议中 (Phase 2 预留) */
    Disputed = 4,
}

/**
 * 协议配置账户
 *
 * @remarks
 * PDA 种子: ["protocol_config"]
 * 账户大小: 75 bytes (含 8 byte discriminator)
 */
export interface ProtocolConfig {
    /** 协议管理员 (可更新信誉分) */
    authority: PublicKey;
    /** 协议费率 (basis points, 500 = 5%) */
    feeBasisPoints: number;
    /** 协议费接收地址 */
    treasury: PublicKey;
    /** PDA bump */
    bump: number;
}

/**
 * Escrow 托管账户
 *
 * @remarks
 * PDA 种子: ["escrow", buyer, skill_pda, nonce]
 * 账户大小: 139 bytes (含 8 byte discriminator)
 */
export interface EscrowAccount {
    /** 买家地址 */
    buyer: PublicKey;
    /** Skill PDA 地址 */
    skill: PublicKey;
    /** 执行 Agent 地址 (完成时设置) */
    executor: PublicKey | null;
    /** 托管金额 (lamports) */
    amount: BN;
    /** 托管状态 */
    status: EscrowStatus;
    /** 创建时间 */
    createdAt: BN;
    /** 过期时间 (Phase 2 用于自动退款) */
    expiresAt: BN;
    /** 防重放 nonce */
    nonce: BN;
    /** PDA bump */
    bump: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * 账户空间常量 (bytes)
 *
 * @remarks
 * 包含 8 byte discriminator
 */
export const ACCOUNT_SIZE = {
    SKILL: 108,
    AGENT: 68,
    ESCROW: 139,
    PROTOCOL_CONFIG: 75,
} as const;

/**
 * 账户解析结果类型
 */
export interface ParsedAccount<T> {
    /** 账户公钥 */
    publicKey: PublicKey;
    /** 账户数据 */
    account: T;
}
