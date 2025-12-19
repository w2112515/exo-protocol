'use client'

import { motion } from "framer-motion"
import { Coins } from "lucide-react"

export function RevenueSplit() {
  const segments = [
    { label: 'Executor', percent: 85, color: 'bg-emerald-500', width: '85%' },
    { label: 'Creator', percent: 10, color: 'bg-cyan-500', width: '10%' },
    { label: 'Protocol', percent: 5, color: 'bg-slate-500', width: '5%' },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md p-4 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm"
    >
      <div className="flex items-center space-x-2 mb-3 text-emerald-400">
        <Coins size={16} />
        <span className="font-mono font-bold text-sm">REVENUE SPLIT (TRANSFER HOOKS)</span>
      </div>

      <div className="flex h-8 w-full rounded overflow-hidden mb-2">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.label}
            initial={{ width: 0 }}
            animate={{ width: seg.width }}
            transition={{ delay: i * 0.2, duration: 0.5, ease: "easeOut" }}
            className={`h-full ${seg.color} border-r border-black/20 last:border-0 relative group`}
          >
             {/* Tooltip on hover */}
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 text-[10px] font-bold text-white">
                {seg.percent}%
             </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Executor 85%</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-cyan-500" />
          <span>Creator 10%</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-slate-500" />
          <span>Proto 5%</span>
        </div>
      </div>
      
      <div className="mt-2 text-right text-xs font-mono text-slate-500">
        Total Volume: 0.1 SOL
      </div>
    </motion.div>
  )
}
