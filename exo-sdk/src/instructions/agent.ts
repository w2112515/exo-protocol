/**
 * @exo/sdk - Agent Instructions
 *
 * Instruction builders for Agent Identity operations
 *
 * @packageDocumentation
 */

import {
    PublicKey,
    TransactionInstruction,
    SystemProgram,
} from '@solana/web3.js';
import { EXO_CORE_PROGRAM_ID } from '../constants';
import { deriveAgentPda } from '../pda';

// ============================================================================
// Instruction Discriminators
// ============================================================================

/**
 * Anchor 指令 discriminator
 *
 * @remarks
 * SHA256("global:create_identity")[0..8]
 * TODO: 部署后从 IDL 中提取实际 discriminator
 */
const INSTRUCTION_DISCRIMINATORS = {
    CREATE_IDENTITY: Buffer.from([0xd1, 0x4a, 0x12, 0x5b, 0x3c, 0x8d, 0x9e, 0x4f]),
    UPDATE_PROFILE: Buffer.from([0xe2, 0x5b, 0x23, 0x6c, 0x4d, 0x9e, 0xaf, 0x50]),
    CLOSE_IDENTITY: Buffer.from([0xf3, 0x6c, 0x34, 0x7d, 0x5e, 0xaf, 0xb0, 0x61]),
} as const;

// ============================================================================
// Instruction Args Types
// ============================================================================

/**
 * 创建 Agent Identity 指令参数
 */
export interface CreateIdentityArgs {
    /** 可选的初始 metadata (未来扩展) */
    metadata?: Uint8Array;
}

/**
 * 更新 Agent Profile 指令参数
 */
export interface UpdateProfileArgs {
    /** 新的 metadata */
    metadata: Uint8Array;
}

/**
 * 创建 Identity 账户上下文
 */
export interface CreateIdentityAccounts {
    /** Agent 所有者 (Signer) */
    owner: PublicKey;
    /** Agent PDA (可选，自动推导) */
    agentAccount?: PublicKey;
    /** System Program */
    systemProgram?: PublicKey;
}

/**
 * 更新/关闭 Identity 账户上下文
 */
export interface ModifyIdentityAccounts {
    /** Agent 所有者 (Signer) */
    owner: PublicKey;
    /** Agent PDA */
    agentAccount: PublicKey;
}

// ============================================================================
// Instruction Builders
// ============================================================================

/**
 * 构建创建 Agent Identity 指令
 *
 * @remarks
 * 创建一个新的 Agent Identity 账户
 * PDA 种子: ["agent", owner]
 *
 * @param accounts - 账户上下文
 * @param args - 可选的指令参数
 * @param programId - 程序 ID
 * @returns TransactionInstruction
 *
 * @example
 * ```typescript
 * import { createIdentity } from '@exo/sdk';
 *
 * const ix = createIdentity({ owner: walletPublicKey });
 *
 * // Add to transaction
 * transaction.add(ix);
 * ```
 */
export function createIdentity(
    accounts: CreateIdentityAccounts,
    args?: CreateIdentityArgs,
    programId: PublicKey = EXO_CORE_PROGRAM_ID
): TransactionInstruction {
    // Derive agent PDA if not provided
    const { publicKey: agentPda } = deriveAgentPda(accounts.owner, programId);
    const agentAccount = accounts.agentAccount ?? agentPda;

    // Build instruction data
    const dataBuffers: Buffer[] = [INSTRUCTION_DISCRIMINATORS.CREATE_IDENTITY];

    // Add optional metadata (if provided)
    if (args?.metadata && args.metadata.length > 0) {
        const metadataLenBuffer = Buffer.alloc(4);
        metadataLenBuffer.writeUInt32LE(args.metadata.length);
        dataBuffers.push(metadataLenBuffer);
        dataBuffers.push(Buffer.from(args.metadata));
    } else {
        // No metadata: write 0 length
        const zeroLenBuffer = Buffer.alloc(4);
        zeroLenBuffer.writeUInt32LE(0);
        dataBuffers.push(zeroLenBuffer);
    }

    const data = Buffer.concat(dataBuffers);

    // Build keys
    const keys = [
        { pubkey: accounts.owner, isSigner: true, isWritable: true },
        { pubkey: agentAccount, isSigner: false, isWritable: true },
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
 * 构建更新 Agent Profile 指令
 *
 * @remarks
 * 更新已存在的 Agent Identity 信息
 *
 * @param args - 指令参数
 * @param accounts - 账户上下文
 * @param programId - 程序 ID
 * @returns TransactionInstruction
 *
 * @example
 * ```typescript
 * import { updateProfile, deriveAgentPda } from '@exo/sdk';
 *
 * const { publicKey: agentPda } = deriveAgentPda(walletPublicKey);
 * const ix = updateProfile(
 *     { metadata: new Uint8Array([1, 2, 3]) },
 *     { owner: walletPublicKey, agentAccount: agentPda }
 * );
 * ```
 */
export function updateProfile(
    args: UpdateProfileArgs,
    accounts: ModifyIdentityAccounts,
    programId: PublicKey = EXO_CORE_PROGRAM_ID
): TransactionInstruction {
    // Build instruction data
    const metadataLenBuffer = Buffer.alloc(4);
    metadataLenBuffer.writeUInt32LE(args.metadata.length);

    const data = Buffer.concat([
        INSTRUCTION_DISCRIMINATORS.UPDATE_PROFILE,
        metadataLenBuffer,
        Buffer.from(args.metadata),
    ]);

    // Build keys
    const keys = [
        { pubkey: accounts.owner, isSigner: true, isWritable: true },
        { pubkey: accounts.agentAccount, isSigner: false, isWritable: true },
    ];

    return new TransactionInstruction({
        keys,
        programId,
        data,
    });
}

/**
 * 构建关闭 Agent Identity 指令
 *
 * @remarks
 * 关闭 Agent Identity 账户，回收租金
 *
 * @param accounts - 账户上下文
 * @param programId - 程序 ID
 * @returns TransactionInstruction
 *
 * @example
 * ```typescript
 * import { closeIdentity, deriveAgentPda } from '@exo/sdk';
 *
 * const { publicKey: agentPda } = deriveAgentPda(walletPublicKey);
 * const ix = closeIdentity({
 *     owner: walletPublicKey,
 *     agentAccount: agentPda,
 * });
 * ```
 */
export function closeIdentity(
    accounts: ModifyIdentityAccounts,
    programId: PublicKey = EXO_CORE_PROGRAM_ID
): TransactionInstruction {
    // Build instruction data
    const data = INSTRUCTION_DISCRIMINATORS.CLOSE_IDENTITY;

    // Build keys
    const keys = [
        { pubkey: accounts.owner, isSigner: true, isWritable: true },
        { pubkey: accounts.agentAccount, isSigner: false, isWritable: true },
    ];

    return new TransactionInstruction({
        keys,
        programId,
        data,
    });
}

// ============================================================================
// Builder Class
// ============================================================================

/**
 * Agent 指令工厂类
 *
 * @remarks
 * 便捷的面向对象封装
 *
 * @example
 * ```typescript
 * import { AgentInstructionBuilder } from '@exo/sdk';
 *
 * const builder = new AgentInstructionBuilder(walletPublicKey);
 *
 * // Create identity
 * const createIx = builder.create();
 *
 * // Update profile
 * const updateIx = builder.update(agentPda, new Uint8Array([1, 2, 3]));
 *
 * // Close identity
 * const closeIx = builder.close(agentPda);
 * ```
 */
export class AgentInstructionBuilder {
    /** Agent PDA (cached) */
    public readonly agentPda: PublicKey;

    constructor(
        public readonly owner: PublicKey,
        public readonly programId: PublicKey = EXO_CORE_PROGRAM_ID
    ) {
        const { publicKey } = deriveAgentPda(owner, programId);
        this.agentPda = publicKey;
    }

    /**
     * 创建 Agent Identity 指令
     */
    create(metadata?: Uint8Array): TransactionInstruction {
        return createIdentity(
            { owner: this.owner },
            metadata ? { metadata } : undefined,
            this.programId
        );
    }

    /**
     * 更新 Agent Profile 指令
     */
    update(
        metadata: Uint8Array,
        agentAccount?: PublicKey
    ): TransactionInstruction {
        return updateProfile(
            { metadata },
            { owner: this.owner, agentAccount: agentAccount ?? this.agentPda },
            this.programId
        );
    }

    /**
     * 关闭 Agent Identity 指令
     */
    close(agentAccount?: PublicKey): TransactionInstruction {
        return closeIdentity(
            { owner: this.owner, agentAccount: agentAccount ?? this.agentPda },
            this.programId
        );
    }
}
