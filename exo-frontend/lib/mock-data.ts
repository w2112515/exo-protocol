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
}

export interface Skill {
    skill_id: string;
    name: string;
    version: string;
    category: string;
    price_lamports: number;
    execution_count: number;
    success_rate: number;
}

/**
 * @internal Type guard for runtime validation of Order objects.
 * Reserved for future use in API layer validation.
 */
export function isValidOrder(data: unknown): data is Order {
    if (typeof data !== 'object' || data === null) return false;
    const order = data as Record<string, unknown>;
    return (
        typeof order.order_id === 'string' &&
        typeof order.skill_id === 'string' &&
        ['completed', 'failed', 'timeout'].includes(order.status as string) &&
        typeof order.execution_time_ms === 'number' &&
        typeof order.created_at === 'string' &&
        typeof order.result_hash === 'string' &&
        typeof order.agent_id === 'string'
    );
}

/**
 * @internal Type guard for runtime validation of Skill objects.
 * Reserved for future use in API layer validation.
 */
export function isValidSkill(data: unknown): data is Skill {
    if (typeof data !== 'object' || data === null) return false;
    const skill = data as Record<string, unknown>;
    return (
        typeof skill.skill_id === 'string' &&
        typeof skill.name === 'string' &&
        typeof skill.version === 'string' &&
        typeof skill.category === 'string' &&
        typeof skill.price_lamports === 'number' &&
        typeof skill.execution_count === 'number' &&
        typeof skill.success_rate === 'number'
    );
}
