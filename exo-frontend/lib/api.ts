// P3B-01: 数据获取函数
// RF02: Mock 逻辑已解耦到 mock-service.ts

import type { Order, Skill } from './mock-data';
import { mockAdapter } from './mock-service';

/**
 * 获取订单列表
 */
export async function fetchOrders(): Promise<Order[]> {
    return mockAdapter.fetchOrders();
}

/**
 * 获取技能列表
 */
export async function fetchSkills(): Promise<Skill[]> {
    return mockAdapter.fetchSkills();
}

/**
 * 计算 KPI 指标
 */
export function calculateKPIs(orders: Order[], skills: Skill[]) {
    // Total Volume = 基于 skills 的 execution_count * price (模拟真实交易量)
    // 这样数值更直观，反映平台真实交易规模
    const totalVolumeLamports = skills.reduce((sum, skill) => {
        return sum + (skill.execution_count * skill.price_lamports);
    }, 0);
    const totalVolume = totalVolumeLamports / 1e9; // lamports to SOL

    // Active Skills = total skill count
    const activeSkills = skills.length;

    // Avg Latency = average execution time for completed orders
    const completedOrders = orders.filter(o => o.status === 'completed');
    const avgLatency = completedOrders.length > 0
        ? Math.round(completedOrders.reduce((sum, o) => sum + o.execution_time_ms, 0) / completedOrders.length)
        : 0;

    // Total Royalties = Σ(skill.total_royalties_earned) / 1e9 → SOL
    const totalRoyalties = skills.reduce((sum, skill) => sum + skill.total_royalties_earned, 0) / 1e9;

    // Success Rate = 成功订单数 / 总订单数 * 100
    const successRate = orders.length > 0
        ? Math.round((completedOrders.length / orders.length) * 100)
        : 0;

    // Unique Agents = 去重的 agent_id 数量
    const uniqueAgents = new Set(orders.map(o => o.agent_id)).size;

    return {
        totalVolume,
        activeSkills,
        avgLatency,
        totalRoyalties,
        successRate,
        uniqueAgents,
    };
}

/**
 * 计算 Agent Flow 分账金额
 * 基于 Skills 的累计交易量按比例分配
 */
export function calculateFlowAmounts(skills: Skill[]) {
    // 总交易量 (SOL)
    const totalVolumeLamports = skills.reduce((sum, skill) => {
        return sum + (skill.execution_count * skill.price_lamports);
    }, 0);
    const totalVolume = totalVolumeLamports / 1e9;
    
    // 按 Transfer Hook 规则分账: 85% Executor, 10% Creator, 5% Fee
    return {
        executor: (totalVolume * 0.85).toFixed(4),
        creator: (totalVolume * 0.10).toFixed(4),
        fee: (totalVolume * 0.05).toFixed(4),
        total: totalVolume.toFixed(2),
    };
}
