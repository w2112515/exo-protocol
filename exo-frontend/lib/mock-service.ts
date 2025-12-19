// RF02: Mock data service - decoupled from api.ts
// Handles mock data generation and transformation

import type { Order, Skill } from './mock-data';

/**
 * Transform orders with dynamic timestamps
 * Simulates real-time transaction flow with recent timestamps
 */
export function transformOrdersWithDynamicTimestamps(orders: Order[]): Order[] {
    const now = Date.now();
    return orders.map((order, index) => ({
        ...order,
        // Reverse order: newest first (index 0)
        // Interval: ~3-8 minutes between each
        created_at: new Date(now - (index * 3 + Math.random() * 5) * 60 * 1000).toISOString(),
    }));
}

/**
 * Generate mock order ID
 */
export function generateMockOrderId(): string {
    return `order-${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Generate mock result hash
 */
export function generateMockResultHash(): string {
    return `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`;
}

/**
 * Mock data adapter interface
 * Allows switching between Mock and Real data sources
 */
export interface DataAdapter {
    fetchOrders(): Promise<Order[]>;
    fetchSkills(): Promise<Skill[]>;
}

/**
 * Mock data adapter implementation
 */
export class MockDataAdapter implements DataAdapter {
    private baseUrl: string;

    constructor(baseUrl: string = '') {
        this.baseUrl = baseUrl;
    }

    async fetchOrders(): Promise<Order[]> {
        const response = await fetch(`${this.baseUrl}/mock/mock_orders.json`);
        if (!response.ok) {
            throw new Error(`Failed to fetch orders: ${response.status}`);
        }
        const orders: Order[] = await response.json();
        return transformOrdersWithDynamicTimestamps(orders);
    }

    async fetchSkills(): Promise<Skill[]> {
        const response = await fetch(`${this.baseUrl}/mock/mock_skills.json`);
        if (!response.ok) {
            throw new Error(`Failed to fetch skills: ${response.status}`);
        }
        return response.json();
    }
}

// Default mock adapter instance
export const mockAdapter = new MockDataAdapter(process.env.NEXT_PUBLIC_API_URL || '');
