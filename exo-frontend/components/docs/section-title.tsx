"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
    number: string;
    title: string;
    subtitle?: string;
    className?: string;
}

/**
 * SectionTitle component for documentation pages.
 * Features a numbered prefix, gradient text title, and a decorative horizontal line.
 */
export const SectionTitle: React.FC<SectionTitleProps> = ({
    number,
    title,
    subtitle,
    className,
}) => {
    return (
        <div className={cn("group flex flex-col gap-2 py-8", className)}>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    {/* Numbered Prefix */}
                    <span className="font-mono text-sm font-medium tracking-tighter text-emerald-400/60">
                        {number}
                    </span>

                    {/* Title with Gradient */}
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        <span className="text-gradient">{title}</span>
                    </h2>
                </div>

                {/* Decorative Line with Gradient */}
                <div className="relative h-[1px] flex-1 bg-gradient-to-r from-border via-border/40 to-transparent">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </div>
            </div>
            {subtitle && (
                <p className="text-sm text-white/40 ml-[2.5rem] tracking-wide">{subtitle}</p>
            )}
        </div>
    );
};
