// P3B-01: useSkills hook (TanStack Query)
'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchSkills } from '@/lib/api';
import type { Skill } from '@/lib/mock-data';

export function useSkills() {
    return useQuery<Skill[], Error>({
        queryKey: ['skills'],
        queryFn: fetchSkills,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });
}
