"use client";

import React from "react";
import { Layers, Shield, Zap, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayerProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    className?: string;
    items: string[];
}

const ArchitectureLayer: React.FC<LayerProps> = ({
    title,
    description,
    icon,
    color,
    className,
    items
}) => (
    <div className={cn(
        "flex w-full flex-col gap-3 rounded-2xl border border-white/10 p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/5",
        className
    )}>
        <div className="flex items-center gap-4">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", color)}>
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-bold tracking-tight text-white">{title}</h3>
                <p className="text-sm text-zinc-400">{description}</p>
            </div>
        </div>
        <div className="flex flex-wrap gap-2">
            {items.map((item, idx) => (
                <span key={idx} className="rounded-full border border-white/5 bg-white/5 px-3 py-1 font-mono text-xs text-zinc-400">
                    {item}
                </span>
            ))}
        </div>
    </div>
);

/**
 * ArchitectureDiagram component for documentation.
 * Visualizes the 3-layer architecture: Application, Infrastructure, and Contract.
 */
export const ArchitectureDiagram: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={cn("relative my-12 flex w-full max-w-4xl flex-col gap-6", className)}>
            {/* Connector lines (Vertical center) */}
            <div className="absolute top-12 bottom-12 left-[3.5rem] hidden w-[2px] bg-gradient-to-b from-primary/40 via-success/40 to-primary/40 md:block" />

            {/* Layer 1: Application */}
            <ArchitectureLayer
                title="Application Layer"
                description="User interfaces and integration points"
                icon={<Globe className="h-6 w-6 text-white" />}
                color="bg-primary/20"
                items={["Dashboard", "Blinks (dial.to)", "CLI Tool", "React Explorer"]}
            />

            {/* Layer 2: Infrastructure */}
            <ArchitectureLayer
                title="Infrastructure Layer"
                description="The bridge between UI and Blockchain"
                icon={<Zap className="h-6 w-6 text-white" />}
                color="bg-success/20"
                items={["Exo SDK", "SRE Runtime", "Log Parser", "Asset Metadata"]}
            />

            {/* Layer 3: Contract Layer */}
            <ArchitectureLayer
                title="Contract Layer (On-chain)"
                description="Programmable trust and escrow logic"
                icon={<Shield className="h-6 w-6 text-white" />}
                color="bg-primary/20"
                items={["Anchor Core", "Escrow Vault", "Token-2022 Hooks", "cNFT Identity"]}
                className="relative z-10"
            />

            {/* Abstract background element */}
            <div className="absolute -right-20 top-1/2 -z-10 h-64 w-64 -translate-y-1/2 rounded-full bg-primary/20 blur-[100px] opacity-20" />
        </div>
    );
};
