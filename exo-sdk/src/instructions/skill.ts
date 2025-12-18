/**
 * @exo/sdk - Skill Instructions
 *
 * Instruction builders for Skill registry operations
 *
 * @packageDocumentation
 */

import {
    PublicKey,
    TransactionInstruction,
    SystemProgram,
} from '@solana/web3.js';
import BN from 'bn.js';
import { EXO_CORE_PROGRAM_ID } from '../constants';
import { deriveSkillPda } from '../pda';

// ============================================================================
// Instruction Discriminators
// ============================================================================

/**
 * Anchor 指令 discriminator
 *
 * @remarks
 * SHA256("global:register_skill")[0..8]
 * TODO: 部署后从 IDL 中提取实际 discriminator
 */
const INSTRUCTION_DISCRIMINATORS = {
    REGISTER_SKILL: Buffer.from([0xca, 0x6d, 0x67, 0x70, 0x1c, 0x9c, 0x8d, 0x2a]),
    UPDATE_SKILL: Buffer.from([0xa0, 0x6a, 0xd7, 0x5c, 0x1f, 0x8c, 0x8e, 0x3b]),
    DEPRECATE_SKILL: Buffer.from([0xb1, 0x5b, 0xe8, 0x4d, 0x2e, 0x7d, 0x9f, 0x4c]),
} as const;

// ============================================================================
// Instruction Args Types
// ============================================================================

/**
 * 注册 Skill 指令参数
 */
export interface RegisterSkillArgs {
    /** Skill 名称哈希 (32 bytes) */
    nameHash: Uint8Array;
    /** SKILL.md 内容哈希 (32 bytes) */
    contentHash: Uint8Array;
    /** 单次调用价格 (lamports) */
    priceLamports: BN | number | bigint;
}

/**
 * 更新 Skill 指令参数
 */
export interface UpdateSkillArgs {
    /** 新的内容哈希 (32 bytes) */
    newContentHash: Uint8Array;
    /** 新的价格 (lamports) */
    newPrice: BN | number | bigint;
}

/**
 * 注册 Skill 账户上下文
 */
export interface RegisterSkillAccounts {
    /** Skill 创作者 (Signer) */
    authority: PublicKey;
    /** Skill PDA (可选，自动推导) */
    skillAccount?: PublicKey;
    /** System Program */
    systemProgram?: PublicKey;
}

/**
 * 更新/下架 Skill 账户上下文
 */
export interface ModifySkillAccounts {
    /** Skill 创作者 (Signer) */
    authority: PublicKey;
    /** Skill PDA */
    skillAccount: PublicKey;
}

// ============================================================================
// Instruction Builders
// ============================================================================

/**
 * 构建注册 Skill 指令
 *
 * @remarks
 * 创建一个新的 Skill 账户，注册到链上
 *
 * @param args - 指令参数
 * @param accounts - 账户上下文
 * @param programId - 程序 ID
 * @returns TransactionInstruction
 *
 * @example
 * ```typescript
 * import { registerSkill, hashString } from '@exo/sdk';
 * import BN from 'bn.js';
 *
 * const nameHash = hashString('my-awesome-skill');
 * const contentHash = hashString('skill-content-v1');
 *
 * const ix = registerSkill(
 *     {
 *         nameHash,
 *         contentHash,
 *         priceLamports: new BN(100_000_000), // 0.1 SOL
 *     },
 *     { authority: walletPublicKey }
 * );
 *
 * // Add to transaction
 * transaction.add(ix);
 * ```
 */
export function registerSkill(
    args: RegisterSkillArgs,
    accounts: RegisterSkillAccounts,
    programId: PublicKey = EXO_CORE_PROGRAM_ID
): TransactionInstruction {
    // Validate args
    if (args.nameHash.length !== 32) {
        throw new Error('nameHash must be exactly 32 bytes');
    }
    if (args.contentHash.length !== 32) {
        throw new Error('contentHash must be exactly 32 bytes');
    }

    // Convert price to BN
    const priceBN = toBN(args.priceLamports);

    // Derive skill PDA if not provided
    const { publicKey: skillPda } = deriveSkillPda(
        accounts.authority,
        args.nameHash,
        programId
    );
    const skillAccount = accounts.skillAccount ?? skillPda;

    // Build instruction data
    const data = Buffer.concat([
        INSTRUCTION_DISCRIMINATORS.REGISTER_SKILL,
        Buffer.from(args.nameHash),
        Buffer.from(args.contentHash),
        priceBN.toArrayLike(Buffer, 'le', 8),
    ]);

    // Build keys
    const keys = [
        { pubkey: accounts.authority, isSigner: true, isWritable: true },
        { pubkey: skillAccount, isSigner: false, isWritable: true },
        {
            pubkey: accounts.systemProgram ?? SystemProgram.programId,
            isSigner: false,
            isWritable: false,
        },
    ];

    return new TransactionInstruction({
        keys,
        programId,
        data,
    });
}

/**
 * 构建更新 Skill 指令
 *
 * @remarks
 * 更新已存在的 Skill 信息（内容哈希和价格）
 *
 * @param args - 指令参数
 * @param accounts - 账户上下文
 * @param programId - 程序 ID
 * @returns TransactionInstruction
 *
 * @example
 * ```typescript
 * import { updateSkill, hashString } from '@exo/sdk';
 * import BN from 'bn.js';
 *
 * const ix = updateSkill(
 *     {
 *         newContentHash: hashString('skill-content-v2'),
 *         newPrice: new BN(200_000_000), // 0.2 SOL
 *     },
 *     {
 *         authority: walletPublicKey,
 *         skillAccount: skillPda,
 *     }
 * );
 * ```
 */
export function updateSkill(
    args: UpdateSkillArgs,
    accounts: ModifySkillAccounts,
    programId: PublicKey = EXO_CORE_PROGRAM_ID
): TransactionInstruction {
    // Validate args
    if (args.newContentHash.length !== 32) {
        throw new Error('newContentHash must be exactly 32 bytes');
    }

    // Convert price to BN
    const priceBN = toBN(args.newPrice);

    // Build instruction data
    const data = Buffer.concat([
        INSTRUCTION_DISCRIMINATORS.UPDATE_SKILL,
        Buffer.from(args.newContentHash),
        priceBN.toArrayLike(Buffer, 'le', 8),
    ]);

    // Build keys
    const keys = [
        { pubkey: accounts.authority, isSigner: true, isWritable: true },
        { pubkey: accounts.skillAccount, isSigner: false, isWritable: true },
    ];

    return new TransactionInstruction({
        keys,
        programId,
        data,
    });
}

/**
 * 构建下架 Skill 指令
 *
 * @remarks
 * 将 Skill 标记为已下架，不再接受新调用
 *
 * @param accounts - 账户上下文
 * @param programId - 程序 ID
 * @returns TransactionInstruction
 *
 * @example
 * ```typescript
 * import { deprecateSkill } from '@exo/sdk';
 *
 * const ix = deprecateSkill({
 *     authority: walletPublicKey,
 *     skillAccount: skillPda,
 * });
 * ```
 */
export function deprecateSkill(
    accounts: ModifySkillAccounts,
    programId: PublicKey = EXO_CORE_PROGRAM_ID
): TransactionInstruction {
    // Build instruction data
    const data = INSTRUCTION_DISCRIMINATORS.DEPRECATE_SKILL;

    // Build keys
    const keys = [
        { pubkey: accounts.authority, isSigner: true, isWritable: true },
        { pubkey: accounts.skillAccount, isSigner: false, isWritable: true },
    ];

    return new TransactionInstruction({
        keys,
        programId,
        data,
    });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 转换数值类型到 BN
 */
function toBN(value: BN | number | bigint): BN {
    if (BN.isBN(value)) {
        return value;
    }
    if (typeof value === 'bigint') {
        return new BN(value.toString());
    }
    return new BN(value);
}

/**
 * Skill 指令工厂类
 *
 * @remarks
 * 便捷的面向对象封装
 */
export class SkillInstructionBuilder {
    constructor(
        public readonly authority: PublicKey,
        public readonly programId: PublicKey = EXO_CORE_PROGRAM_ID
    ) { }

    /**
     * 创建注册指令
     */
    register(
        nameHash: Uint8Array,
        contentHash: Uint8Array,
        priceLamports: BN | number | bigint
    ): TransactionInstruction {
        return registerSkill(
            { nameHash, contentHash, priceLamports },
            { authority: this.authority },
            this.programId
        );
    }

    /**
     * 创建更新指令
     */
    update(
        skillAccount: PublicKey,
        newContentHash: Uint8Array,
        newPrice: BN | number | bigint
    ): TransactionInstruction {
        return updateSkill(
            { newContentHash, newPrice },
            { authority: this.authority, skillAccount },
            this.programId
        );
    }

    /**
     * 创建下架指令
     */
    deprecate(skillAccount: PublicKey): TransactionInstruction {
        return deprecateSkill(
            { authority: this.authority, skillAccount },
            this.programId
        );
    }
}
