// P3B-05: Dashboard 集成页面
// 集成: TerminalFeed, AgentFlowGraph, KPICard
'use client';

import { BentoGrid } from "@/components/layout/bento-grid";
import { GlassCard } from "@/components/ui/glass-card";
import { TerminalFeed } from "@/components/dashboard/terminal-feed";
import { AgentFlowGraph } from "@/components/dashboard/agent-flow-graph";
import { KPICard } from "@/components/dashboard/kpi-card";
import { useOrders } from "@/hooks/use-orders";
import { useSkills } from "@/hooks/use-skills";
import { calculateKPIs } from "@/lib/api";

// ID 来自 anchor/programs/exo-core/src/lib.rs
const EXO_PROGRAM_ID = "CdamAXn5fCros3MktPxmbQKXtxd34XHATTLmh9jkn7DT";

export default function DashboardPage() {
    const { data: orders = [], isLoading: ordersLoading, isError: ordersError } = useOrders();
    const { data: skills = [], isLoading: skillsLoading, isError: skillsError } = useSkills();

    const kpis = calculateKPIs(orders, skills);
    const isLoading = ordersLoading || skillsLoading;
    const isError = ordersError || skillsError;

    return (
        <main className="container mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-mono text-foreground mb-2">My Terminal</h1>
                <p className="text-muted-foreground text-sm">Welcome back, Agent.</p>
            </div>

            {isError ? (
                <div className="max-w-7xl mx-auto p-8">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
                        <p className="text-red-400 font-mono">Failed to load data. Please try again later.</p>
                    </div>
                </div>
            ) : (
                <BentoGrid className="max-w-7xl mx-auto">
                    {/* KPI Row - 使用真实数据 */}
                    <KPICard
                        label="Total Volume"
                        value={kpis.totalVolume}
                        precision={2}
                        suffix=" SOL"
                        className="col-span-1 md:col-span-2 lg:col-span-4"
                        valueClassName={isLoading ? "animate-pulse" : undefined}
                    />
                    <KPICard
                        label="Active Skills"
                        value={kpis.activeSkills}
                        className="col-span-1 md:col-span-2 lg:col-span-4"
                        valueClassName={isLoading ? "animate-pulse" : "text-white"}
                    />
                    <KPICard
                        label="Avg Latency"
                        value={kpis.avgLatency}
                        suffix="ms"
                        className="col-span-1 md:col-span-2 lg:col-span-4"
                        valueClassName={isLoading ? "animate-pulse" : "text-success"}
                    />

                    {/* Main Split: Terminal Feed + Agent Flow Graph */}
                    <GlassCard className="col-span-1 md:col-span-3 lg:col-span-5 row-span-2 min-h-[500px]">
                        <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                            <h3 className="text-sm font-medium">Live Transactions</h3>
                            <span className="text-xs text-primary font-mono animate-pulse">● Live</span>
                        </div>
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64 text-muted-foreground">
                                <span className="animate-pulse font-mono">Loading...</span>
                            </div>
                        ) : (
                            <TerminalFeed 
                                orders={orders} 
                                className="max-h-[420px] overflow-y-auto pr-2" 
                                programId={EXO_PROGRAM_ID}
                            />
                        )}
                    </GlassCard>

                    <GlassCard className="col-span-1 md:col-span-3 lg:col-span-7 row-span-2 min-h-[500px] relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                            <h3 className="text-sm font-medium">Agent Flow</h3>
                            <span className="text-xs text-muted-foreground font-mono">Settlement Distribution</span>
                        </div>
                        <AgentFlowGraph className="h-[420px]" />
                    </GlassCard>
                </BentoGrid>
            )}
        </main>
    );
}
