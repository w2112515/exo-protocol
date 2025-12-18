// P3B-04: NumberTicker 数字滚动动画组件
// 设计规范: P3-FRONTEND-DESIGN.md Section 8.2 Number Ticker
// 使用 Framer Motion useSpring (禁止 setInterval)
'use client';

import { useEffect, useRef } from 'react';
import { useSpring, useTransform, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NumberTickerProps {
    value: number;
    precision?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    duration?: number;
}

export function NumberTicker({
    value,
    precision = 0,
    prefix = '',
    suffix = '',
    className,
    duration = 1.5,
}: NumberTickerProps) {
    const ref = useRef<HTMLSpanElement>(null);

    // Framer Motion spring animation
    // Convert duration to stiffness: shorter duration = higher stiffness
    const stiffness = Math.max(50, 200 / duration);
    const spring = useSpring(0, {
        mass: 1,
        stiffness,
        damping: 15,
    });

    // Transform to formatted number
    const display = useTransform(spring, (current) => {
        return current.toFixed(precision);
    });

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    return (
        <span
            className={cn(
                'font-mono font-bold tabular-nums',
                className
            )}
        >
            {prefix}
            <motion.span ref={ref}>{display}</motion.span>
            {suffix}
        </span>
    );
}
