/**
 * @exo/sdk - PDA Utilities
 *
 * Program Derived Address (PDA) derivation functions for Exo Protocol accounts
 *
 * @packageDocumentation
 */

import { PublicKey } from '@solana/web3.js';
import { SEEDS, EXO_CORE_PROGRAM_ID } from './constants';

// ============================================================================
// PDA Derivation Types
// ============================================================================

/**
 * PDA 推导结果
 */
export interface PdaResult {
    /** PDA 公钥 */
    publicKey: PublicKey;
    /** Bump seed */
    bump: number;
}

// ============================================================================
// Skill PDA
// ============================================================================

/**
 * 推导 Skill PDA 地址
 *
 * @remarks
 * PDA 种子: ["skill", authority, name_hash]
 *
 * @param authority - Skill 创作者地址
 * @param nameHash - Skill 名称哈希 (32 bytes)
 * @param programId - 程序 ID (默认 EXO_CORE_PROGRAM_ID)
 * @returns PDA 和 bump seed
 *
 * @example
 * ```typescript
 * import { deriveSkillPda } from '@exo/sdk';
 * import { createHash } from 'crypto';
 *
 * const nameHash = createHash('sha256').update('my-skill').digest();
 * const { publicKey, bump } = deriveSkillPda(authority, nameHash);
 * ```
 */
export function deriveSkillPda(
    authority: PublicKey,
    nameHash: Uint8Array,
    programId: PublicKey = EXO_CORE_PROGRAM_ID
): PdaResult {
    if (nameHash.length !== 32) {
        throw new Error('nameHash must be exactly 32 bytes');
    }

    const [publicKey, bump] = PublicKey.findProgramAddressSync(
        [SEEDS.SKILL, authority.toBuffer(), Buffer.from(nameHash)],
        programId
    );

    return { publicKey, bump };
}

/**
 * 从 Skill 名称生成哈希并推导 PDA
 *
 * @remarks
 * 便捷函数，内部使用 SHA-256 哈希
 *
 * @param authority - Skill 创作者地址
 * @param skillName - Skill 名称 (字符串)
 * @param programId - 程序 ID
 * @returns PDA 和 bump seed
 */
export function deriveSkillPdaFromName(
    authority: PublicKey,
    skillName: string,
    programId: PublicKey = EXO_CORE_PROGRAM_ID
): PdaResult {
    // 使用简单的哈希方法 (Browser 兼容)
    const nameHash = hashString(skillName);
    return deriveSkillPda(authority, nameHash, programId);
}

// ============================================================================
// Agent PDA
// ============================================================================

/**
 * 推导 Agent Identity PDA 地址
 *
 * @remarks
 * PDA 种子: ["agent", owner]
 *
 * @param owner - Agent 所有者钱包地址
 * @param programId - 程序 ID (默认 EXO_CORE_PROGRAM_ID)
 * @returns PDA 和 bump seed
 *
 * @example
 * ```typescript
 * import { deriveAgentPda } from '@exo/sdk';
 *
 * const { publicKey } = deriveAgentPda(walletPublicKey);
 * console.log('Agent PDA:', publicKey.toBase58());
 * ```
 */
export function deriveAgentPda(
    owner: PublicKey,
    programId: PublicKey = EXO_CORE_PROGRAM_ID
): PdaResult {
    const [publicKey, bump] = PublicKey.findProgramAddressSync(
        [SEEDS.AGENT, owner.toBuffer()],
        programId
    );

    return { publicKey, bump };
}

// ============================================================================
// Escrow PDA
// ============================================================================

/**
 * 推导 Escrow PDA 地址
 *
 * @remarks
 * PDA 种子: ["escrow", buyer, skill_pda, nonce]
 *
 * @param buyer - 买家钱包地址
 * @param skillPda - Skill PDA 地址
 * @param nonce - 防重放随机数 (8 bytes LE)
 * @param programId - 程序 ID (默认 EXO_CORE_PROGRAM_ID)
 * @returns PDA 和 bump seed
 *
 * @example
 * ```typescript
 * import { deriveEscrowPda, deriveSkillPda } from '@exo/sdk';
 *
 * const { publicKey: skillPda } = deriveSkillPda(authority, nameHash);
 * const nonce = BigInt(Date.now());
 * const { publicKey: escrowPda } = deriveEscrowPda(buyer, skillPda, nonce);
 * ```
 */
export function deriveEscrowPda(
    buyer: PublicKey,
    skillPda: PublicKey,
    nonce: bigint,
    programId: PublicKey = EXO_CORE_PROGRAM_ID
): PdaResult {
    const nonceBuffer = Buffer.alloc(8);
    nonceBuffer.writeBigUInt64LE(nonce);

    const [publicKey, bump] = PublicKey.findProgramAddressSync(
        [SEEDS.ESCROW, buyer.toBuffer(), skillPda.toBuffer(), nonceBuffer],
        programId
    );

    return { publicKey, bump };
}

// ============================================================================
// Protocol Config PDA
// ============================================================================

/**
 * 推导 Protocol Config PDA 地址
 *
 * @remarks
 * PDA 种子: ["protocol_config"]
 *
 * @param programId - 程序 ID (默认 EXO_CORE_PROGRAM_ID)
 * @returns PDA 和 bump seed
 *
 * @example
 * ```typescript
 * import { deriveConfigPda } from '@exo/sdk';
 *
 * const { publicKey } = deriveConfigPda();
 * console.log('Protocol Config PDA:', publicKey.toBase58());
 * ```
 */
export function deriveConfigPda(
    programId: PublicKey = EXO_CORE_PROGRAM_ID
): PdaResult {
    const [publicKey, bump] = PublicKey.findProgramAddressSync(
        [SEEDS.PROTOCOL_CONFIG],
        programId
    );

    return { publicKey, bump };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 简单字符串哈希 (Browser 兼容)
 *
 * @remarks
 * 生成 32 字节哈希用于 PDA 推导
 * 注意：这不是加密安全的哈希，仅用于 PDA 种子
 *
 * @param input - 输入字符串
 * @returns 32 字节 Uint8Array
 */
export function hashString(input: string): Uint8Array {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);

    // 使用简单的哈希算法 (djb2 变体 + 填充到 32 字节)
    const hash = new Uint8Array(32);
    let h1 = 5381;
    let h2 = 52711;

    for (let i = 0; i < data.length; i++) {
        const byte = data[i] ?? 0;
        h1 = (h1 * 33) ^ byte;
        h2 = (h2 * 33) ^ byte;
    }

    // 填充 32 字节
    const view = new DataView(hash.buffer);
    view.setUint32(0, h1 >>> 0, true);
    view.setUint32(4, h2 >>> 0, true);
    view.setUint32(8, (h1 + h2) >>> 0, true);
    view.setUint32(12, (h1 ^ h2) >>> 0, true);

    // 重复填充剩余字节
    for (let i = 16; i < 32; i += 4) {
        const combo = (h1 * (i + 1)) ^ (h2 * (i + 2));
        view.setUint32(i, combo >>> 0, true);
    }

    return hash;
}

/**
 * 验证 PDA 是否正确推导
 *
 * @param pda - 待验证的 PDA 地址
 * @param seeds - 种子数组
 * @param programId - 程序 ID
 * @returns 是否匹配
 */
export function verifyPda(
    pda: PublicKey,
    seeds: (Buffer | Uint8Array)[],
    programId: PublicKey = EXO_CORE_PROGRAM_ID
): boolean {
    try {
        const [derivedPda] = PublicKey.findProgramAddressSync(seeds, programId);
        return derivedPda.equals(pda);
    } catch {
        return false;
    }
}
