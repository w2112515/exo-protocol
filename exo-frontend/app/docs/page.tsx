"use client";

import { BookOpen, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/header";

export default function DocsPage() {
    return (
        <>
            <Header />
            <main className="min-h-screen bg-black text-white pt-20">
                <div className="max-w-4xl mx-auto px-6 py-20 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="h-16 w-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                            <BookOpen className="w-8 h-8 text-cyan-400" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold font-mono mb-4">Documentation</h1>
                    <p className="text-white/50 mb-8 max-w-lg mx-auto">
                        Comprehensive documentation for Exo Protocol is being prepared. Check out our GitHub for the latest updates.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                        <a
                            href="https://github.com/exo-protocol"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-sm text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            GitHub
                        </a>
                    </div>
                </div>
            </main>
        </>
    );
}
