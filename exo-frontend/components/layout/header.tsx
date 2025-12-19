"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamically import WalletMultiButton to avoid SSR issues
const WalletMultiButton = dynamic(
    () =>
        import("@solana/wallet-adapter-react-ui").then(
            (mod) => mod.WalletMultiButton
        ),
    { ssr: false }
);

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-white font-mono tracking-tighter">
                        Exo Protocol
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
                    <Link href="/skills" className="hover:text-foreground transition-colors">Skills</Link>
                    <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
                </nav>

                <div className="flex items-center gap-4">
                    <div className="wallet-adapter-button-trigger hidden md:block">
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

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-border bg-black/95 backdrop-blur-xl absolute top-16 left-0 right-0 p-4 animate-in slide-in-from-top-2 fade-in-0 duration-200 shadow-2xl">
                    <nav className="flex flex-col space-y-4">
                        <Link 
                            href="/dashboard" 
                            className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors py-2 border-b border-white/5"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Dashboard
                        </Link>
                        <Link 
                            href="/skills" 
                            className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors py-2 border-b border-white/5"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Skills
                        </Link>
                        <Link 
                            href="/docs" 
                            className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors py-2 border-b border-white/5"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Docs
                        </Link>
                        <div className="pt-2">
                            <WalletMultiButton
                                style={{
                                    width: "100%",
                                    justifyContent: "center",
                                    backgroundColor: "rgba(153, 69, 255, 0.1)",
                                    border: "1px solid rgba(153, 69, 255, 0.5)",
                                    borderRadius: "6px",
                                    color: "#9945FF",
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    height: "44px",
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                }}
                            />
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
