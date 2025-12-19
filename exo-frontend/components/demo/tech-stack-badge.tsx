'use client'

import { useDemoStore } from "@/store/use-demo-store"
import { motion } from "framer-motion"
import { Cpu, FileJson, GitCommit } from "lucide-react"

export function TechStackBadge() {
  const { step } = useDemoStore()

  // Helper to determine if a badge should be active
  const isActive = (tech: 'token2022' | 'cnft' | 'hooks') => {
    if (step === 'FINALIZED') return true
    
    switch (tech) {
      case 'token2022':
        return ['LOCKED', 'EXECUTING', 'COMMITTED', 'CHALLENGE_WINDOW', 'CHALLENGED', 'SLASHED'].includes(step)
      case 'cnft':
        return ['EXECUTING', 'COMMITTED', 'CHALLENGE_WINDOW', 'CHALLENGED', 'SLASHED'].includes(step)
      case 'hooks':
        return ['COMMITTED', 'CHALLENGE_WINDOW', 'CHALLENGED', 'SLASHED'].includes(step)
      default:
        return false
    }
  }

  const badges = [
    {
      id: 'token2022',
      label: 'Token-2022',
      sub: 'Escrow',
      icon: Cpu,
      color: 'text-blue-400',
      borderColor: 'border-blue-400/30',
      activeBg: 'bg-blue-950/30'
    },
    {
      id: 'cnft',
      label: 'Metaplex cNFT',
      sub: 'Identity',
      icon: FileJson,
      color: 'text-purple-400',
      borderColor: 'border-purple-400/30',
      activeBg: 'bg-purple-950/30'
    },
    {
      id: 'hooks',
      label: 'Transfer Hooks',
      sub: 'Revenue',
      icon: GitCommit,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-400/30',
      activeBg: 'bg-emerald-950/30'
    }
  ] as const

  return (
    <div className="flex flex-col space-y-3">
      <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
        OPOS Verified Stack
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {badges.map((badge) => {
          const active = isActive(badge.id)
          
          return (
            <motion.div
              key={badge.id}
              initial={false}
              animate={{
                opacity: active ? 1 : 0.3,
                scale: active ? 1 : 0.98,
                x: active ? 0 : -5
              }}
              className={`
                flex items-center space-x-3 p-3 rounded-lg border 
                ${active ? `${badge.borderColor} ${badge.activeBg}` : 'border-white/5 bg-white/5'}
                transition-colors duration-500
              `}
            >
              <div className={`p-2 rounded bg-black/50 ${active ? badge.color : 'text-slate-500'}`}>
                <badge.icon size={16} />
              </div>
              <div className="flex flex-col">
                <span className={`text-xs font-bold font-mono ${active ? 'text-white' : 'text-slate-500'}`}>
                  {badge.label}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {badge.sub}
                </span>
              </div>
              
              {active && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`ml-auto w-2 h-2 rounded-full ${badge.color.replace('text-', 'bg-')}`} 
                />
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
