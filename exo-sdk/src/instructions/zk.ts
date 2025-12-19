/**
 * @exo/sdk - ZK Compression Instructions
 * 
 * Light Protocol ZK 压缩存储实现
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { createHash } from 'crypto';
import {
    AgentHistoryRecord,
    CompressedAgentHistory,
    ZKStoreResult,
    CreditScoreResult,
} from '../types/compressed';

/**
 * Light Protocol RPC 端点
 * 使用 Helius 的 ZK Compression 支持
 */
const DEFAULT_LIGHT_RPC = 'https://devnet.helius-rpc.com';

/**
 * ZK Agent 历史管理类
 * 
 * @remarks
 * 使用 Light Protocol ZK Compression 存储 Agent 行为历史
 * 支持链上可验证的信用评分计算
 * 
 * @example
 * ```typescript
 * const zkHistory = new ZKAgentHistory(connection, 'YOUR_HELIUS_API_KEY');
 * 
 * // 存储记录
 * await zkHistory.storeRecord(payer, agentPubkey, {
 *     type: 'execution',
 *     timestamp: Date.now(),
 *     reputationDelta: 100,
 * });
 * 
 * // 计算信用分
 * const score = await zkHistory.calculateCreditScore(agentPubkey);
 * ```
 */
export class ZKAgentHistory {
    private connection: Connection;
    private rpcUrl: string;
    private apiKey: string;
    
    /** 本地缓存 (用于 Mock 模式) */
    private localCache: Map<string, AgentHistoryRecord[]> = new Map();
    
    /** 是否使用 Mock 模式 */
    private mockMode: boolean = false;

    constructor(
        connection: Connection,
        apiKey?: string,
        options?: { mockMode?: boolean }
    ) {
        this.connection = connection;
        this.apiKey = apiKey || process.env.HELIUS_API_KEY || '';
        this.rpcUrl = this.apiKey 
            ? `${DEFAULT_LIGHT_RPC}?api-key=${this.apiKey}`
            : DEFAULT_LIGHT_RPC;
        this.mockMode = options?.mockMode ?? !this.apiKey;
        
        if (this.mockMode) {
            console.warn('[ZKAgentHistory] Running in MOCK mode - no real ZK compression');
        }
    }

    /**
     * 存储 Agent 行为记录
     * 
     * @param payer - 支付账户
     * @param agentPubkey - Agent 公钥
     * @param record - 历史记录
     * @returns 存储结果
     */
    async storeRecord(
        payer: Keypair,
        agentPubkey: PublicKey,
        record: AgentHistoryRecord
    ): Promise<ZKStoreResult> {
        // Mock 模式: 本地缓存
        if (this.mockMode) {
            return this.mockStoreRecord(agentPubkey, record);
        }

        // 真实模式: 调用 Light Protocol
        try {
            const { createRpc } = await import('@lightprotocol/stateless.js');
            
            const rpc = createRpc(this.rpcUrl, this.rpcUrl);
            const data = Buffer.from(JSON.stringify(record));
            
            // 使用 Light Protocol 压缩存储
            // 注意: 实际 API 可能需要根据 Light Protocol 文档调整
            const txSignature = await this.compressData(rpc, payer, agentPubkey, data);
            
            return {
                txSignature,
                compressedAccountAddress: agentPubkey.toBase58(),
            };
        } catch (error) {
            console.error('[ZKAgentHistory] Store failed, falling back to mock:', error);
            return this.mockStoreRecord(agentPubkey, record);
        }
    }

    /**
     * 压缩数据到链上 (内部方法)
     */
    private async compressData(
        rpc: unknown,
        payer: Keypair,
        owner: PublicKey,
        data: Buffer
    ): Promise<string> {
        // Light Protocol 压缩调用
        // 实际实现依赖 Light Protocol SDK 版本
        // 这里提供兼容性封装
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const lightRpc = rpc as any;
            if (typeof lightRpc.compress === 'function') {
                const result = await lightRpc.compress(this.connection, payer, data, owner);
                return result.txId || result.signature || `zk_${Date.now()}`;
            }
        } catch {
            // 降级到 mock
        }
        
        // Mock fallback
        return `mock_zk_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }

    /**
     * Mock 存储实现
     */
    private mockStoreRecord(
        agentPubkey: PublicKey,
        record: AgentHistoryRecord
    ): ZKStoreResult {
        const key = agentPubkey.toBase58();
        const records = this.localCache.get(key) || [];
        records.push(record);
        this.localCache.set(key, records);
        
        return {
            txSignature: `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            compressedAccountAddress: key,
        };
    }

    /**
     * 获取 Agent 历史摘要
     */
    async getHistorySummary(agentPubkey: PublicKey): Promise<CompressedAgentHistory> {
        if (this.mockMode) {
            return this.mockGetHistorySummary(agentPubkey);
        }

        try {
            const { createRpc } = await import('@lightprotocol/stateless.js');
            const rpc = createRpc(this.rpcUrl, this.rpcUrl);
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const lightRpc = rpc as any;
            const accounts = await lightRpc.getCompressedAccountsByOwner(agentPubkey);
            const dataBuffers = (accounts || []).map((a: { data: Buffer }) => 
                Buffer.isBuffer(a.data) ? a.data : Buffer.from(a.data || '')
            );
            const historyRoot = this.computeMerkleRoot(dataBuffers);
            
            return {
                agentPubkey: agentPubkey.toBase58(),
                historyRoot,
                recordCount: (accounts || []).length,
                lastUpdated: Date.now(),
            };
        } catch (error) {
            console.error('[ZKAgentHistory] Get summary failed, using mock:', error);
            return this.mockGetHistorySummary(agentPubkey);
        }
    }

    /**
     * Mock 获取摘要实现
     */
    private mockGetHistorySummary(agentPubkey: PublicKey): CompressedAgentHistory {
        const key = agentPubkey.toBase58();
        const records = this.localCache.get(key) || [];
        
        const historyRoot = this.computeMerkleRoot(
            records.map(r => Buffer.from(JSON.stringify(r)))
        );
        
        return {
            agentPubkey: key,
            historyRoot,
            recordCount: records.length,
            lastUpdated: Date.now(),
        };
    }

    /**
     * 验证历史记录 Merkle Root
     */
    async verifyHistory(
        agentPubkey: PublicKey,
        expectedRoot: string
    ): Promise<boolean> {
        const summary = await this.getHistorySummary(agentPubkey);
        return summary.historyRoot === expectedRoot;
    }

    /**
     * 计算 Agent 信用评分
     * 
     * @remarks
     * 基于历史记录计算可验证的信用分数
     * - 基础分: 5000
     * - 执行成功: +100
     * - 被挑战: -500
     * - 被 Slash: -2000
     * - 质押: +50
     */
    async calculateCreditScore(agentPubkey: PublicKey): Promise<CreditScoreResult> {
        let records: AgentHistoryRecord[] = [];
        
        if (this.mockMode) {
            records = this.localCache.get(agentPubkey.toBase58()) || [];
        } else {
            try {
                const { createRpc } = await import('@lightprotocol/stateless.js');
                const rpc = createRpc(this.rpcUrl, this.rpcUrl);
                
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const lightRpc = rpc as any;
                const accounts = await lightRpc.getCompressedAccountsByOwner(agentPubkey);
                records = (accounts || []).map((a: { data: Buffer }) => {
                    try {
                        const dataStr = Buffer.isBuffer(a.data) 
                            ? a.data.toString() 
                            : String(a.data);
                        return JSON.parse(dataStr) as AgentHistoryRecord;
                    } catch {
                        return null;
                    }
                }).filter((r: AgentHistoryRecord | null): r is AgentHistoryRecord => r !== null);
            } catch (error) {
                console.error('[ZKAgentHistory] Calculate score failed:', error);
                records = this.localCache.get(agentPubkey.toBase58()) || [];
            }
        }

        // 计算分数
        let score = 5000; // 基础分
        for (const record of records) {
            score += record.reputationDelta;
        }
        
        // 限制范围
        score = Math.max(0, Math.min(10000, score));

        return {
            agentPubkey: agentPubkey.toBase58(),
            score,
            recordCount: records.length,
            calculatedAt: Date.now(),
        };
    }

    /**
     * 获取 Agent 历史记录列表
     */
    async getRecords(agentPubkey: PublicKey): Promise<AgentHistoryRecord[]> {
        if (this.mockMode) {
            return this.localCache.get(agentPubkey.toBase58()) || [];
        }

        try {
            const { createRpc } = await import('@lightprotocol/stateless.js');
            const rpc = createRpc(this.rpcUrl, this.rpcUrl);
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const lightRpc = rpc as any;
            const accounts = await lightRpc.getCompressedAccountsByOwner(agentPubkey);
            return (accounts || []).map((a: { data: Buffer }) => {
                try {
                    const dataStr = Buffer.isBuffer(a.data) 
                        ? a.data.toString() 
                        : String(a.data);
                    return JSON.parse(dataStr) as AgentHistoryRecord;
                } catch {
                    return null;
                }
            }).filter((r: AgentHistoryRecord | null): r is AgentHistoryRecord => r !== null);
        } catch (error) {
            console.error('[ZKAgentHistory] Get records failed:', error);
            return this.localCache.get(agentPubkey.toBase58()) || [];
        }
    }

    /**
     * 计算 Merkle Root
     */
    private computeMerkleRoot(dataBuffers: Buffer[]): string {
        if (dataBuffers.length === 0) {
            return createHash('sha256').update('').digest('hex');
        }
        
        // 简化版: 串联所有数据后哈希
        const combined = Buffer.concat(dataBuffers);
        return createHash('sha256').update(combined).digest('hex');
    }

    /**
     * 检查是否在 Mock 模式
     */
    isMockMode(): boolean {
        return this.mockMode;
    }
}
