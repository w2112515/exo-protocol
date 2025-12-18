"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import WalletMultiButton to avoid SSR issues
const WalletMultiButton = dynamic(
    () =>
        import("@solana/wallet-adapter-react-ui").then(
            (mod) => mod.WalletMultiButton
        ),
    { ssr: false }
);

export function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-white font-mono tracking-tighter">
                        Exo Protocol
                    </Link>
                </div>
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
                    <Link href="/skills" className="hover:text-foreground transition-colors">Skills</Link>
                    <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
                </nav>
                <div className="wallet-adapter-button-trigger">
                    <WalletMultiButton
                        style={{
                            backgroundColor: "transparent",
                            border: "1px solid rgba(153, 69, 255, 0.5)",
                            borderRadius: "6px",
                            color: "#9945FF",
                            fontFamily: "var(--font-mono)",
                            fontSize: "12px",
                            fontWeight: 500,
                            height: "36px",
                            letterSpacing: "0.1em",
                            padding: "0 16px",
                            textTransform: "uppercase",
                        }}
                    />
                </div>
            </div>
        </header>
    );
}
