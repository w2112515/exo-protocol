// P3B-01: 数据获取函数
// 从 public/mock/ 目录获取 mock 数据

import type { Order, Skill } from './mock-data';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * 获取订单列表
 */
export async function fetchOrders(): Promise<Order[]> {
    const response = await fetch(`${BASE_URL}/mock/mock_orders.json`);
    if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
    }
    const orders: Order[] = await response.json();

    // 动态化时间戳: 当前时间 - 随机分钟数 (0-60分钟内)
    // 模拟实时交易流，确保时间是最近的
    const now = Date.now();
    return orders.map((order, index) => ({
        ...order,
        // 倒序排列：最新的在前面 (index 0)
        // 间隔约 3-8 分钟
        created_at: new Date(now - (index * 3 + Math.random() * 5) * 60 * 1000).toISOString(),
    }));
}

/**
 * 获取技能列表
 */
export async function fetchSkills(): Promise<Skill[]> {
    const response = await fetch(`${BASE_URL}/mock/mock_skills.json`);
    if (!response.ok) {
        throw new Error(`Failed to fetch skills: ${response.status}`);
    }
    return response.json();
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
