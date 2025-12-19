'use client'

import { useDemoStore } from "@/store/use-demo-store"
import { motion } from "framer-motion"
import { Lock, ShieldAlert, Server, CheckCircle, Timer, ShieldCheck } from "lucide-react"
import { RevenueSplit } from "@/components/demo/revenue-split"

export function StateFlowDiagram() {
  const { step, setStep, challengeWindowProgress, challengeWindowSlots } = useDemoStore()

  const getStateColor = (targetStep: string) => {
    // Linear progression for coloring
    const states = ['IDLE', 'LOCKED', 'EXECUTING', 'COMMITTED', 'CHALLENGE_WINDOW', 'FINALIZED']
    const currentIndex = states.indexOf(step)
    const targetIndex = states.indexOf(targetStep)
    
    // Error states
    if (step === 'SLASHED' || step === 'CHALLENGED') {
       if (targetStep === 'FINALIZED') return 'text-slate-700'
       if (targetStep === 'CHALLENGE_WINDOW') return 'text-red-500' // Show failure at this stage
       if (targetStep === 'COMMITTED') return 'text-purple-400' // Still committed initially
    }
    
    return currentIndex >= targetIndex ? 'text-purple-400' : 'text-slate-700'
  }

  return (
    <div className="h-full flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 grid grid-cols-3 gap-4 pointer-events-none opacity-20">
        <div className="border-r border-dashed border-white/10" />
        <div className="border-r border-dashed border-white/10" />
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-8 w-full max-w-2xl">
        
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
        <div className={`h-8 w-0.5 ${['COMMITTED', 'CHALLENGE_WINDOW', 'FINALIZED', 'CHALLENGED', 'SLASHED'].includes(step) ? 'bg-purple-500' : 'bg-slate-800'}`} />

        {/* Step 3: Committed */}
        <div className="flex flex-col items-center space-y-4">
            <motion.div 
              animate={{ scale: step === 'COMMITTED' ? 1.1 : 1 }}
              className={`flex items-center space-x-4 ${['COMMITTED', 'CHALLENGE_WINDOW', 'FINALIZED', 'CHALLENGED', 'SLASHED'].includes(step) ? 'text-green-400' : 'text-slate-700'}`}
            >
               <div className="p-4 rounded-xl border border-current bg-black/50">
                 <CheckCircle size={32} />
               </div>
               <div className="text-xl font-mono">3. STATE COMMITTED</div>
            </motion.div>
            
            {/* Revenue Split - Shows after commit */}
            {['COMMITTED', 'CHALLENGE_WINDOW', 'FINALIZED'].includes(step) && (
                <RevenueSplit />
            )}
        </div>

        {/* Connector */}
        <div className={`h-8 w-0.5 ${['CHALLENGE_WINDOW', 'FINALIZED', 'CHALLENGED', 'SLASHED'].includes(step) ? 'bg-purple-500' : 'bg-slate-800'}`} />

        {/* Step 4: Challenge Window / Finalized */}
        
        {step === 'CHALLENGE_WINDOW' && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-6 rounded-xl border border-yellow-500/50 bg-yellow-950/20 backdrop-blur-sm"
            >
                <div className="flex items-center justify-between mb-4 text-yellow-500">
                    <div className="flex items-center gap-2">
                        <Timer className="animate-pulse" />
                        <span className="font-mono font-bold">CHALLENGE WINDOW</span>
                    </div>
                    <span className="font-mono text-sm">{challengeWindowSlots}/40 slots</span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-4">
                    <motion.div 
                        className="h-full bg-yellow-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${challengeWindowProgress}%` }}
                        transition={{ type: 'tween', ease: 'linear', duration: 0.5 }}
                    />
                </div>

                <button 
                    onClick={() => setStep('CHALLENGED')}
                    className="w-full py-2 border border-red-500/50 text-red-400 hover:bg-red-950/30 rounded font-mono text-xs transition-colors uppercase tracking-wider"
                >
                    [ Simulate Fraud Proof ]
                </button>
            </motion.div>
        )}

        {step === 'FINALIZED' && (
             <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center space-x-4 text-emerald-400"
            >
               <div className="p-4 rounded-xl border border-current bg-black/50 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                 <ShieldCheck size={32} />
               </div>
               <div className="text-xl font-mono font-bold">4. FINALIZED</div>
            </motion.div>
        )}

        {(step === 'CHALLENGED' || step === 'SLASHED') && (
            <div className="flex flex-col items-center">
                <motion.div 
                  animate={{ scale: step === 'CHALLENGED' ? [1, 1.1, 1] : 1 }}
                  transition={{ repeat: step === 'CHALLENGED' ? Infinity : 0 }}
                  className="p-4 rounded-xl border border-red-500 text-red-500 bg-black/50 mb-2"
                >
                  <ShieldAlert size={32} />
                </motion.div>
                <div className="text-red-500 font-mono text-xl">CHALLENGED</div>
            </div>
        )}

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
