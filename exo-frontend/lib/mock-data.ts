// P3B-01: Mock 数据类型定义
// 与 sre-runtime/mock/*.json 字段完全匹配

export interface Order {
    order_id: string;
    skill_id: string;
    status: 'completed' | 'failed' | 'timeout';
    execution_time_ms: number;
    created_at: string;
    result_hash: string;
    agent_id: string;
    verificationStatus: 'verified' | 'pending' | 'challenged';
}

export interface Skill {
    // === 基础字段 (已有) ===
    skill_id: string;
    name: string;
    version: string;
    category: string;
    price_lamports: number;
    execution_count: number;
    success_rate: number;
    
    // === 新增: 描述与能力 ===
    description: string;           // 1-2 句话描述技能能力
    input_schema: string;          // 输入参数说明 (简化版)
    output_format: string;         // 输出格式说明
    
    // === 新增: 性能指标 ===
    avg_latency_ms: number;        // 平均响应时间 (毫秒)
    
    // === 新增: Exo 差异化 (链上可验证) ===
    creator_address: string;       // 创作者 Solana 地址
    royalty_rate: number;          // 版税比例 (0.10 = 10%)
    total_royalties_earned: number;// 累计版税收入 (lamports)
    on_chain_verified: boolean;    // 是否链上注册
    
    // === 新增: 元数据 ===
    tags: string[];                // 细粒度标签
    last_updated: string;          // ISO 时间戳
}

// RF06: Removed unused type guards (isValidOrder, isValidSkill)
// If runtime validation is needed in the future, use zod or similar schema validation library
