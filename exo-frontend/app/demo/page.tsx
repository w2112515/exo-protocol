'use client'

import { useEffect, useRef } from "react"
import { useDemoStore } from "@/store/use-demo-store"
import { DemoBlinkCard } from "@/components/demo/demo-blink-card"
import { StateFlowDiagram } from "@/components/demo/state-flow-diagram"
import { DemoTerminalFeed } from "@/components/demo/demo-terminal-feed"
import { TechStackBadge } from "@/components/demo/tech-stack-badge"
import { Zap } from "lucide-react"

export default function DemoPage() {
  const { 
    step, setStep, addLog, isMaliciousMode, toggleMaliciousMode, reset,
    startChallengeWindow, tickChallengeWindow, challengeWindowSlots, totalChallengeSlots 
  } = useDemoStore()

  // Magic Key Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'x') {
        toggleMaliciousMode()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleMaliciousMode])

  // CR03: Use ref to track all timers for proper cleanup
  const timersRef = useRef<NodeJS.Timeout[]>([])

  // Helper to create tracked timeouts
  const createTimeout = (callback: () => void, ms: number) => {
    const id = setTimeout(callback, ms)
    timersRef.current.push(id)
    return id
  }

  // State Machine Controller
  useEffect(() => {
    // Clear previous timers on state change to prevent overlapping logic
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    if (step === 'EXECUTING') {
      addLog('INFO', 'Verifying Agent Identity (Metaplex cNFT)...')
      
      createTimeout(() => {
        addLog('INFO', 'Checking Stake Status (Min: 0.1 SOL)...')
        addLog('INFO', 'Allocating secure sandbox [Docker-v29]...')
        
        createTimeout(() => {
          addLog('INFO', 'Running analysis on Docker container...')
          
          createTimeout(() => {
            if (isMaliciousMode) {
               // Malicious Branch
               addLog('WARN', 'Output Hash generated: 0xdead...beef')
               addLog('INFO', 'Compressing State via Light Protocol (ZK)...')
               addLog('INFO', 'Committing results to Solana...')
               setStep('COMMITTED')
               // Transition handled by COMMITTED block
            } else {
              // Normal Branch
              addLog('SUCCESS', 'Analysis Complete. No issues found.')
              addLog('INFO', 'Output Hash generated: 0xcafe...babe')
              addLog('INFO', 'Compressing State via Light Protocol (ZK)...')
              addLog('INFO', 'Committing results to Solana...')
              setStep('COMMITTED')
            }
          }, 2500) // Execution time
        }, 1000)
      }, 800)
    }

    if (step === 'COMMITTED') {
      createTimeout(() => {
         addLog('INFO', 'State Committed. Starting Challenge Window.')
         startChallengeWindow()
      }, 1000)
    }

    if (step === 'CHALLENGE_WINDOW') {
        addLog('INFO', 'Entering Challenge Window (40 Slots)...')
        
        const tick = () => {
             tickChallengeWindow()
             // 200ms per simulated slot (~8s total for 40 slots)
             createTimeout(tick, 200) 
        }
        tick()
    }

    if (step === 'CHALLENGED') {
         addLog('CRIT', '🚨 FRAUD PROOF RECEIVED!')
         addLog('WARN', 'Validating challenge evidence...')
         
         createTimeout(() => {
             addLog('CRIT', 'Validation Successful. Executing Slashing...')
             setStep('SLASHED')
         }, 2000)
    }
    
    if (step === 'FINALIZED') {
         addLog('SUCCESS', 'Challenge Window Closed. State Finalized.')
         addLog('INFO', 'Settlement completed. Funds released.')
    }

    if (step === 'SLASHED') {
         addLog('CRIT', '👮 MALICIOUS ACTOR SLASHED.')
         addLog('INFO', 'Stake burned: 1000 EXO')
    }

    // Cleanup all timers on unmount or dependency change
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [step, isMaliciousMode, setStep, addLog, startChallengeWindow, tickChallengeWindow])

  // Watcher Effect: Monitors slots to trigger transitions
  useEffect(() => {
     if (step === 'CHALLENGE_WINDOW') {
         if (challengeWindowSlots >= totalChallengeSlots) {
             setStep('FINALIZED')
         }
         // Auto-trigger challenge in Malicious Mode
         if (isMaliciousMode && challengeWindowSlots === 15) {
             addLog('WARN', '⚠️ Watcher Bot detected invalid state root!')
             setStep('CHALLENGED')
         }
     }
  }, [challengeWindowSlots, step, isMaliciousMode, totalChallengeSlots, setStep, addLog])

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      
      {/* Brand Header (P17-04) */}
      <div className="h-14 border-b border-white/10 flex items-center px-6 justify-between bg-slate-950">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Zap className="text-emerald-400" size={18} fill="currentColor" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-lg tracking-tight">EXO PROTOCOL</span>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Skill-Native PayFi</span>
          </div>
        </div>
        <div className="flex items-center space-x-6">
           <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-slate-500">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             <span>DEVNET LIVE</span>
           </div>
           <div className="text-xs font-mono text-slate-600 border px-2 py-1 rounded border-slate-800">
             v2.1.0-RC
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 min-h-0">
        {/* Left: Blink Executor */}
        <div className="col-span-3 border-r border-white/10 p-6 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="mb-6 font-mono text-xs text-slate-500 uppercase tracking-widest">
            Exo Protocol // Blink Interface
          </div>
          
          <div className="flex-1 space-y-8">
            <DemoBlinkCard />
            
            {/* P17-01 Tech Badge */}
            <div className="pt-6 border-t border-white/5">
               <TechStackBadge />
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <div className="text-xs text-slate-700 font-mono">
              Press &apos;X&apos; to toggle Simulation Mode
            </div>
            {/* IM05: Reset Demo Button */}
            {step !== 'IDLE' && (
              <button
                onClick={reset}
                className="w-full px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30 rounded-lg text-xs font-mono text-slate-400 hover:text-white transition-all"
              >
                ↻ Reset Demo
              </button>
            )}
          </div>
        </div>

        {/* Center: State Flow Visualization */}
        <div className="col-span-6 border-r border-white/10 p-6 flex flex-col bg-slate-950/50 relative overflow-hidden">
          <StateFlowDiagram />
        </div>

        {/* Right: Runtime Logs */}
        <div className="col-span-3 bg-slate-950 flex flex-col border-l border-white/5">
          <DemoTerminalFeed />
        </div>
      </div>
    </div>
  )
}
