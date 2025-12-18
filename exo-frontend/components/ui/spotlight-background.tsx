"use client";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function SpotlightBackground({ children, className }: { children: React.ReactNode, className?: string }) {
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div className={cn("relative min-h-screen w-full bg-background overflow-x-hidden", className)}>
            {/* Spotlight Effect */}
            <div
                className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
                style={{
                    background: position
                        ? `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.03), transparent 40%)`
                        : "transparent",
                }}
            />
            {/* Content */}
            <div className="relative z-0">{children}</div>
        </div>
    );
}
