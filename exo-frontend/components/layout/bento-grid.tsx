import { cn } from "@/lib/utils";

export function BentoGrid({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 auto-rows-[minmax(180px,auto)]", className)}>
            {children}
        </div>
    );
}

// RF07: displayName for React DevTools
BentoGrid.displayName = "BentoGrid";
