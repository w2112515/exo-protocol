"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Skill } from "@/lib/mock-data";
import { toast } from "sonner";
import { 
  Terminal, MessageSquareText, BarChart3, Eye, Database, Briefcase, BrainCircuit, // Categories
  User, CheckCircle2, TrendingUp, Zap, Rocket // UI Elements
} from "lucide-react";

// 1. 价格格式化
function formatPrice(lamports: number): string {
  const sol = lamports / 1_000_000_000;
  if (sol < 0.0001) {
    return `${lamports} Lamports`;
  }
  return `${sol.toFixed(6).replace(/\.?0+$/, "")} SOL`;
}

// 2. 类别图标映射
const CATEGORY_ICONS: Record<string, any> = {
  "dev-tools": Terminal,
  "nlp": MessageSquareText,
  "analytics": BarChart3,
  "vision": Eye,
  "data": Database,
  "business": Briefcase,
  "default": BrainCircuit
};

// 3. 截断地址
function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// 4. Solscan 链接
function getSolscanUrl(address: string): string {
  return `https://solscan.io/account/${address}?cluster=devnet`;
}

interface SkillBlinkCardProps {
    skill: Skill;
}

export function SkillBlinkCard({ skill }: SkillBlinkCardProps) {
  const [copied, setCopied] = useState(false);
  // CR05: Use state for origin to avoid SSR hydration mismatch
  const [origin, setOrigin] = useState('');
  const IconComponent = CATEGORY_ICONS[skill.category] || CATEGORY_ICONS.default;

  useEffect(() => {
    // Set origin only on client side
    setOrigin(window.location.origin);
  }, []);

  const handleCopy = async () => {
    try {
        const url = `${origin}/api/actions/skill/${skill.skill_id}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Blink URL copied to clipboard", {
            description: "Ready to paste into any Solana Actions compatible interface."
        });
        setTimeout(() => setCopied(false), 2000);
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        toast.error("Failed to copy URL");
    }
  };

  // Build Blink URL (safe for SSR - empty string until hydrated)
  const blinkActionUrl = origin ? `${origin}/api/actions/skill/${skill.skill_id}` : '';
  const dialToUrl = blinkActionUrl ? `https://dial.to/?action=solana-action:${encodeURIComponent(blinkActionUrl)}&cluster=devnet` : '#';

  return (
    <GlassCard className="flex flex-col relative overflow-hidden group border-white/5 bg-black/40 backdrop-blur-md h-full">
      
      {/* Header: Title & Identity */}
      <div className="p-4 pb-2 flex items-start gap-4">
        {/* Dynamic Icon */}
        <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 flex-shrink-0">
          <IconComponent className="w-6 h-6 text-white/70" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Title - Large & Truncated */}
          <h3 className="font-bold text-lg text-white font-mono tracking-tight truncate" title={skill.name}>
            {skill.name}
          </h3>
          {/* Meta Row */}
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center justify-center rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-white/40 font-mono">
              v{skill.version}
            </span>
            <span className="text-xs text-white/40 capitalize">{skill.category}</span>
          </div>
        </div>
      </div>
    
      {/* Description */}
      <div className="px-4 pb-3 min-h-[3rem]">
        <p className="text-white/50 text-xs line-clamp-2 leading-relaxed">
          {skill.description}
        </p>
      </div>
    
      {/* Creator & Price Row (Separated) */}
      <div className="px-4 py-2 bg-white/2 border-y border-white/5 flex items-center justify-between">
        <a href={getSolscanUrl(skill.creator_address)} target="_blank" className="flex items-center gap-1.5 group/creator">
          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <User className="w-3 h-3 text-white/60" />
          </div>
          <span className="font-mono text-[10px] text-white/40 group-hover/creator:text-white/70 transition-colors">
            {truncateAddress(skill.creator_address)}
          </span>
          {skill.on_chain_verified && (
            <CheckCircle2 className="w-3 h-3 text-green-500/50" />
          )}
        </a>
        
        <div className="text-right">
          <div className="font-mono text-sm font-bold text-green-400">
            {formatPrice(skill.price_lamports)}
          </div>
        </div>
      </div>
    
      {/* Stats Grid (Visualized) */}
      <div className="px-4 py-3 grid grid-cols-2 gap-3">
        {/* Success Rate */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] uppercase text-white/30 font-medium">
            <span>Success Rate</span>
            <span>{(skill.success_rate * 100).toFixed(1)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${skill.success_rate > 0.9 ? 'bg-green-500/50' : 'bg-yellow-500/50'}`} 
              style={{ width: `${skill.success_rate * 100}%` }}
            />
          </div>
        </div>
    
        {/* Executions */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase text-white/30 font-medium block">Executions</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm text-white/80">{skill.execution_count.toLocaleString()}</span>
            <TrendingUp className="w-3 h-3 text-white/20" />
          </div>
        </div>

        {/* Avg Latency */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase text-white/30 font-medium block">Avg Latency</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm text-white/80">{skill.avg_latency_ms}ms</span>
          </div>
        </div>

        {/* Royalties Earned */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase text-white/30 font-medium block">Royalties</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm text-green-400/80">
              {(skill.total_royalties_earned / 1e9).toFixed(3)} SOL
            </span>
          </div>
        </div>
      </div>
    
      {/* Footer: Tags & Actions */}
      <div className="mt-auto p-4 pt-0 space-y-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {skill.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white/40 border border-white/5">
              #{tag}
            </span>
          ))}
        </div>

        {/* Actions: Dual Button */}
        <div className="grid grid-cols-2 gap-3">
           <button
               onClick={handleCopy}
               className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs font-bold text-yellow-400 hover:bg-yellow-500/20 transition-all"
           >
               {copied ? (
                   <>
                       <CheckCircle2 className="w-3.5 h-3.5" />
                       <span>Copied</span>
                   </>
               ) : (
                   <>
                       <Zap className="w-3.5 h-3.5" />
                       <span>Copy Blink</span>
                   </>
               )}
           </button>
           
           <a
               href={dialToUrl}
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/50 hover:bg-white/10 hover:text-white transition-all"
           >
               <Rocket className="w-3.5 h-3.5" />
               <span>Try Now</span>
           </a>
        </div>
      </div>

    </GlassCard>
  );
}
