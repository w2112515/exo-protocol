// P3B-01: useOrders hook (TanStack Query)
'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '@/lib/api';
import type { Order } from '@/lib/mock-data';

export function useOrders() {
    return useQuery<Order[], Error>({
        queryKey: ['orders'],
        queryFn: fetchOrders,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });
}
