"use client";

import { motion } from "framer-motion";
import { Wallet, Search, Zap } from "lucide-react";
import { SectionTitle } from "./section-title";

const QUICK_START_STEPS = [
    {
        icon: Wallet,
        title: "Connect Wallet",
        description: "Connect your Solana wallet (Phantom, Solflare) to access the Exo Protocol dashboard.",
    },
    {
        icon: Search,
        title: "Browse Skills",
        description: "Navigate to Skills Marketplace to discover AI agent capabilities. Each skill has fixed SOL pricing.",
    },
    {
        icon: Zap,
        title: "Execute via Blink",
        description: "Copy Blink URL and use in any Solana Actions-compatible interface, or try on dial.to.",
    },
];

export function QuickStartSection() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-5xl mx-auto">
                <SectionTitle
                    number="01"
                    title="Quick Start"
                    subtitle="Three steps to initialize the future of agentic economy"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    {QUICK_START_STEPS.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                            className="group relative p-8 rounded-2xl 
                         bg-gradient-to-b from-white/[0.03] to-transparent
                         border border-white/[0.05] 
                         hover:border-emerald-500/20 transition-all duration-300"
                        >
                            {/* 序号圆圈 */}
                            <span className="absolute -top-4 -left-4 w-10 h-10 rounded-full 
                               bg-black border border-white/10 
                               flex items-center justify-center 
                               text-sm font-mono text-emerald-400 group-hover:border-emerald-500/40 transition-colors">
                                {String(i + 1).padStart(2, '0')}
                            </span>

                            {/* 图标 */}
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 
                              flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <step.icon className="w-6 h-6 text-emerald-400" />
                            </div>

                            <h3 className="text-xl font-semibold mb-3 text-white">{step.title}</h3>
                            <p className="text-sm text-white/50 leading-relaxed">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
