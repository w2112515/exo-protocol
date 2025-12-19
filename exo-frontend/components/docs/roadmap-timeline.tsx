"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle } from "./section-title";

const ROADMAP_DATA = [
    {
        quarter: "Q4 2024",
        status: "completed",
        title: "Protocol Genesis",
        items: [
            "Core smart contracts (exo_core)",
            "Escrow & dispute system",
            "Basic frontend dashboard",
        ],
    },
    {
        quarter: "Q2 2025",
        status: "completed",
        title: "PayFi Layer",
        items: [
            "Token-2022 Transfer Hooks",
            "TypeScript SDK (exo-sdk)",
            "Blinks integration",
            "SRE Runtime (Python)",
        ],
    },
    {
        quarter: "Q4 2025",
        status: "current",
        title: "Colosseum Hackathon",
        items: [
            "Full-stack demo platform",
            "Fraud proof simulation",
            "Skills Marketplace UI",
            "Documentation site",
        ],
    },
    {
        quarter: "Q1 2026",
        status: "upcoming",
        title: "Mainnet Launch",
        items: [
            "Mainnet deployment",
            "Token economics ($EXO)",
            "Agent staking rewards",
            "Audit & security review",
        ],
    },
    {
        quarter: "Q2 2026",
        status: "upcoming",
        title: "Ecosystem Expansion",
        items: [
            "Wormhole cross-chain",
            "Agent-to-Agent trading",
            "Enterprise partnerships",
            "Decentralized governance",
        ],
    },
];

export function RoadmapTimeline() {
    return (
        <section className="py-24 px-6 relative overflow-hidden">
            {/* 中央连接线 */}
            <div className="absolute top-0 left-12 md:left-1/2 -translate-x-1/2 w-px h-full 
                      bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent pointer-events-none" />

            <div className="max-w-4xl mx-auto">
                <SectionTitle number="04" title="Roadmap" subtitle="Building the Agent Economy" />

                <div className="mt-16 space-y-0">
                    {ROADMAP_DATA.map((phase, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="relative pl-16 md:pl-0 pb-16 last:pb-0"
                        >
                            {/* PC端连接线与布局对齐 */}
                            <div className={cn(
                                "md:flex items-start gap-12",
                                i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                            )}>

                                {/* 节点 (绝对定位在连接线上) */}
                                <div className={cn(
                                    "absolute left-0 md:left-1/2 top-1 w-11 h-11 rounded-full border-2 -translate-x-1/2 md:translate-x-[-50%]",
                                    "flex items-center justify-center transition-all z-10",
                                    phase.status === "completed" && "bg-emerald-500/20 border-emerald-500",
                                    phase.status === "current" && "bg-emerald-500 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.6)]",
                                    phase.status === "upcoming" && "bg-white/5 border-white/20",
                                )}>
                                    {phase.status === "completed" && <Check className="w-5 h-5 text-emerald-400" />}
                                    {phase.status === "current" && (
                                        <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                                    )}
                                </div>

                                {/* 内容卡片 */}
                                <div className={cn(
                                    "flex-1 p-8 rounded-2xl border transition-all",
                                    phase.status === "current"
                                        ? "bg-emerald-500/5 border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)]"
                                        : "bg-white/[0.02] border-white/[0.05]",
                                    i % 2 === 0 ? "md:mr-12" : "md:ml-12"
                                )}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-sm font-mono text-white/40">{phase.quarter}</span>
                                        {phase.status === "current" && (
                                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 
                                       text-emerald-400 text-xs font-semibold tracking-wider">
                                                NOW
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-white">{phase.title}</h3>
                                    <ul className="space-y-2">
                                        {phase.items.map((item, j) => (
                                            <li key={j} className="flex items-start gap-3 text-sm text-white/60">
                                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500/50 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* PC端占位符，保持平衡 */}
                                <div className="hidden md:block flex-1" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
