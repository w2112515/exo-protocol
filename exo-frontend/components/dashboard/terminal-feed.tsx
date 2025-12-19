// P3B-02: TerminalFeed 终端日志组件
// 设计规范: P3-FRONTEND-DESIGN.md Section 6.1 Live Transactions
// P4-05: Helius WebSocket 实时日志集成
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHeliusLogs, type ConnectionStatus, type LogMessage } from '@/hooks/use-helius-logs';
import type { Order } from '@/lib/mock-data';
import { LogParser, type ChainEvent, EventType } from '@/lib/log-parser';

interface TerminalFeedProps {
    orders: Order[];
    className?: string;
    /** Enable Helius WebSocket (requires NEXT_PUBLIC_HELIUS_API_KEY) */
    enableWebSocket?: boolean;
    /** Program ID to subscribe to */
    programId?: string;
    /** Callback when alert state changes */
    onAlertChange?: (isAlert: boolean) => void;
}

// 状态颜色映射 (Terminal Minimalism 设计)
const statusColors = {
    completed: 'text-success', // --color-success (#14F195)
    failed: 'text-red-500',
    timeout: 'text-yellow-500',
} as const;

// 状态显示文本
const statusLabels = {
    completed: 'Executed',
    failed: 'Failed',
    timeout: 'Timeout',
} as const;

// 连接状态指示器样式
const connectionStatusStyles: Record<ConnectionStatus, { dot: string; label: string }> = {
    connected: { dot: 'bg-green-500', label: 'Live' },
    connecting: { dot: 'bg-yellow-500 animate-pulse', label: 'Connecting...' },
    disconnected: { dot: 'bg-gray-500', label: 'Offline' },
    error: { dot: 'bg-red-500', label: 'Error' },
};

// 格式化时间戳
function formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

// 格式化 Order ID (显示前8位)
function formatOrderId(orderId: string): string {
    const id = orderId.replace('order-', '');
    return `Order #${id.slice(0, 8)}`;
}

// 格式化签名 (显示前8位...后4位)
function formatSignature(signature: string): string {
    if (signature.length <= 12) return signature;
    return `${signature.slice(0, 8)}...${signature.slice(-4)}`;
}

export function TerminalFeed({
    orders,
    className,
    enableWebSocket = true,
    programId,
    onAlertChange,
}: TerminalFeedProps) {
    const [showLiveLogs, setShowLiveLogs] = useState(false);

    // Helius WebSocket hook
    const { logs, status, error, reconnect, clearLogs } = useHeliusLogs({
        programId,
        enabled: enableWebSocket && showLiveLogs,
        commitment: 'confirmed',
        maxLogs: 50,
    });

    // 检查是否有 API key 配置
    const hasApiKey = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_HELIUS_API_KEY;

    // Parser helper: Parse visible logs
    // We parse them on the fly for rendering. For optimal performance with huge lists, we might memoize,
    // but for <50 items, this is fine.
    const parsedLogs = logs.map(log => {
        const parsed = LogParser.parse(
            log.signature,
            log.logs,
            log.slot,
            log.timestamp
        );
        return {
            original: log,
            parsed: parsed
        };
    });

    // 合并 Mock 数据和实时日志 (Mock data uses Order interface)
    const sortedOrders = [...orders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const statusStyle = connectionStatusStyles[status];

    // Helper to get semantic color/label for parsed event
    const getEventDisplay = (parsed: ChainEvent | null, original: LogMessage) => {
        if (!parsed) {
            return {
                label: 'Unknown',
                color: 'text-gray-400',
                details: formatSignature(original.signature)
            };
        }

        switch (parsed.eventType) {
            case EventType.SKILL_REGISTERED:
            case EventType.SKILL_UPDATED:
            case EventType.AGENT_CREATED:
            case EventType.AGENT_UPDATED:
            case EventType.ESCROW_CREATED:
            case EventType.ESCROW_FUNDED:
            case EventType.ESCROW_RELEASED:
            case EventType.HOOK_INITIALIZED:
            case EventType.HOOK_CONFIG_UPDATED:
                return {
                    label: parsed.eventType.replace(/_/g, ' ').toUpperCase(),
                    color: 'text-success', // Green
                    details: parsed.programId ? `Prog: ${parsed.programId.slice(0, 4)}..` : formatSignature(parsed.signature)
                };
            case EventType.SKILL_DEPRECATED:
            case EventType.AGENT_CLOSED:
            case EventType.ESCROW_CANCELLED:
                return {
                    label: parsed.eventType.replace(/_/g, ' ').toUpperCase(),
                    color: 'text-yellow-500', // Warning/Closed
                    details: formatSignature(parsed.signature)
                };
            case EventType.ESCROW_DISPUTED:
                return {
                    label: 'DISPUTED',
                    color: 'text-red-500', // Critical
                    details: formatSignature(parsed.signature)
                };
            case EventType.TRANSFER_HOOKED:
                return {
                    label: 'TRANSFER HOOK',
                    color: 'text-cyan-400',
                    details: parsed.data?.fee_bps ? `Fee: ${parsed.data.fee_bps}bps` : formatSignature(parsed.signature)
                };
            default:
                return {
                    label: 'INTERACTION',
                    color: 'text-primary',
                    details: formatSignature(parsed.signature)
                };
        }
    };

    // 检测是否处于 Alert 模式 (Disputed / Challenge)
    const [isAlertMode, setIsAlertMode] = useState(false);

    // CR04: Use ref to store callback, avoiding stale closure and dependency issues
    const onAlertChangeRef = useRef(onAlertChange);
    useEffect(() => {
        onAlertChangeRef.current = onAlertChange;
    }, [onAlertChange]);

    // Stable callback for alert changes
    const triggerAlert = useCallback((alert: boolean) => {
        setIsAlertMode(alert);
        if (alert) {
            document.body.setAttribute('data-alert', 'true');
        } else {
            document.body.removeAttribute('data-alert');
        }
        onAlertChangeRef.current?.(alert);
    }, []);

    useEffect(() => {
        if (!showLiveLogs) return;

        // 检查是否有 Disputed 事件 (check logs directly, not parsedLogs to avoid recompute)
        const hasDispute = logs.some(log => 
            log.logs.some(l => l.includes('Disputed') || l.includes('DISPUTE'))
        );

        if (hasDispute && !isAlertMode) {
            triggerAlert(true);
        }
    }, [logs, showLiveLogs, isAlertMode, triggerAlert]);

    return (
        <div className={cn(
            'relative font-mono text-xs transition-all duration-500 border border-transparent rounded-lg',
            isAlertMode && 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] bg-red-950/10',
            className
        )}>
            {/* 顶部工具栏 */}
            <div className="flex items-center justify-between mb-2 px-2 text-muted-foreground">
                {/* 连接状态指示器 */}
                <div className="flex items-center gap-2">
                    <div className={cn(
                        'w-2 h-2 rounded-full transition-colors duration-300', 
                        isAlertMode ? 'bg-red-500 animate-ping' : statusStyle.dot
                    )} />
                    <span className="text-xs">
                        {showLiveLogs && hasApiKey ? statusStyle.label : 'Mock Data'}
                    </span>
                    {error && (
                        <span className="text-red-400 text-xs ml-2" title={error}>
                            ⚠️
                        </span>
                    )}
                </div>

                {/* 切换按钮 */}
                <div className="flex items-center gap-2">
                    {/* Demo Alert Button - 用于视频演示 */}
                    <button
                        onClick={() => triggerAlert(!isAlertMode)}
                        className={cn(
                            'px-2 py-0.5 rounded text-xs transition-colors',
                            isAlertMode
                                ? 'bg-red-500/30 text-red-400 animate-pulse'
                                : 'bg-muted/50 hover:bg-red-500/20 hover:text-red-400'
                        )}
                        title="Demo: Toggle Red Alert"
                    >
                        {isAlertMode ? '🚨 ALERT' : '⚠️ Demo'}
                    </button>
                    {hasApiKey && (
                        <button
                            onClick={() => setShowLiveLogs(!showLiveLogs)}
                            className={cn(
                                'px-2 py-0.5 rounded text-xs transition-colors',
                                showLiveLogs
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-muted/50 hover:bg-muted'
                            )}
                        >
                            {showLiveLogs ? '🔴 Live' : '📋 Mock'}
                        </button>
                    )}
                    {showLiveLogs && status === 'error' && (
                        <button
                            onClick={reconnect}
                            className="px-2 py-0.5 rounded text-xs bg-muted/50 hover:bg-muted"
                        >
                            Reconnect
                        </button>
                    )}
                    {showLiveLogs && logs.length > 0 && (
                        <button
                            onClick={clearLogs}
                            className="px-2 py-0.5 rounded text-xs bg-muted/50 hover:bg-muted"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* 扫描线动画叠加层 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="scan-line absolute w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            </div>

            {/* 日志列表 */}
            <div className="space-y-1 relative">
                {showLiveLogs && hasApiKey ? (
                    // 实时日志模式
                    logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <span className="font-mono text-sm">
                                {status === 'connected' ? 'Waiting for transactions...' : 'Connecting to Helius...'}
                            </span>
                            {status === 'connected' && (
                                <span className="text-xs mt-1 opacity-60">
                                    Subscribed to {programId ? `program ${programId.slice(0, 8)}...` : 'all transactions'}
                                </span>
                            )}
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {parsedLogs.map((item, index) => {
                                const { parsed, original } = item;
                                const display = getEventDisplay(parsed, original);

                                return (
                                    <motion.div
                                        key={`${original.signature}-${index}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.3, delay: index * 0.02 }}
                                        className={cn(
                                            'flex justify-between items-center p-2 rounded',
                                            'hover:bg-white/5 cursor-default',
                                            'border-l-2 border-transparent hover:border-primary',
                                            'transition-all duration-200 group'
                                        )}
                                    >
                                        {/* 时间戳 */}
                                        <span className="text-muted-foreground w-20 shrink-0">
                                            {formatTime(original.timestamp)}
                                        </span>

                                        {/* Main Event Label */}
                                        <span className={cn(
                                            "flex-1 md:flex-none md:w-40 truncate px-2 font-bold",
                                            display.color
                                        )}>
                                            {display.label}
                                        </span>

                                        {/* Details / Signature */}
                                        <span className="text-muted-foreground flex-1 truncate px-2 text-xs hidden md:block">
                                            {display.details}
                                        </span>

                                        {/* Slot */}
                                        <span className="text-muted-foreground w-16 text-right text-xs">
                                            {original.slot || '—'}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )
                ) : (
                    // Mock 数据模式
                    sortedOrders.length === 0 ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <span className="font-mono text-sm">No transactions yet</span>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {sortedOrders.map((order, index) => (
                                <motion.div
                                    key={order.order_id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3, delay: index * 0.02 }}
                                    className={cn(
                                        'flex justify-between items-center p-2 rounded',
                                        'hover:bg-white/5 cursor-default',
                                        'border-l-2 border-transparent hover:border-primary',
                                        'transition-all duration-200 group'
                                    )}
                                >
                                    {/* 时间戳 */}
                                    <span className="text-muted-foreground w-20 shrink-0">
                                        {formatTime(order.created_at)}
                                    </span>

                                    {/* Order ID (cyan-400 高亮) */}
                                    <span className="text-cyan-400 group-hover:text-cyan-300 flex-1 truncate px-2">
                                        {formatOrderId(order.order_id)}
                                    </span>

                                    {/* 状态 (colored by status) */}
                                    <span className={cn('w-16 text-right', statusColors[order.status])}>
                                        {statusLabels[order.status]}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )
                )}
            </div>

            {/* 底部淡出遮罩 */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            {/* RF04: scan-line animation moved to globals.css */}
        </div>
    );
}

