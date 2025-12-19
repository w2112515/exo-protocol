/**
 * @exo/sdk - ZK Compressed Agent Types
 * 
 * Light Protocol 压缩数据结构定义
 */

/**
 * 压缩 Agent 历史摘要
 */
export interface CompressedAgentHistory {
    /** Agent 公钥 (Base58) */
    agentPubkey: string;
    /** 行为记录 Merkle Root */
    historyRoot: string;
    /** 记录数量 */
    recordCount: number;
    /** 最后更新时间戳 (ms) */
    lastUpdated: number;
}

/**
 * Agent 历史记录条目
 */
export interface AgentHistoryRecord {
    /** 记录类型 */
    type: 'execution' | 'challenge' | 'slash' | 'stake' | 'unstake';
    /** 时间戳 (ms) */
    timestamp: number;
    /** 关联订单 Pubkey (可选) */
    orderPubkey?: string;
    /** 结果哈希 (可选) */
    resultHash?: string;
    /** 信誉变化值 (-10000 ~ +10000) */
    reputationDelta: number;
}

/**
 * ZK 压缩存储结果
 */
export interface ZKStoreResult {
    /** 交易签名 */
    txSignature: string;
    /** 压缩账户地址 */
    compressedAccountAddress?: string;
    /** 消耗的 CU */
    computeUnits?: number;
}

/**
 * 信用评分结果
 */
export interface CreditScoreResult {
    /** Agent 公钥 */
    agentPubkey: string;
    /** 信用分数 (0-10000) */
    score: number;
    /** 历史记录数 */
    recordCount: number;
    /** 计算时间戳 */
    calculatedAt: number;
}
