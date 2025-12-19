'use client'

import { useDemoStore } from "@/store/use-demo-store"
import { motion } from "framer-motion"
import { Lock, ShieldAlert, Server, CheckCircle } from "lucide-react"

export function StateFlowDiagram() {
  const { step } = useDemoStore()

  const getStateColor = (targetStep: string) => {
    const states = ['IDLE', 'LOCKED', 'EXECUTING', 'COMMITTED', 'CHALLENGED', 'SLASHED']
    const currentIndex = states.indexOf(step)
    const targetIndex = states.indexOf(targetStep)
    
    if (step === 'SLASHED' && targetStep === 'CHALLENGED') return 'text-red-500'
    if (step === 'SLASHED' && targetStep === 'SLASHED') return 'text-red-500'
    if (step === 'CHALLENGED' && targetStep === 'CHALLENGED') return 'text-red-500'
    
    return currentIndex >= targetIndex ? 'text-purple-400' : 'text-slate-700'
  }

  return (
    <div className="h-full flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 grid grid-cols-3 gap-4 pointer-events-none opacity-20">
        <div className="border-r border-dashed border-white/10" />
        <div className="border-r border-dashed border-white/10" />
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-12 w-full max-w-2xl">
        
        {/* Step 1: Escrow */}
        <motion.div 
          animate={{ scale: step === 'LOCKED' ? 1.1 : 1 }}
          className={`flex items-center space-x-4 ${getStateColor('LOCKED')}`}
        >
          <div className="p-4 rounded-xl border border-current bg-black/50">
            <Lock size={32} />
          </div>
          <div className="text-xl font-mono">1. ESCROW LOCKED</div>
        </motion.div>

        {/* Connector */}
        <div className={`h-8 w-0.5 ${step !== 'IDLE' ? 'bg-purple-500' : 'bg-slate-800'}`} />

        {/* Step 2: Execution */}
        <motion.div 
          animate={{ 
            scale: step === 'EXECUTING' ? 1.1 : 1,
            rotate: step === 'EXECUTING' ? [0, 10, -10, 0] : 0
          }}
          transition={{ repeat: step === 'EXECUTING' ? Infinity : 0 }}
          className={`flex items-center space-x-4 ${getStateColor('EXECUTING')}`}
        >
          <div className="p-4 rounded-xl border border-current bg-black/50">
            <Server size={32} />
          </div>
          <div className="text-xl font-mono">2. OFF-CHAIN EXECUTION</div>
        </motion.div>

        {/* Connector */}
        <div className={`h-8 w-0.5 ${['COMMITTED', 'CHALLENGED', 'SLASHED'].includes(step) ? 'bg-purple-500' : 'bg-slate-800'}`} />

        {/* Step 3: Branch */}
        <div className="grid grid-cols-2 gap-12 w-full">
          {/* Normal Path */}
          <div className={`flex flex-col items-center ${step === 'COMMITTED' ? 'opacity-100' : 'opacity-30'}`}>
            <div className="p-4 rounded-xl border border-green-500 text-green-500 bg-black/50 mb-2">
              <CheckCircle size={32} />
            </div>
            <div className="text-green-500 font-mono">COMMIT</div>
          </div>

          {/* SRE Path */}
          <div className={`flex flex-col items-center ${['CHALLENGED', 'SLASHED'].includes(step) ? 'opacity-100' : 'opacity-30'}`}>
            <motion.div 
              animate={{ scale: step === 'CHALLENGED' ? [1, 1.2, 1] : 1 }}
              transition={{ repeat: step === 'CHALLENGED' ? Infinity : 0 }}
              className="p-4 rounded-xl border border-red-500 text-red-500 bg-black/50 mb-2"
            >
              <ShieldAlert size={32} />
            </motion.div>
            <div className="text-red-500 font-mono">CHALLENGE</div>
          </div>
        </div>

        {/* Slash State Overlay */}
        {step === 'SLASHED' && (
          <motion.div 
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-red-600 text-red-600 font-black text-6xl px-8 py-4 -rotate-12 bg-black z-50 shadow-[0_0_50px_rgba(220,38,38,0.5)]"
          >
            SLASHED
          </motion.div>
        )}

      </div>
    </div>
  )
}
