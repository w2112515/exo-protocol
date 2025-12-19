"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface TerminalCodeBlockProps {
    code: string;
    language?: string;
    filename?: string;
    className?: string;
}

/**
 * TerminalCodeBlock component for documentation.
 * Features macOS-style window controls, a "Copy" button, and JetBrains Mono font.
 */
export const TerminalCodeBlock: React.FC<TerminalCodeBlockProps> = ({
    code,
    language = "bash",
    filename,
    className,
}) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy!", err);
        }
    };

    return (
        <div className={cn("group relative my-6 w-full max-w-4xl overflow-hidden rounded-xl border border-white/10 bg-zinc-950/50 backdrop-blur-md", className)}>
            {/* macOS Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                    {filename && (
                        <span className="ml-2 font-mono text-xs text-zinc-400">
                            {filename}
                        </span>
                    )}
                </div>

                {/* Copy Button */}
                <button
                    onClick={copyToClipboard}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
                    title="Copy to clipboard"
                >
                    {copied ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                        <Copy className="h-4 w-4" />
                    )}
                </button>
            </div>

            {/* Code Area */}
            <div className="relative overflow-x-auto p-4 scrollbar-hide">
                <pre className="font-mono text-sm leading-relaxed text-zinc-300">
                    <code className={language ? `language-${language}` : ""}>
                        {code}
                    </code>
                </pre>
            </div>

            {/* Decorative Scan Line Overlay (Subtle) */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
    );
};
