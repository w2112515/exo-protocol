"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Skill } from "@/lib/mock-data";
import { Copy, Check, Zap, Terminal } from "lucide-react";

interface SkillBlinkCardProps {
    skill: Skill;
}

export function SkillBlinkCard({ skill }: SkillBlinkCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            const url = `${window.location.origin}/api/actions/skill/${skill.skill_id}`;
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    return (
        <GlassCard hover className="flex flex-col gap-4 relative overflow-hidden group border-white/5 bg-black/40 backdrop-blur-md">
            {/* Header: Icon + Identity */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20 text-green-400">
                        <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white font-mono tracking-tight">{skill.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                            <span className="px-1.5 py-0.5 rounded-full border border-white/10 bg-white/5">
                                v{skill.version}
                            </span>
                            <span>{skill.category}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-green-400 font-mono">
                        {skill.price_lamports / 1000000000} SOL
                    </span>
                    <span className="text-[10px] text-white/30 uppercase tracking-wider">Price</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase">Success Rate</span>
                    <span className="text-sm font-mono text-white/80">{(skill.success_rate * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase">Executions</span>
                    <span className="text-sm font-mono text-white/80">{skill.execution_count}</span>
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={handleCopy}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all group/btn"
            >
                {copied ? (
                    <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Blink URL Copied!</span>
                    </>
                ) : (
                    <>
                        <Zap className="w-4 h-4 text-yellow-400 group-hover/btn:text-yellow-300" />
                        <span>Copy Blink URL</span>
                        <Copy className="w-3 h-3 ml-1 opacity-50" />
                    </>
                )}
            </button>

            {/* Visual Flair */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 blur-2xl -z-10 rounded-full pointer-events-none" />
        </GlassCard>
    );
}
