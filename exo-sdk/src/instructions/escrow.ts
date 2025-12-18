/**
 * @exo/sdk - Escrow Instructions
 *
 * Instruction builders for Escrow settlement operations
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
import { deriveEscrowPda, deriveConfigPda } from '../pda';

// ============================================================================
// Instruction Discriminators
// ============================================================================

/**
 * Anchor 指令 discriminator
 *
 * @remarks
 * SHA256("global:xxx")[0..8]
 * TODO: 部署后从 IDL 中提取实际 discriminator
 */
const INSTRUCTION_DISCRIMINATORS = {
    CREATE_ESCROW: Buffer.from([0xa1, 0x2b, 0x3c, 0x4d, 0x5e, 0x6f, 0x70, 0x81]),
    FUND_ESCROW: Buffer.from([0xb2, 0x3c, 0x4d, 0x5e, 0x6f, 0x70, 0x81, 0x92]),
    RELEASE_ESCROW: Buffer.from([0xc3, 0x4d, 0x5e, 0x6f, 0x70, 0x81, 0x92, 0xa3]),
    CANCEL_ESCROW: Buffer.from([0xd4, 0x5e, 0x6f, 0x70, 0x81, 0x92, 0xa3, 0xb4]),
} as const;

// ============================================================================
// Instruction Args Types
// ============================================================================

/**
 * 创建 Escrow 指令参数
 */
export interface CreateEscrowArgs {
    /** 托管金额 (lamports) */
    amount: BN | number | bigint;
    /** 防重放 nonce */
    nonce: bigint;
    /** 可选的过期时间 (Unix timestamp) */
    expiresAt?: BN | number | bigint;
}

/**
 * 注资 Escrow 指令参数
 */
export interface FundEscrowArgs {
    /** 追加金额 (lamports) */
    amount: BN | number | bigint;
}

/**
 * 释放 Escrow 指令参数
 */
export interface ReleaseEscrowArgs {
    /** 执行结果哈希 (32 bytes) */
    resultHash: Uint8Array;
}

/**
 * 创建 Escrow 账户上下文
 */
export interface CreateEscrowAccounts {
    /** 买家 (Signer, 付款方) */
    buyer: PublicKey;
    /** Skill PDA */
    skill: PublicKey;
    /** Escrow PDA (可选，自动推导) */
    escrowAccount?: PublicKey;
    /** Protocol Config PDA (可选，自动推导) */
    protocolConfig?: PublicKey;
    /** System Program */
    systemProgram?: PublicKey;
}

/**
 * 注资 Escrow 账户上下文
 */
export interface FundEscrowAccounts {
    /** 买家 (Signer) */
    buyer: PublicKey;
    /** Escrow PDA */
    escrowAccount: PublicKey;
    /** System Program */
    systemProgram?: PublicKey;
}

/**
 * 释放 Escrow 账户上下文
 */
export interface ReleaseEscrowAccounts {
    /** 买家 (Signer, 确认完成) */
    buyer: PublicKey;
    /** Escrow PDA */
    escrowAccount: PublicKey;
    /** Skill PDA (收取费用) */
    skill: PublicKey;
    /** Skill 创作者 (接收报酬) */
    skillAuthority: PublicKey;
    /** 执行 Agent (可选，接收分成) */
    executor?: PublicKey;
    /** Protocol Config PDA (提取协议费) */
    protocolConfig?: PublicKey;
    /** 协议 Treasury (接收协议费) */
    treasury?: PublicKey;
    /** System Program */
    systemProgram?: PublicKey;
}

/**
 * 取消 Escrow 账户上下文
 */
export interface CancelEscrowAccounts {
    /** 买家 (Signer, 取消方) */
    buyer: PublicKey;
    /** Escrow PDA */
    escrowAccount: PublicKey;
    /** System Program */
    systemProgram?: PublicKey;
}

// ============================================================================
// Instruction Builders
// ============================================================================

/**
 * 构建创建 Escrow 指令
 *
 * @remarks
 * 创建一个新的托管账户，用于 Skill 调用的资金托管
 * PDA 种子: ["escrow", buyer, skill_pda, nonce]
 *
 * @param args - 指令参数
 * @param accounts - 账户上下文
 * @param programId - 程序 ID
 * @returns TransactionInstruction
 *
 * @example
 * ```typescript
 * import { createEscrow, deriveSkillPda } from '@exo/sdk';
 * import BN from 'bn.js';
 *
 * const { publicKey: skillPda } = deriveSkillPda(authority, nameHash);
 * const nonce = BigInt(Date.now());
 *
 * const ix = createEscrow(
 *     {
 *         amount: new BN(100_000_000), // 0.1 SOL
 *         nonce,
 *     },
 *     {
 *         buyer: walletPublicKey,
 *         skill: skillPda,
 *     }
 * );
 *
 * // Add to transaction
 * transaction.add(ix);
 * ```
 */
export function createEscrow(
    args: CreateEscrowArgs,
    accounts: CreateEscrowAccounts,
    programId: PublicKey = EXO_CORE_PROGRAM_ID
): TransactionInstruction {
    // Convert amount to BN
    const amountBN = toBN(args.amount);

    // Derive escrow PDA if not provided
    const { publicKey: escrowPda } = deriveEscrowPda(
        accounts.buyer,
        accounts.skill,
        args.nonce,
        programId
    );
    const escrowAccount = accounts.escrowAccount ?? escrowPda;

    // Derive protocol config PDA if not provided
    const { publicKey: configPda } = deriveConfigPda(programId);
    const protocolConfig = accounts.protocolConfig ?? configPda;

    // Build nonce buffer (8 bytes LE)
    const nonceBuffer = Buffer.alloc(8);
    nonceBuffer.writeBigUInt64LE(args.nonce);

    // Build expires_at buffer (optional, default to 0 = use contract default)
    const expiresAtBN = args.expiresAt ? toBN(args.expiresAt) : new BN(0);

    // Build instruction data
    const data = Buffer.concat([
        INSTRUCTION_DISCRIMINATORS.CREATE_ESCROW,
        amountBN.toArrayLike(Buffer, 'le', 8),
        nonceBuffer,
        expiresAtBN.toArrayLike(Buffer, 'le', 8),
    ]);

    // Build keys
    const keys = [
        { pubkey: accounts.buyer, isSigner: true, isWritable: true },
        { pubkey: escrowAccount, isSigner: false, isWritable: true },
        { pubkey: accounts.skill, isSigner: false, isWritable: false },
        { pubkey: protocolConfig, isSigner: false, isWritable: false },
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
 * 构建注资 Escrow 指令
 *
 * @remarks
 * 向已存在的托管账户追加资金
 *
 * @param args - 指令参数
 * @param accounts - 账户上下文
 * @param programId - 程序 ID
 * @returns TransactionInstruction
 *
 * @example
 * ```typescript
 * import { fundEscrow, deriveEscrowPda } from '@exo/sdk';
 * import BN from 'bn.js';
 *
 * const ix = fundEscrow(
 *     { amount: new BN(50_000_000) }, // 0.05 SOL
 *     {
 *         buyer: walletPublicKey,
 *         escrowAccount: escrowPda,
 *     }
 * );
 * ```
 */
export function fundEscrow(
    args: FundEscrowArgs,
    accounts: FundEscrowAccounts,
    programId: PublicKey = EXO_CORE_PROGRAM_ID
): TransactionInstruction {
    // Convert amount to BN
    const amountBN = toBN(args.amount);

    // Build instruction data
    const data = Buffer.concat([
        INSTRUCTION_DISCRIMINATORS.FUND_ESCROW,
        amountBN.toArrayLike(Buffer, 'le', 8),
    ]);

    // Build keys
    const keys = [
        { pubkey: accounts.buyer, isSigner: true, isWritable: true },
        { pubkey: accounts.escrowAccount, isSigner: false, isWritable: true },
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
 * 构建释放 Escrow 指令
 *
 * @remarks
 * 买家确认 Skill 执行完成，释放托管资金给 Skill 创作者和执行 Agent
 * 同时扣除协议费
 *
 * @param args - 指令参数
 * @param accounts - 账户上下文
 * @param programId - 程序 ID
 * @returns TransactionInstruction
 *
 * @example
 * ```typescript
 * import { releaseEscrow, hashString } from '@exo/sdk';
 *
 * const resultHash = hashString('execution-result-v1');
 *
 * const ix = releaseEscrow(
 *     { resultHash },
 *     {
 *         buyer: walletPublicKey,
 *         escrowAccount: escrowPda,
 *         skill: skillPda,
 *         skillAuthority: skillCreator,
 *         executor: agentWallet,
 *     }
 * );
 * ```
 */
export function releaseEscrow(
    args: ReleaseEscrowArgs,
    accounts: ReleaseEscrowAccounts,
    programId: PublicKey = EXO_CORE_PROGRAM_ID
): TransactionInstruction {
    // Validate args
    if (args.resultHash.length !== 32) {
        throw new Error('resultHash must be exactly 32 bytes');
    }

    // Derive protocol config PDA if not provided
    const { publicKey: configPda } = deriveConfigPda(programId);
    const protocolConfig = accounts.protocolConfig ?? configPda;

    // Build instruction data
    const data = Buffer.concat([
        INSTRUCTION_DISCRIMINATORS.RELEASE_ESCROW,
        Buffer.from(args.resultHash),
    ]);

    // Build keys
    const keys = [
        { pubkey: accounts.buyer, isSigner: true, isWritable: true },
        { pubkey: accounts.escrowAccount, isSigner: false, isWritable: true },
        { pubkey: accounts.skill, isSigner: false, isWritable: true },
        { pubkey: accounts.skillAuthority, isSigner: false, isWritable: true },
        { pubkey: protocolConfig, isSigner: false, isWritable: false },
    ];

    // Add optional executor
    if (accounts.executor) {
        keys.push({
            pubkey: accounts.executor,
            isSigner: false,
            isWritable: true,
        });
    }

    // Add treasury if provided
    if (accounts.treasury) {
        keys.push({
            pubkey: accounts.treasury,
            isSigner: false,
            isWritable: true,
        });
    }

    keys.push({
        pubkey: accounts.systemProgram ?? SystemProgram.programId,
        isSigner: false,
        isWritable: false,
    });

    return new TransactionInstruction({
        keys,
        programId,
        data,
    });
}

/**
 * 构建取消 Escrow 指令
 *
 * @remarks
 * 取消托管，将资金退还给买家
 * 仅允许在 Pending 状态下取消
 *
 * @param accounts - 账户上下文
 * @param programId - 程序 ID
 * @returns TransactionInstruction
 *
 * @example
 * ```typescript
 * import { cancelEscrow } from '@exo/sdk';
 *
 * const ix = cancelEscrow({
 *     buyer: walletPublicKey,
 *     escrowAccount: escrowPda,
 * });
 * ```
 */
export function cancelEscrow(
    accounts: CancelEscrowAccounts,
    programId: PublicKey = EXO_CORE_PROGRAM_ID
): TransactionInstruction {
    // Build instruction data
    const data = INSTRUCTION_DISCRIMINATORS.CANCEL_ESCROW;

    // Build keys
    const keys = [
        { pubkey: accounts.buyer, isSigner: true, isWritable: true },
        { pubkey: accounts.escrowAccount, isSigner: false, isWritable: true },
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

// ============================================================================
// Builder Class
// ============================================================================

/**
 * Escrow 指令工厂类
 *
 * @remarks
 * 便捷的面向对象封装
 *
 * @example
 * ```typescript
 * import { EscrowInstructionBuilder, deriveSkillPda } from '@exo/sdk';
 *
 * const { publicKey: skillPda } = deriveSkillPda(authority, nameHash);
 * const builder = new EscrowInstructionBuilder(buyerPublicKey, skillPda);
 *
 * // Create escrow
 * const nonce = BigInt(Date.now());
 * const createIx = builder.create(100_000_000, nonce); // 0.1 SOL
 *
 * // Fund more
 * const fundIx = builder.fund(escrowPda, 50_000_000);
 *
 * // Release
 * const releaseIx = builder.release(escrowPda, resultHash, skillAuthority);
 *
 * // Or cancel
 * const cancelIx = builder.cancel(escrowPda);
 * ```
 */
export class EscrowInstructionBuilder {
    constructor(
        public readonly buyer: PublicKey,
        public readonly skill: PublicKey,
        public readonly programId: PublicKey = EXO_CORE_PROGRAM_ID
    ) { }

    /**
     * 创建 Escrow 指令
     *
     * @param amount - 托管金额 (lamports)
     * @param nonce - 防重放 nonce
     * @param expiresAt - 可选的过期时间
     */
    create(
        amount: BN | number | bigint,
        nonce: bigint,
        expiresAt?: BN | number | bigint
    ): TransactionInstruction {
        return createEscrow(
            { amount, nonce, expiresAt },
            { buyer: this.buyer, skill: this.skill },
            this.programId
        );
    }

    /**
     * 注资 Escrow 指令
     *
     * @param escrowAccount - Escrow PDA
     * @param amount - 追加金额 (lamports)
     */
    fund(
        escrowAccount: PublicKey,
        amount: BN | number | bigint
    ): TransactionInstruction {
        return fundEscrow(
            { amount },
            { buyer: this.buyer, escrowAccount },
            this.programId
        );
    }

    /**
     * 释放 Escrow 指令
     *
     * @param escrowAccount - Escrow PDA
     * @param resultHash - 执行结果哈希 (32 bytes)
     * @param skillAuthority - Skill 创作者地址
     * @param executor - 可选的执行 Agent 地址
     */
    release(
        escrowAccount: PublicKey,
        resultHash: Uint8Array,
        skillAuthority: PublicKey,
        executor?: PublicKey
    ): TransactionInstruction {
        return releaseEscrow(
            { resultHash },
            {
                buyer: this.buyer,
                escrowAccount,
                skill: this.skill,
                skillAuthority,
                executor,
            },
            this.programId
        );
    }

    /**
     * 取消 Escrow 指令
     *
     * @param escrowAccount - Escrow PDA
     */
    cancel(escrowAccount: PublicKey): TransactionInstruction {
        return cancelEscrow(
            { buyer: this.buyer, escrowAccount },
            this.programId
        );
    }

    /**
     * 从 nonce 推导 Escrow PDA
     *
     * @param nonce - 防重放 nonce
     */
    deriveEscrow(nonce: bigint): { publicKey: PublicKey; bump: number } {
        return deriveEscrowPda(this.buyer, this.skill, nonce, this.programId);
    }
}
