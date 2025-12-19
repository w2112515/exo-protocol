import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

export function SkillCardSkeleton() {
    return (
        <GlassCard className="flex flex-col relative overflow-hidden h-full border-white/5 bg-black/40">
            <div className="p-4 pb-2 flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <div className="flex gap-2">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                </div>
            </div>
            <div className="px-4 pb-3">
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
            </div>
            <div className="px-4 py-2 border-y border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-20" />
            </div>
            <div className="px-4 py-3 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <div className="space-y-1">
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-10" />
                </div>
            </div>
            <div className="mt-auto p-4 pt-0 space-y-4">
                <div className="flex gap-2">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-12" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-10 rounded-lg" />
                    <Skeleton className="h-10 rounded-lg" />
                </div>
            </div>
        </GlassCard>
    )
}
