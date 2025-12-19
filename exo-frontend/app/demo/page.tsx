'use client'

import { useEffect, useRef } from "react"
import { useDemoStore } from "@/store/use-demo-store"
import { DemoBlinkCard } from "@/components/demo/demo-blink-card"
import { StateFlowDiagram } from "@/components/demo/state-flow-diagram"
import { DemoTerminalFeed } from "@/components/demo/demo-terminal-feed"

export default function DemoPage() {
  const { step, setStep, addLog, isMaliciousMode, toggleMaliciousMode, reset } = useDemoStore()

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
    // Clear previous timers on re-run
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
               
               createTimeout(() => {
                 addLog('CRIT', 'HASH MISMATCH DETECTED via Transfer Hook')
                 addLog('CRIT', 'Expected: 0xcafe...babe, Found: 0xdead...beef')
                 setStep('CHALLENGED')
                 
                 createTimeout(() => {
                   addLog('INFO', 'Watcher Bot submitted fraud proof')
                   addLog('CRIT', 'SLASHING EXECUTOR STAKE (1000 EXO)')
                   setStep('SLASHED')
                 }, 2000)
               }, 1500)
  
            } else {
              // Normal Branch
              addLog('SUCCESS', 'Analysis Complete. No issues found.')
              addLog('INFO', 'Output Hash generated: 0xcafe...babe')
              addLog('INFO', 'Compressing State via Light Protocol (ZK)...')
              addLog('INFO', 'Committing results to Solana...')
              setStep('COMMITTED')
              
              createTimeout(() => {
                 addLog('SUCCESS', 'Transaction Verified. Funds Released.')
                 addLog('INFO', 'Protocol Fee (5%) + Creator Royalty (10%) Auto-Split')
              }, 1000)
            }
          }, 2500) // Execution time
        }, 1000)
      }, 800)
    }

    // Cleanup all timers on unmount or dependency change
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [step, isMaliciousMode, setStep, addLog])

  return (
    <div className="grid grid-cols-12 h-screen bg-black text-white overflow-hidden">
      {/* Left: Blink Executor */}
      <div className="col-span-3 border-r border-white/10 p-6 flex flex-col">
        <div className="mb-6 font-mono text-xs text-slate-500 uppercase tracking-widest">
          Exo Protocol // Demo Link
        </div>
        <div className="flex-1">
          <DemoBlinkCard />
        </div>
        <div className="mt-6 space-y-3">
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
      <div className="col-span-6 border-r border-white/10 p-6 flex flex-col bg-slate-950/50">
        <StateFlowDiagram />
      </div>

      {/* Right: Runtime Logs */}
      <div className="col-span-3 bg-slate-950 flex flex-col border-l border-white/5">
        <DemoTerminalFeed />
      </div>
    </div>
  )
}
