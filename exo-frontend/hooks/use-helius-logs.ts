/**
 * Helius WebSocket Hook
 *
 * 使用 Helius WebSocket API 实时订阅链上事件
 *
 * @example
 * ```tsx
 * const { logs, status, error } = useHeliusLogs({
 *   programId: 'ExoC...',
 *   commitment: 'confirmed'
 * });
 * ```
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface LogMessage {
    signature: string;
    logs: string[];
    timestamp: Date;
    slot?: number;
}

export interface UseHeliusLogsOptions {
    /** Program ID to subscribe to */
    programId?: string;
    /** Commitment level */
    commitment?: 'processed' | 'confirmed' | 'finalized';
    /** Max logs to keep in memory */
    maxLogs?: number;
    /** Enable connection (default: true) */
    enabled?: boolean;
}

export interface UseHeliusLogsReturn {
    /** Log messages received */
    logs: LogMessage[];
    /** Connection status */
    status: ConnectionStatus;
    /** Error message if any */
    error: string | null;
    /** Manually reconnect */
    reconnect: () => void;
    /** Clear all logs */
    clearLogs: () => void;
}

// ============================================================================
// Constants
// ============================================================================
import { HELIUS_WS_URL, WS_RECONNECT_DELAY, WS_MAX_RECONNECT_ATTEMPTS } from '@/lib/constants';

// ============================================================================
// Hook
// ============================================================================

export function useHeliusLogs(options: UseHeliusLogsOptions = {}): UseHeliusLogsReturn {
    const {
        programId,
        commitment = 'confirmed',
        maxLogs = 100,
        enabled = true,
    } = options;

    const [logs, setLogs] = useState<LogMessage[]>([]);
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Get API key from environment
    const apiKey = typeof window !== 'undefined'
        ? process.env.NEXT_PUBLIC_HELIUS_API_KEY
        : null;

    const connect = useCallback(() => {
        // Skip if not enabled or no API key
        if (!enabled) {
            setStatus('disconnected');
            return;
        }

        if (!apiKey) {
            setError('NEXT_PUBLIC_HELIUS_API_KEY not configured');
            setStatus('error');
            return;
        }

        // Close existing connection
        if (wsRef.current) {
            wsRef.current.close();
        }

        setStatus('connecting');
        setError(null);

        try {
            const ws = new WebSocket(`${HELIUS_WS_URL}?api-key=${apiKey}`);
            wsRef.current = ws;

            ws.onopen = () => {
                setStatus('connected');
                reconnectAttemptsRef.current = 0;

                // Subscribe to program logs
                const subscribeMessage = {
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'logsSubscribe',
                    params: [
                        programId
                            ? { mentions: [programId] }
                            : 'all',
                        { commitment }
                    ]
                };

                ws.send(JSON.stringify(subscribeMessage));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Handle subscription confirmation
                    if (data.result !== undefined && !data.method) {
                        console.log('[Helius] Subscription confirmed, ID:', data.result);
                        return;
                    }

                    // Handle log notification
                    if (data.method === 'logsNotification') {
                        const result = data.params?.result;
                        if (result?.value?.logs) {
                            const newLog: LogMessage = {
                                signature: result.value.signature || 'unknown',
                                logs: result.value.logs,
                                timestamp: new Date(),
                                slot: result.context?.slot,
                            };

                            setLogs(prev => {
                                const updated = [newLog, ...prev];
                                return updated.slice(0, maxLogs);
                            });
                        }
                    }
                } catch (parseError) {
                    console.error('[Helius] Failed to parse message:', parseError);
                }
            };

            ws.onerror = (event) => {
                console.error('[Helius] WebSocket error:', event);
                setError('WebSocket connection error');
                setStatus('error');
            };

            ws.onclose = (event) => {
                console.log('[Helius] WebSocket closed:', event.code, event.reason);
                setStatus('disconnected');

                // Auto-reconnect if not intentionally closed
                if (enabled && event.code !== 1000) {
                    if (reconnectAttemptsRef.current < WS_MAX_RECONNECT_ATTEMPTS) {
                        reconnectAttemptsRef.current++;
                        console.log(`[Helius] Reconnecting in ${WS_RECONNECT_DELAY}ms (attempt ${reconnectAttemptsRef.current})`);
                        reconnectTimeoutRef.current = setTimeout(connect, WS_RECONNECT_DELAY);
                    } else {
                        setError('Max reconnection attempts reached');
                        setStatus('error');
                    }
                }
            };

        } catch (err) {
            console.error('[Helius] Failed to create WebSocket:', err);
            setError((err as Error).message);
            setStatus('error');
        }
    }, [enabled, apiKey, programId, commitment, maxLogs]);

    const reconnect = useCallback(() => {
        reconnectAttemptsRef.current = 0;
        connect();
    }, [connect]);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    // Connect on mount / option changes
    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close(1000, 'Component unmounted');
            }
        };
    }, [connect]);

    return {
        logs,
        status,
        error,
        reconnect,
        clearLogs,
    };
}
