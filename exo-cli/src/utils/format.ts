/**
 * 格式化工具
 */

import { LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * 格式化 lamports 为 SOL 显示
 */
export function formatLamports(lamports: number): string {
    const sol = lamports / LAMPORTS_PER_SOL;
    if (sol >= 1) {
        return `${sol.toFixed(2)} SOL`;
    } else if (sol >= 0.001) {
        return `${sol.toFixed(4)} SOL`;
    } else {
        return `${lamports.toLocaleString()} lamports`;
    }
}

/**
 * 缩短地址显示
 */
export function shortenAddress(address: string, chars = 4): string {
    if (address.length <= chars * 2 + 3) {
        return address;
    }
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * 格式化时间戳
 */
export function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    if (diffMs < 0) {
        // Past
        const absDiff = Math.abs(diffMs);
        if (absDiff < 60000) {
            return 'just now';
        } else if (absDiff < 3600000) {
            return `${Math.floor(absDiff / 60000)} minutes ago`;
        } else if (absDiff < 86400000) {
            return `${Math.floor(absDiff / 3600000)} hours ago`;
        } else {
            return date.toLocaleDateString();
        }
    } else {
        // Future
        if (diffMs < 60000) {
            return 'in less than a minute';
        } else if (diffMs < 3600000) {
            return `in ${Math.floor(diffMs / 60000)} minutes`;
        } else if (diffMs < 86400000) {
            return `in ${Math.floor(diffMs / 3600000)} hours`;
        } else {
            return date.toLocaleDateString();
        }
    }
}

/**
 * 格式化状态徽章
 */
export function formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
        'active': '● Active',
        'pending': '○ Pending',
        'funded': '● Funded',
        'completed': '✓ Completed',
        'cancelled': '✗ Cancelled',
        'deprecated': '⊘ Deprecated',
    };

    return statusMap[status.toLowerCase()] || status;
}
