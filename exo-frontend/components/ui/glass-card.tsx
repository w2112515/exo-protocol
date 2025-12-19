import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    hover?: boolean;
}

export function GlassCard({ className, hover, children, ...props }: GlassCardProps) {
    return (
        <div
            className={cn(
                "glass-card p-6", // rounded-lg included in common usage or here. I'll add rounded-lg here.
                "rounded-xl",
                hover && "transition-all duration-300 hover:bg-white/5 hover:border-white/15 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

// RF07: displayName for React DevTools
GlassCard.displayName = "GlassCard";
