"use client";

import { motion } from "framer-motion";

export function HeroSection() {
    return (
        <section className="relative py-32 overflow-hidden">
            {/* 背景光晕 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                      w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative max-w-4xl mx-auto text-center px-6"
            >
                {/* 主标题 */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-4 text-white">
                    THE EXECUTION LAYER
                </h1>
                <h2 className="text-2xl md:text-3xl font-light text-white/40 tracking-widest mb-8">
                    FOR THE SILICON WORKFORCE
                </h2>

                {/* 副标题 */}
                <p className="text-lg text-white/50 mb-8 leading-relaxed max-w-2xl mx-auto">
                    Connecting intent to irreversible on-chain action.
                    <br />
                    The standard for Agent-to-Agent economic settlement.
                </p>

                {/* 统计行 */}
                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs font-mono text-white/30 mb-10">
                    <span>AVG LATENCY: 400ms</span>
                    <span className="hidden md:block w-px h-4 bg-white/10" />
                    <span>TRUST: CRYPTOGRAPHIC</span>
                    <span className="hidden md:block w-px h-4 bg-white/10" />
                    <span>SCALE: INFINITE</span>
                </div>

                {/* 技术徽章 */}
                <div className="flex items-center justify-center gap-3 flex-wrap mb-10">
                    {["Token-2022", "Transfer Hooks", "Blinks"].map((tag) => (
                        <span key={tag} className="px-3 py-1 text-xs font-mono border border-emerald-500/30 
                                        text-emerald-400 rounded-full bg-emerald-500/5">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* CTA 按钮 */}
                <button className="group relative px-8 py-3 border border-emerald-500/50 
                           hover:border-emerald-400 transition-colors bg-transparent">
                    <span className="relative z-10 font-mono text-sm tracking-wider text-emerald-400">
                        [ INITIALIZE PROTOCOL ]
                    </span>
                    <div className="absolute inset-0 bg-emerald-500/10 opacity-0 
                          group-hover:opacity-100 transition-opacity" />
                </button>
            </motion.div>
        </section>
    );
}
