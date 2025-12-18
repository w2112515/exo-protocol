"use client";

import { useState } from "react";
import { BookOpen, Rocket, Layers, Code, ChevronDown, ChevronRight, ExternalLink, Terminal, Zap, Shield } from "lucide-react";
import { Header } from "@/components/layout/header";
import { GlassCard } from "@/components/ui/glass-card";

const DOCS_SECTIONS = [
    {
        id: "quickstart",
        title: "Quick Start",
        icon: Rocket,
        color: "green",
        content: [
            {
                title: "1. Connect Wallet",
                description: "Connect your Solana wallet (Phantom, Solflare, or any compatible wallet) to access the Exo Protocol dashboard.",
            },
            {
                title: "2. Browse Skills",
                description: "Navigate to the Skills Marketplace to discover available AI agent capabilities. Each skill has a fixed price in SOL.",
            },
            {
                title: "3. Execute via Blinks",
                description: "Copy the Blink URL for any skill and use it in any Solana Actions-compatible interface, or try directly on dial.to.",
            },
        ],
    },
    {
        id: "architecture",
        title: "Architecture",
        icon: Layers,
        color: "purple",
        content: [
            {
                title: "On-Chain Components",
                description: "exo_core (Skill Registry, Order Escrow) + exo_hooks (Transfer Hook for 10% royalty distribution). Built on Anchor 0.31.x with Token-2022.",
            },
            {
                title: "Off-Chain Runtime",
                description: "Python-based Skill Runtime Engine (SRE) executes skills in isolated Docker containers with resource limits and sandboxed I/O.",
            },
            {
                title: "Frontend",
                description: "Next.js 15 App Router with TailwindCSS, shadcn/ui, and React Flow for visualization. Real-time data via TanStack Query.",
            },
        ],
    },
    {
        id: "api",
        title: "API Reference",
        icon: Code,
        color: "cyan",
        content: [
            {
                title: "Actions API",
                description: "GET /api/actions/skill/{skill_id} - Returns ActionGetResponse with skill metadata. POST with { account } to create transaction.",
            },
            {
                title: "Skills API",
                description: "GET /api/skills - List all registered skills with pricing and stats. Returns array of Skill objects.",
            },
            {
                title: "Orders API",
                description: "GET /api/orders - Fetch execution history. POST to create new skill execution order.",
            },
        ],
    },
];

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
    const [expandedSection, setExpandedSection] = useState<string>("quickstart");

    const toggleSection = (sectionId: string) => {
        setExpandedSection(expandedSection === sectionId ? "" : sectionId);
    };

    const getColorClasses = (color: string, type: "bg" | "border" | "text") => {
        const colors: Record<string, Record<string, string>> = {
            green: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" },
            purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
            cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400" },
        };
        return colors[color]?.[type] || "";
    };

    return (
        <>
            <Header />
            <main className="min-h-screen bg-black text-white pt-16">
                {/* Header Section */}
                <div className="border-b border-white/10 bg-black/60 backdrop-blur-sm">
                    <div className="max-w-5xl mx-auto px-6 py-8">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                <BookOpen className="w-5 h-5 text-cyan-400" />
                            </div>
                            <h1 className="text-2xl font-bold font-mono tracking-tight">
                                Documentation
                            </h1>
                        </div>
                        <p className="text-white/50 text-sm max-w-2xl">
                            Exo Protocol enables skill-native PayFi for the AI agent economy. 
                            Learn how to integrate, execute, and monetize AI capabilities on Solana.
                        </p>
                    </div>
                </div>

                {/* Key Features Banner */}
                <div className="border-b border-white/5 bg-black/40">
                    <div className="max-w-5xl mx-auto px-6 py-4">
                        <div className="flex items-center gap-6 text-xs font-mono">
                            <div className="flex items-center gap-2 text-green-400">
                                <Zap className="w-4 h-4" />
                                <span>OPOS-Native</span>
                            </div>
                            <div className="flex items-center gap-2 text-purple-400">
                                <Shield className="w-4 h-4" />
                                <span>Transfer Hooks</span>
                            </div>
                            <div className="flex items-center gap-2 text-cyan-400">
                                <Terminal className="w-4 h-4" />
                                <span>Solana Actions</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Accordion Sections */}
                        <div className="lg:col-span-2 space-y-3">
                            {DOCS_SECTIONS.map((section) => {
                                const Icon = section.icon;
                                const isExpanded = expandedSection === section.id;
                                return (
                                    <GlassCard key={section.id} className="overflow-hidden">
                                        <button
                                            onClick={() => toggleSection(section.id)}
                                            className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-lg ${getColorClasses(section.color, "bg")} flex items-center justify-center border ${getColorClasses(section.color, "border")}`}>
                                                    <Icon className={`w-4 h-4 ${getColorClasses(section.color, "text")}`} />
                                                </div>
                                                <span className="font-bold font-mono">{section.title}</span>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronDown className="w-5 h-5 text-white/40" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-white/40" />
                                            )}
                                        </button>
                                        {isExpanded && (
                                            <div className="px-4 pb-4 space-y-3">
                                                {section.content.map((item, idx) => (
                                                    <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/5">
                                                        <h4 className="text-sm font-bold text-white/90 mb-1">{item.title}</h4>
                                                        <p className="text-xs text-white/50 leading-relaxed">{item.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </GlassCard>
                                );
                            })}
                        </div>

                        {/* Sidebar - Skill Spec */}
                        <div className="space-y-4">
                            <GlassCard className="p-4">
                                <h3 className="font-bold font-mono text-sm mb-3 flex items-center gap-2">
                                    <Code className="w-4 h-4 text-yellow-400" />
                                    Skill Interface
                                </h3>
                                <pre className="text-[11px] text-white/70 bg-black/60 rounded-lg p-3 overflow-x-auto border border-white/5 font-mono">
                                    {SKILL_SPEC}
                                </pre>
                            </GlassCard>

                            <GlassCard className="p-4">
                                <h3 className="font-bold font-mono text-sm mb-3">Resources</h3>
                                <div className="space-y-2">
                                    <a
                                        href="https://github.com/exo-protocol"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors"
                                    >
                                        <span className="text-white/70">GitHub Repository</span>
                                        <ExternalLink className="w-3 h-3 text-white/40" />
                                    </a>
                                    <a
                                        href="https://solana.com/docs/advanced/actions"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors"
                                    >
                                        <span className="text-white/70">Solana Actions Spec</span>
                                        <ExternalLink className="w-3 h-3 text-white/40" />
                                    </a>
                                    <a
                                        href="https://dial.to"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors"
                                    >
                                        <span className="text-white/70">dial.to Blink Viewer</span>
                                        <ExternalLink className="w-3 h-3 text-white/40" />
                                    </a>
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-white/5 mt-12">
                    <div className="max-w-5xl mx-auto px-6 py-6">
                        <p className="text-xs text-white/30 font-mono">
                            Exo Protocol — Skill-Native PayFi for the Agent Economy. Built for Solana Colosseum Hackathon.
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}
