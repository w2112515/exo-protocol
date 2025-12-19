"use client";

import { Header } from "@/components/layout/header";
import { HeroSection } from "@/components/docs/hero-section";
import { QuickStartSection } from "@/components/docs/quick-start-section";
import { ArchitectureDiagram } from "@/components/docs/architecture-diagram";
import { TerminalCodeBlock } from "@/components/docs/terminal-code-block";
import { RoadmapTimeline } from "@/components/docs/roadmap-timeline";
import { SectionTitle } from "@/components/docs/section-title";

const SKILL_SPEC = `interface Skill {
  skill_id: string;      // Unique identifier
  name: string;          // Display name
  version: string;       // Semantic version
  category: string;      // dev-tools | nlp | analytics | vision | data | business
  price_lamports: number; // Price in lamports
  execution_count: number; // Total executions
  success_rate: number;  // 0-1 success ratio
}`;

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Header />

            <main className="pt-16">
                {/* 00 - HERO */}
                <HeroSection />

                {/* 01 - QUICK START */}
                <QuickStartSection />

                {/* 02 - ARCHITECTURE */}
                <section className="py-24 px-6 border-t border-white/5 bg-black/20">
                    <div className="max-w-5xl mx-auto">
                        <SectionTitle
                            number="02"
                            title="Architecture"
                            subtitle="The decentralised infrastructure for autonomous AI execution"
                        />
                        <div className="mt-12 group">
                            <ArchitectureDiagram />
                        </div>
                    </div>
                </section>

                {/* 03 - API REFERENCE */}
                <section className="py-24 px-6 border-t border-white/5 bg-black/40">
                    <div className="max-w-5xl mx-auto">
                        <SectionTitle
                            number="03"
                            title="API Reference"
                            subtitle="Connect your agents to the Exo ecosystem via standard interfaces"
                        />

                        <div className="grid grid-cols-1 gap-12 mt-12">
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    Skill Schema
                                </h3>
                                <TerminalCodeBlock
                                    code={SKILL_SPEC}
                                    language="typescript"
                                    filename="interfaces/skill.ts"
                                />
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    Solana Actions
                                </h3>
                                <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                                    <p className="text-white/60 mb-6 leading-relaxed">
                                        Exo Protocol skills are accessible via <span className="text-white font-semibold">Solana Actions (Blinks)</span>.
                                        Any skill can be invoked by sending a POST request with the user's wallet address to obtain a signed transaction.
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        <a
                                            href="https://solana.com/docs/advanced/actions"
                                            target="_blank"
                                            className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-mono text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                        >
                                            SPECIFICATION {"->"}
                                        </a>
                                        <a
                                            href="https://dial.to"
                                            target="_blank"
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-white/40 hover:bg-white/10 transition-colors"
                                        >
                                            TRY ON DIAL.TO
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 04 - ROADMAP */}
                <RoadmapTimeline />

                {/* FOOTER */}
                <footer className="py-12 border-t border-white/5 bg-black">
                    <div className="max-w-5xl mx-auto px-6 text-center">
                        <p className="text-xs text-white/20 font-mono tracking-widest uppercase">
                            Exo Protocol — Built for the Solana Colosseum Hackathon
                        </p>
                    </div>
                </footer>
            </main>
        </div>
    );
}
