"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline";
}

export function MagneticButton({ children, className, variant = "primary", onClick, ...props }: MagneticButtonProps) {
    const ref = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current!.getBoundingClientRect();
        const x = clientX - (left + width / 2);
        const y = clientY - (top + height / 2);
        setPosition({ x, y });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    const variants = {
        primary: "bg-primary text-primary-foreground hover:shadow-[0_0_20px_var(--primary)] border border-transparent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent",
        outline: "bg-transparent border border-border text-foreground hover:bg-accent hover:text-accent-foreground",
    };

    return (
        <motion.button
            ref={ref}
            className={cn(
                "relative inline-flex items-center justify-center rounded-md px-6 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                variants[variant],
                className
            )}
            animate={{ x: position.x * 0.2, y: position.y * 0.2 }} // Moderate magnetic strength
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            {...props as any}
        >
            {children}
        </motion.button>
    );
}
