"use client";

import { SkillBlinkCard } from "@/components/blinks/skill-blink-card";
import { SkillCardSkeleton } from "@/components/blinks/skill-card-skeleton";
import { Header } from "@/components/layout/header";
import { useSkills } from "@/hooks/use-skills";
import { Zap, Terminal } from "lucide-react";
import { useState, useMemo } from "react";

export default function BlinksPage() {
    const { data: skills = [], isLoading: loading } = useSkills();
    const [visibleCount, setVisibleCount] = useState(12);

    const visibleSkills = useMemo(() => {
        return skills.slice(0, visibleCount);
    }, [skills, visibleCount]);

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 12);
    };

    return (
        <>
            <Header />
            <main className="min-h-screen bg-black text-white pt-16">
                {/* Header Section */}
                <div className="border-b border-white/10 bg-black/60 backdrop-blur-sm sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                                <Zap className="w-5 h-5 text-yellow-400" />
                            </div>
                            <h1 className="text-2xl font-bold font-mono tracking-tight">
                                Skill Blinks
                            </h1>
                        </div>
                        <p className="text-white/50 text-sm max-w-2xl">
                            Browse available skills and copy their Blink URLs for direct execution via Solana Actions.
                            Each Blink can be shared and executed from any compatible wallet or application.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <SkillCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : skills.length === 0 ? (
                        <div className="flex items-center justify-center py-20">
                            <p className="text-white/40 font-mono text-sm">No skills available</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats Bar */}
                            <div className="flex items-center gap-6 mb-6 text-xs text-white/40 font-mono">
                                <span>{skills.length} skills available</span>
                                <span className="text-white/20">|</span>
                                <span>
                                    Avg Success Rate:{" "}
                                    {(skills.reduce((acc, s) => acc + s.success_rate, 0) / skills.length * 100).toFixed(1)}%
                                </span>
                            </div>

                            {/* Skills Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {visibleSkills.map((skill) => (
                                    <SkillBlinkCard key={skill.skill_id} skill={skill} />
                                ))}
                            </div>

                            {/* Load More Button */}
                            {visibleCount < skills.length && (
                                <div className="mt-12 flex justify-center">
                                    <button
                                        onClick={handleLoadMore}
                                        className="px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white/70 font-mono text-sm hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                                    >
                                        <span>Load More</span>
                                        <span className="px-1.5 py-0.5 rounded bg-black/40 text-xs text-white/40">
                                            {skills.length - visibleCount} remaining
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
                            Blink URLs follow Solana Actions specification. Copy a URL and paste it into any
                            Actions-compatible interface to execute the skill.
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}
