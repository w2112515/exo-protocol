"use client";

import { useState, useMemo } from "react";
import { Terminal, Store, Filter } from "lucide-react";
import { Header } from "@/components/layout/header";
import { SkillBlinkCard } from "@/components/blinks/skill-blink-card";
import { SkillCardSkeleton } from "@/components/blinks/skill-card-skeleton";
import { useSkills } from "@/hooks/use-skills";

const CATEGORIES = [
    { id: "all", label: "All Skills" },
    { id: "dev-tools", label: "Dev Tools" },
    { id: "nlp", label: "NLP" },
    { id: "analytics", label: "Analytics" },
    { id: "vision", label: "Vision" },
    { id: "data", label: "Data" },
    { id: "business", label: "Business" },
];

export default function SkillsPage() {
    const { data: skills = [], isLoading } = useSkills();
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [visibleCount, setVisibleCount] = useState(12);

    const filteredSkills = useMemo(() => {
        if (selectedCategory === "all") return skills;
        return skills.filter((skill) => skill.category === selectedCategory);
    }, [skills, selectedCategory]);

    const visibleSkills = useMemo(() => {
        return filteredSkills.slice(0, visibleCount);
    }, [filteredSkills, visibleCount]);

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 12);
    };

    const categoryStats = useMemo(() => {
        const stats: Record<string, number> = { all: skills.length };
        skills.forEach((skill) => {
            stats[skill.category] = (stats[skill.category] || 0) + 1;
        });
        return stats;
    }, [skills]);

    return (
        <>
            <Header />
            <main className="min-h-screen bg-black text-white pt-16">
                {/* Header Section */}
                <div className="border-b border-white/10 bg-black/60 backdrop-blur-sm sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                <Store className="w-5 h-5 text-purple-400" />
                            </div>
                            <h1 className="text-2xl font-bold font-mono tracking-tight">
                                Skills Marketplace
                            </h1>
                        </div>
                        <p className="text-white/50 text-sm max-w-2xl">
                            Browse and purchase AI agent skills directly on Solana. Each skill is a monetizable capability
                            with built-in royalty distribution via Transfer Hooks.
                        </p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="border-b border-white/5 bg-black/40">
                    <div className="max-w-7xl mx-auto px-6 py-3">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            <Filter className="w-4 h-4 text-white/30 flex-shrink-0" />
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setSelectedCategory(cat.id);
                                        setVisibleCount(12);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                                        selectedCategory === cat.id
                                            ? "bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                                            : "bg-white/5 border border-white/10 text-white/70 font-medium hover:bg-white/10 hover:text-white hover:border-white/20"
                                    }`}
                                >
                                    {cat.label}
                                    {categoryStats[cat.id] !== undefined && (
                                        <span className="ml-1.5 text-white/30">({categoryStats[cat.id]})</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <SkillCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : filteredSkills.length === 0 ? (
                        <div className="flex items-center justify-center py-20">
                            <p className="text-white/40 font-mono text-sm">No skills in this category</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats Bar */}
                            <div className="flex items-center gap-6 mb-6 text-xs text-white/40 font-mono">
                                <span>{filteredSkills.length} skills available</span>
                                <span className="text-white/20">|</span>
                                <span>
                                    Avg Success Rate:{" "}
                                    {(filteredSkills.reduce((acc, s) => acc + s.success_rate, 0) / filteredSkills.length * 100).toFixed(1)}%
                                </span>
                                <span className="text-white/20">|</span>
                                <span>
                                    Total Executions:{" "}
                                    {filteredSkills.reduce((acc, s) => acc + s.execution_count, 0).toLocaleString()}
                                </span>
                            </div>

                            {/* Skills Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {visibleSkills.map((skill) => (
                                    <SkillBlinkCard key={skill.skill_id} skill={skill} />
                                ))}
                            </div>

                            {/* Load More Button */}
                            {visibleCount < filteredSkills.length && (
                                <div className="mt-12 flex justify-center">
                                    <button
                                        onClick={handleLoadMore}
                                        className="px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white/70 font-mono text-sm hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                                    >
                                        <span>Load More Skills</span>
                                        <span className="px-1.5 py-0.5 rounded bg-black/40 text-xs text-white/40">
                                            {filteredSkills.length - visibleCount} remaining
                                        </span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Info */}
                <div className="border-t border-white/5 mt-12">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <p className="text-xs text-white/30 font-mono">
                            Skills are on-chain capabilities that AI agents can purchase and execute.
                            10% of each transaction is distributed as royalties to skill creators via Solana Transfer Hooks.
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}
