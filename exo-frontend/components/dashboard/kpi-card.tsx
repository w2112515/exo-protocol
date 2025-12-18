// P3B-04: KPICard 组件
// 设计规范: P3-FRONTEND-DESIGN.md Section 6.1 KPI Cards
'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { NumberTicker } from '@/components/ui/number-ticker';
import { cn } from '@/lib/utils';

interface KPICardProps {
    label: string;
    value: number;
    precision?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    valueClassName?: string;
}

export function KPICard({
    label,
    value,
    precision = 0,
    prefix = '',
    suffix = '',
    className,
    valueClassName,
}: KPICardProps) {
    return (
        <GlassCard
            className={cn(
                'h-32 flex flex-col justify-between',
                className
            )}
            hover
        >
            {/* Label */}
            <span className="text-muted-foreground text-xs font-mono uppercase tracking-wider">
                {label}
            </span>

            {/* Value with NumberTicker animation */}
            <NumberTicker
                value={value}
                precision={precision}
                prefix={prefix}
                suffix={suffix}
                className={cn(
                    'text-3xl font-mono font-bold',
                    'text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500',
                    valueClassName
                )}
            />
        </GlassCard>
    );
}
