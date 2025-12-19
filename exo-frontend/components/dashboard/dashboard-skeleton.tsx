import { BentoGrid } from "@/components/layout/bento-grid";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
    return (
        <BentoGrid className="max-w-7xl mx-auto">
            {/* KPI Cards x 6 */}
            {[...Array(6)].map((_, i) => (
                <GlassCard key={i} className="h-32 flex flex-col justify-between col-span-1 md:col-span-2 lg:col-span-4">
                     <Skeleton className="h-3 w-24 bg-white/10" />
                     <Skeleton className="h-8 w-32 bg-white/10" />
                </GlassCard>
            ))}

            {/* Terminal Feed */}
            <GlassCard className="col-span-1 md:col-span-3 lg:col-span-5 row-span-2 min-h-[500px]">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                    <Skeleton className="h-4 w-32 bg-white/10" />
                    <Skeleton className="h-4 w-12 bg-white/10" />
                </div>
                <div className="space-y-4 mt-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="space-y-2">
                             <div className="flex gap-2">
                                <Skeleton className="h-3 w-20 bg-white/10" />
                                <Skeleton className="h-3 w-full bg-white/10" />
                             </div>
                             <Skeleton className="h-3 w-3/4 ml-22 bg-white/5" />
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Agent Flow Graph */}
            <GlassCard className="col-span-1 md:col-span-3 lg:col-span-7 row-span-2 min-h-[500px]">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                    <Skeleton className="h-4 w-32 bg-white/10" />
                    <Skeleton className="h-4 w-24 bg-white/10" />
                </div>
                <div className="relative w-full h-[400px]">
                     {/* Mock nodes structure */}
                     <Skeleton className="absolute top-1/2 left-10 h-16 w-16 rounded-full bg-white/10" />
                     <Skeleton className="absolute top-20 left-1/3 h-12 w-12 rounded-full bg-white/10" />
                     <Skeleton className="absolute bottom-20 left-1/3 h-12 w-12 rounded-full bg-white/10" />
                     <Skeleton className="absolute top-1/2 left-1/2 h-20 w-20 rounded-full bg-white/20" />
                     <Skeleton className="absolute top-10 right-1/4 h-12 w-12 rounded-full bg-white/10" />
                     <Skeleton className="absolute bottom-10 right-1/4 h-12 w-12 rounded-full bg-white/10" />
                     <Skeleton className="absolute top-1/2 right-10 h-16 w-16 rounded-full bg-white/10" />
                </div>
            </GlassCard>
        </BentoGrid>
    )
}
