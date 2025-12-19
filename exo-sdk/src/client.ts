/**
 * @exo/sdk - ExoClient
 *
 * Unified client for Exo Protocol operations
 *
 * @packageDocumentation
 */

import {
    Connection,
    PublicKey,
    Transaction,
    TransactionInstruction,
    TransactionSignature,
    Signer,
    ConfirmOptions,
} from '@solana/web3.js';
import BN from 'bn.js';

import { EXO_CORE_PROGRAM_ID } from './constants';
import {
    deriveSkillPda,
    deriveSkillPdaFromName,
    deriveAgentPda,
    deriveEscrowPda,
    deriveConfigPda,
    hashString,
    PdaResult,
} from './pda';
import {
    SkillInstructionBuilder,
} from './instructions/skill';
import {
    AgentInstructionBuilder,
    MIN_STAKE_AMOUNT,
} from './instructions/agent';
import {
    createEscrow,
    fundEscrow,
    releaseEscrow,
    cancelEscrow,
    EscrowInstructionBuilder,
} from './instructions/escrow';
import { ZKAgentHistory } from './instructions/zk';

// ============================================================================
// Types
// ============================================================================

/**
 * 钱包适配器接口
 *
 * @remarks
 * 兼容 @solana/wallet-adapter-base 的 WalletAdapter
 */
export interface WalletAdapter {
    /** 钱包公钥 */
    publicKey: PublicKey | null;
    /** 签名交易 */
    signTransaction<T extends Transaction>(transaction: T): Promise<T>;
    /** 批量签名交易 */
    signAllTransactions<T extends Transaction>(transactions: T[]): Promise<T[]>;
}

/**
 * ExoClient 配置选项
 */
export interface ExoClientOptions {
    /** Solana RPC 连接 */
    connection: Connection;
    /** 钱包适配器 */
    wallet: WalletAdapter;
    /** 程序 ID (默认 EXO_CORE_PROGRAM_ID) */
    programId?: PublicKey;
    /** 默认确认选项 */
    confirmOptions?: ConfirmOptions;
}

/**
 * 交易发送结果
 */
export interface TransactionResult {
    /** 交易签名 */
    signature: TransactionSignature;
    /** 确认状态 */
    confirmed: boolean;
}

// ============================================================================
// Skill Namespace
// ============================================================================

/**
 * Skill 操作命名空间
 */
export class SkillNamespace {
    private readonly builder: SkillInstructionBuilder;

    constructor(
        private readonly client: ExoClient,
        private readonly authority: PublicKey,
        private readonly programId: PublicKey
    ) {
        this.builder = new SkillInstructionBuilder(authority, programId);
    }

    /**
     * 推导 Skill PDA
     */
    derivePda(nameHash: Uint8Array): PdaResult {
        return deriveSkillPda(this.authority, nameHash, this.programId);
    }

    /**
     * 从名称推导 Skill PDA
     */
    derivePdaFromName(skillName: string): PdaResult {
        return deriveSkillPdaFromName(this.authority, skillName, this.programId);
    }

    /**
     * 构建注册 Skill 指令
     */
    register(
        nameHash: Uint8Array,
        contentHash: Uint8Array,
        priceLamports: BN | number | bigint
    ): TransactionInstruction {
        return this.builder.register(nameHash, contentHash, priceLamports);
    }

    /**
     * 构建更新 Skill 指令
     */
    update(
        skillAccount: PublicKey,
        newContentHash: Uint8Array,
        newPrice: BN | number | bigint
    ): TransactionInstruction {
        return this.builder.update(skillAccount, newContentHash, newPrice);
    }

    /**
     * 构建下架 Skill 指令
     */
    deprecate(skillAccount: PublicKey): TransactionInstruction {
        return this.builder.deprecate(skillAccount);
    }

    /**
     * 注册 Skill 并发送交易
     */
    async registerAndSend(
        nameHash: Uint8Array,
        contentHash: Uint8Array,
        priceLamports: BN | number | bigint
    ): Promise<TransactionResult> {
        const ix = this.register(nameHash, contentHash, priceLamports);
        return this.client.sendAndConfirm([ix]);
    }

    /**
     * 更新 Skill 并发送交易
     */
    async updateAndSend(
        skillAccount: PublicKey,
        newContentHash: Uint8Array,
        newPrice: BN | number | bigint
    ): Promise<TransactionResult> {
        const ix = this.update(skillAccount, newContentHash, newPrice);
        return this.client.sendAndConfirm([ix]);
    }

    /**
     * 下架 Skill 并发送交易
     */
    async deprecateAndSend(skillAccount: PublicKey): Promise<TransactionResult> {
        const ix = this.deprecate(skillAccount);
        return this.client.sendAndConfirm([ix]);
    }
}

// ============================================================================
// Agent Namespace
// ============================================================================

/**
 * Agent 操作命名空间
 */
export class AgentNamespace {
    private readonly builder: AgentInstructionBuilder;
    /** 当前用户的 Agent PDA (缓存) */
    public readonly agentPda: PublicKey;

    constructor(
        private readonly client: ExoClient,
        private readonly owner: PublicKey,
        private readonly programId: PublicKey
    ) {
        this.builder = new AgentInstructionBuilder(owner, programId);
        this.agentPda = this.builder.agentPda;
    }

    /**
     * 推导 Agent PDA
     */
    derivePda(ownerOverride?: PublicKey): PdaResult {
        return deriveAgentPda(ownerOverride ?? this.owner, this.programId);
    }

    /**
     * 构建创建 Identity 指令
     */
    create(metadata?: Uint8Array): TransactionInstruction {
        return this.builder.create(metadata);
    }

    /**
     * 构建更新 Profile 指令
     */
    update(metadata: Uint8Array, agentAccount?: PublicKey): TransactionInstruction {
        return this.builder.update(metadata, agentAccount);
    }

    /**
     * 构建关闭 Identity 指令
     */
    close(agentAccount?: PublicKey): TransactionInstruction {
        return this.builder.close(agentAccount);
    }

    /**
     * 创建 Identity 并发送交易
     */
    async createAndSend(metadata?: Uint8Array): Promise<TransactionResult> {
        const ix = this.create(metadata);
        return this.client.sendAndConfirm([ix]);
    }

    /**
     * 更新 Profile 并发送交易
     */
    async updateAndSend(
        metadata: Uint8Array,
        agentAccount?: PublicKey
    ): Promise<TransactionResult> {
        const ix = this.update(metadata, agentAccount);
        return this.client.sendAndConfirm([ix]);
    }

    /**
     * 关闭 Identity 并发送交易
     */
    async closeAndSend(agentAccount?: PublicKey): Promise<TransactionResult> {
        const ix = this.close(agentAccount);
        return this.client.sendAndConfirm([ix]);
    }

    /**
     * 构建质押指令
     */
    stakeInstruction(amount: bigint | number): TransactionInstruction {
        return this.builder.stake(amount);
    }

    /**
     * 构建取消质押指令
     */
    unstakeInstruction(amount: bigint | number): TransactionInstruction {
        return this.builder.unstake(amount);
    }

    /**
     * 质押 SOL 并发送交易
     *
     * @param lamports - 质押金额 (lamports)
     * @returns 交易结果
     * @throws 如果金额低于最低质押 (0.1 SOL)
     */
    async stake(lamports: number): Promise<TransactionResult> {
        if (lamports < MIN_STAKE_AMOUNT) {
            throw new Error(`Minimum stake is ${MIN_STAKE_AMOUNT / 1e9} SOL (${MIN_STAKE_AMOUNT} lamports)`);
        }
        const ix = this.stakeInstruction(lamports);
        return this.client.sendAndConfirm([ix]);
    }

    /**
     * 取消质押 SOL 并发送交易
     *
     * @param lamports - 取消质押金额 (lamports)
     * @returns 交易结果
     */
    async unstake(lamports: number): Promise<TransactionResult> {
        const ix = this.unstakeInstruction(lamports);
        return this.client.sendAndConfirm([ix]);
    }

    /**
     * 获取 Agent 状态
     *
     * @param address - Agent 地址 (可选，默认当前用户)
     * @returns Agent 状态信息
     */
    async getStatus(address?: string): Promise<AgentStatus> {
        const targetPda = address
            ? new PublicKey(address)
            : this.agentPda;

        const accountInfo = await this.client.connection.getAccountInfo(targetPda);

        if (!accountInfo) {
            return {
                address: targetPda.toBase58(),
                exists: false,
                tier: 0,
                stakedAmount: 0,
                isActive: false,
                reputationScore: 0,
                totalEarnings: 0,
                totalTasks: 0,
                slashedCount: 0,
            };
        }

        // 解析账户数据 (AgentIdentity V2 结构)
        // 8 (discriminator) + 32 (owner) + 1 (tier) + 8 (earnings) + 8 (tasks) + 2 (rep) + 8 (created) + 1 (bump) + 8 (staked) + 1 (slashed) + 1 (active)
        const data = accountInfo.data;
        const tier = data[40] ?? 0;
        const totalEarnings = Number(data.readBigUInt64LE(41));
        const totalTasks = Number(data.readBigUInt64LE(49));
        const reputationScore = data.readUInt16LE(57);
        const stakedAmount = data.length > 68 ? Number(data.readBigUInt64LE(68)) : 0;
        const slashedCount = data.length > 76 ? (data[76] ?? 0) : 0;
        const isActive = data.length > 77 ? data[77] === 1 : stakedAmount >= MIN_STAKE_AMOUNT;

        return {
            address: targetPda.toBase58(),
            exists: true,
            tier,
            stakedAmount,
            isActive,
            reputationScore,
            totalEarnings,
            totalTasks,
            slashedCount,
        };
    }

    /**
     * 列出所有 Agent
     *
     * @param options - 筛选选项
     * @returns Agent 列表
     */
    async list(options?: { limit?: number; activeOnly?: boolean }): Promise<AgentStatus[]> {
        // 简化实现: 返回 mock 数据用于演示
        // 真实实现需要 getProgramAccounts 查询
        const mockAgents: AgentStatus[] = [
            {
                address: this.agentPda.toBase58(),
                exists: true,
                tier: 1,
                stakedAmount: 200_000_000,
                isActive: true,
                reputationScore: 8500,
                totalEarnings: 1_500_000_000,
                totalTasks: 42,
                slashedCount: 0,
            },
        ];

        if (options?.activeOnly) {
            return mockAgents.filter(a => a.isActive);
        }

        return mockAgents.slice(0, options?.limit ?? 10);
    }
}

/**
 * Agent 状态接口
 */
export interface AgentStatus {
    /** Agent 地址 */
    address: string;
    /** 是否存在 */
    exists: boolean;
    /** Agent 等级 (0=Open, 1=Verified, 2=Premium) */
    tier: number;
    /** 质押金额 (lamports) */
    stakedAmount: number;
    /** 是否激活 */
    isActive: boolean;
    /** 信誉分数 (0-10000) */
    reputationScore: number;
    /** 总收益 (lamports) */
    totalEarnings: number;
    /** 总任务数 */
    totalTasks: number;
    /** 被罚次数 */
    slashedCount: number;
}

// ============================================================================
// Escrow Namespace
// ============================================================================

/**
 * Escrow 操作命名空间
 */
export class EscrowNamespace {
    constructor(
        private readonly client: ExoClient,
        private readonly buyer: PublicKey,
        private readonly programId: PublicKey
    ) { }

    /**
     * 推导 Escrow PDA
     */
    derivePda(skillPda: PublicKey, nonce: bigint): PdaResult {
        return deriveEscrowPda(this.buyer, skillPda, nonce, this.programId);
    }

    /**
     * 获取 Skill 相关的 Escrow Builder
     */
    forSkill(skillPda: PublicKey): EscrowInstructionBuilder {
        return new EscrowInstructionBuilder(this.buyer, skillPda, this.programId);
    }

    /**
     * 构建创建 Escrow 指令
     */
    create(
        skillPda: PublicKey,
        amount: BN | number | bigint,
        nonce: bigint,
        expiresAt?: BN | number | bigint
    ): TransactionInstruction {
        return createEscrow(
            { amount, nonce, expiresAt },
            { buyer: this.buyer, skill: skillPda },
            this.programId
        );
    }

    /**
     * 构建注资 Escrow 指令
     */
    fund(escrowAccount: PublicKey, amount: BN | number | bigint): TransactionInstruction {
        return fundEscrow(
            { amount },
            { buyer: this.buyer, escrowAccount },
            this.programId
        );
    }

    /**
     * 构建释放 Escrow 指令
     */
    release(
        escrowAccount: PublicKey,
        skillPda: PublicKey,
        resultHash: Uint8Array,
        skillAuthority: PublicKey,
        executor?: PublicKey
    ): TransactionInstruction {
        return releaseEscrow(
            { resultHash },
            {
                buyer: this.buyer,
                escrowAccount,
                skill: skillPda,
                skillAuthority,
                executor,
            },
            this.programId
        );
    }

    /**
     * 构建取消 Escrow 指令
     */
    cancel(escrowAccount: PublicKey): TransactionInstruction {
        return cancelEscrow({ buyer: this.buyer, escrowAccount }, this.programId);
    }

    /**
     * 创建 Escrow 并发送交易
     */
    async createAndSend(
        skillPda: PublicKey,
        amount: BN | number | bigint,
        nonce: bigint,
        expiresAt?: BN | number | bigint
    ): Promise<TransactionResult> {
        const ix = this.create(skillPda, amount, nonce, expiresAt);
        return this.client.sendAndConfirm([ix]);
    }

    /**
     * 注资 Escrow 并发送交易
     */
    async fundAndSend(
        escrowAccount: PublicKey,
        amount: BN | number | bigint
    ): Promise<TransactionResult> {
        const ix = this.fund(escrowAccount, amount);
        return this.client.sendAndConfirm([ix]);
    }

    /**
     * 释放 Escrow 并发送交易
     */
    async releaseAndSend(
        escrowAccount: PublicKey,
        skillPda: PublicKey,
        resultHash: Uint8Array,
        skillAuthority: PublicKey,
        executor?: PublicKey
    ): Promise<TransactionResult> {
        const ix = this.release(escrowAccount, skillPda, resultHash, skillAuthority, executor);
        return this.client.sendAndConfirm([ix]);
    }

    /**
     * 取消 Escrow 并发送交易
     */
    async cancelAndSend(escrowAccount: PublicKey): Promise<TransactionResult> {
        const ix = this.cancel(escrowAccount);
        return this.client.sendAndConfirm([ix]);
    }
}

// ============================================================================
// PDA Namespace
// ============================================================================

/**
 * PDA 工具命名空间
 */
export class PdaNamespace {
    constructor(private readonly programId: PublicKey) { }

    /** 推导 Skill PDA */
    skill(authority: PublicKey, nameHash: Uint8Array): PdaResult {
        return deriveSkillPda(authority, nameHash, this.programId);
    }

    /** 从名称推导 Skill PDA */
    skillFromName(authority: PublicKey, skillName: string): PdaResult {
        return deriveSkillPdaFromName(authority, skillName, this.programId);
    }

    /** 推导 Agent PDA */
    agent(owner: PublicKey): PdaResult {
        return deriveAgentPda(owner, this.programId);
    }

    /** 推导 Escrow PDA */
    escrow(buyer: PublicKey, skillPda: PublicKey, nonce: bigint): PdaResult {
        return deriveEscrowPda(buyer, skillPda, nonce, this.programId);
    }

    /** 推导 Protocol Config PDA */
    config(): PdaResult {
        return deriveConfigPda(this.programId);
    }

    /** 哈希字符串 */
    hash(input: string): Uint8Array {
        return hashString(input);
    }
}

// ============================================================================
// ExoClient
// ============================================================================

/**
 * Exo Protocol 统一客户端
 *
 * @remarks
 * 提供 Skill、Agent、Escrow 三大模块的便捷访问接口
 *
 * @example
 * ```typescript
 * import { ExoClient } from '@exo/sdk';
 * import { Connection } from '@solana/web3.js';
 *
 * const client = new ExoClient({
 *     connection: new Connection('https://api.devnet.solana.com'),
 *     wallet: walletAdapter,
 * });
 *
 * // 使用 skill 命名空间
 * const { publicKey: skillPda } = client.skill.derivePdaFromName('my-skill');
 * const ix = client.skill.register(nameHash, contentHash, 100_000_000);
 *
 * // 使用 agent 命名空间
 * const createIx = client.agent.create();
 *
 * // 使用 escrow 命名空间
 * const escrowIx = client.escrow.create(skillPda, 100_000_000, BigInt(Date.now()));
 *
 * // 发送交易
 * const result = await client.sendAndConfirm([ix, createIx, escrowIx]);
 * console.log('Signature:', result.signature);
 * ```
 */
export class ExoClient {
    /** Solana RPC 连接 */
    public readonly connection: Connection;
    /** 钱包适配器 */
    public readonly wallet: WalletAdapter;
    /** 程序 ID */
    public readonly programId: PublicKey;
    /** 默认确认选项 */
    public readonly confirmOptions: ConfirmOptions;

    /** Skill 操作命名空间 */
    public readonly skill: SkillNamespace;
    /** Agent 操作命名空间 */
    public readonly agent: AgentNamespace;
    /** Escrow 操作命名空间 */
    public readonly escrow: EscrowNamespace;
    /** PDA 工具命名空间 */
    public readonly pda: PdaNamespace;
    /** ZK 压缩历史命名空间 */
    public readonly zkHistory: ZKAgentHistory;

    constructor(options: ExoClientOptions) {
        this.connection = options.connection;
        this.wallet = options.wallet;
        this.programId = options.programId ?? EXO_CORE_PROGRAM_ID;
        this.confirmOptions = options.confirmOptions ?? {
            commitment: 'confirmed',
            preflightCommitment: 'confirmed',
        };

        // 确保钱包已连接
        if (!this.wallet.publicKey) {
            throw new Error('Wallet not connected: publicKey is null');
        }

        const publicKey = this.wallet.publicKey;

        // 初始化命名空间
        this.skill = new SkillNamespace(this, publicKey, this.programId);
        this.agent = new AgentNamespace(this, publicKey, this.programId);
        this.escrow = new EscrowNamespace(this, publicKey, this.programId);
        this.pda = new PdaNamespace(this.programId);

        // ZK History (可选，需要 Helius API Key)
        this.zkHistory = new ZKAgentHistory(
            this.connection,
            process.env.HELIUS_API_KEY,
            { mockMode: !process.env.HELIUS_API_KEY }
        );
    }

    /**
     * 获取当前钱包公钥
     *
     * @throws 如果钱包未连接
     */
    get publicKey(): PublicKey {
        if (!this.wallet.publicKey) {
            throw new Error('Wallet not connected');
        }
        return this.wallet.publicKey;
    }

    /**
     * 发送并确认交易
     *
     * @param instructions - 交易指令数组
     * @param additionalSigners - 额外签名者 (可选)
     * @param options - 确认选项 (可选，覆盖默认)
     * @returns 交易结果
     *
     * @example
     * ```typescript
     * const ix1 = client.skill.register(nameHash, contentHash, 100_000_000);
     * const ix2 = client.agent.create();
     *
     * const result = await client.sendAndConfirm([ix1, ix2]);
     * console.log('Tx:', result.signature);
     * ```
     */
    async sendAndConfirm(
        instructions: TransactionInstruction[],
        additionalSigners: Signer[] = [],
        options?: ConfirmOptions
    ): Promise<TransactionResult> {
        const opts = options ?? this.confirmOptions;

        // 创建交易
        const transaction = new Transaction();
        instructions.forEach((ix) => transaction.add(ix));

        // 获取最新 blockhash
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash(
            opts.preflightCommitment
        );
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = this.publicKey;

        // 额外签名者先签名
        if (additionalSigners.length > 0) {
            transaction.partialSign(...additionalSigners);
        }

        // 钱包签名
        const signedTx = await this.wallet.signTransaction(transaction);

        // 发送交易
        const signature = await this.connection.sendRawTransaction(
            signedTx.serialize(),
            {
                skipPreflight: opts.skipPreflight,
                preflightCommitment: opts.preflightCommitment,
            }
        );

        // 确认交易
        const confirmation = await this.connection.confirmTransaction(
            {
                signature,
                blockhash,
                lastValidBlockHeight,
            },
            opts.commitment
        );

        if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        return {
            signature,
            confirmed: true,
        };
    }

    /**
     * 模拟交易
     *
     * @param instructions - 交易指令数组
     * @returns 模拟结果
     */
    async simulate(
        instructions: TransactionInstruction[]
    ): Promise<{ logs: string[] | null; unitsConsumed: number | undefined }> {
        const transaction = new Transaction();
        instructions.forEach((ix) => transaction.add(ix));

        const { blockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = this.publicKey;

        const result = await this.connection.simulateTransaction(transaction);

        return {
            logs: result.value.logs,
            unitsConsumed: result.value.unitsConsumed,
        };
    }

    /**
     * 创建子客户端 (使用不同的钱包)
     *
     * @param wallet - 新的钱包适配器
     * @returns 新的 ExoClient 实例
     */
    withWallet(wallet: WalletAdapter): ExoClient {
        return new ExoClient({
            connection: this.connection,
            wallet,
            programId: this.programId,
            confirmOptions: this.confirmOptions,
        });
    }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * 创建 ExoClient 实例
 *
 * @param options - 配置选项
 * @returns ExoClient 实例
 */
export function createExoClient(options: ExoClientOptions): ExoClient {
    return new ExoClient(options);
}
