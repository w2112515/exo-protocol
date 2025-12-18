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
    return response.json();
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

    return {
        totalVolume,
        activeSkills,
        avgLatency,
    };
}
