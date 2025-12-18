/**
 * @exo/sdk - Constants
 *
 * Program IDs and protocol constants mapped from Anchor definitions
 * Source: anchor/programs/exo-core/src/state/*.rs
 *
 * @packageDocumentation
 */

import { PublicKey } from '@solana/web3.js';

// ============================================================================
// Program IDs
// ============================================================================

/**
 * Exo Core Program ID (占位，devnet 部署后更新)
 *
 * @remarks
 * TODO: 部署到 devnet 后替换为实际 Program ID
 */
export const EXO_CORE_PROGRAM_ID = new PublicKey(
    'CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT' // Deployed on Devnet
);

/**
 * Exo Transfer Hook Program ID (占位，devnet 部署后更新)
 *
 * @remarks
 * TODO: 部署到 devnet 后替换为实际 Program ID
 */
export const EXO_HOOK_PROGRAM_ID = new PublicKey(
    'F5CzTZpDch5gUc5FgTPPRJ8mRKgrMVzJmcPfTzTugCeK' // Deployed on Devnet
);

// ============================================================================
// PDA Seeds
// ============================================================================

/**
 * PDA 种子常量
 */
export const SEEDS = {
    /** Skill PDA 种子: ["skill", authority, name_hash] */
    SKILL: Buffer.from('skill'),
    /** Agent PDA 种子: ["agent", owner] */
    AGENT: Buffer.from('agent'),
    /** Escrow PDA 种子: ["escrow", buyer, skill_pda, nonce] */
    ESCROW: Buffer.from('escrow'),
    /** Protocol Config PDA 种子: ["protocol_config"] */
    PROTOCOL_CONFIG: Buffer.from('protocol_config'),
} as const;

// ============================================================================
// Agent Constants (from agent.rs)
// ============================================================================

/**
 * Agent 信誉分常量
 */
export const REPUTATION = {
    /** 默认信誉分 */
    DEFAULT: 5000,
    /** 最大信誉分 */
    MAX: 10000,
    /** 最小信誉分 */
    MIN: 0,
} as const;

/**
 * Agent Tier 升级阈值
 */
export const TIER_THRESHOLDS = {
    /** Tier 1 收入阈值: 1 SOL (lamports) */
    TIER_1_EARNINGS: BigInt(1_000_000_000),
    /** Tier 2 收入阈值: 10 SOL (lamports) */
    TIER_2_EARNINGS: BigInt(10_000_000_000),
    /** Tier 2 信誉分阈值 */
    TIER_2_REPUTATION: 8000,
} as const;

// ============================================================================
// Escrow Constants (from escrow.rs)
// ============================================================================

/**
 * Escrow 协议配置常量
 */
export const ESCROW_CONFIG = {
    /** 默认协议费率 (basis points, 500 = 5%) */
    DEFAULT_FEE_BASIS_POINTS: 500,
    /** 费率计算基数 */
    BASIS_POINTS_DIVISOR: 10000,
    /** 默认有效期: 7天 (秒) */
    DEFAULT_EXPIRY_DURATION: 7 * 24 * 60 * 60,
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 计算协议费用
 *
 * @param amount - 托管金额 (lamports)
 * @param feeBasisPoints - 费率 (basis points)
 * @returns 协议费用 (lamports)
 */
export function calculateProtocolFee(
    amount: bigint,
    feeBasisPoints: number = ESCROW_CONFIG.DEFAULT_FEE_BASIS_POINTS
): bigint {
    return (amount * BigInt(feeBasisPoints)) / BigInt(ESCROW_CONFIG.BASIS_POINTS_DIVISOR);
}
