'use client'

import { useDemoStore } from "@/store/use-demo-store"
import { useEffect, useRef } from "react"

export function DemoTerminalFeed() {
  const { logs } = useDemoStore()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const getLogColor = (level: string) => {
    switch (level) {
      case 'INFO': return 'text-blue-400'
      case 'WARN': return 'text-yellow-400'
      case 'CRIT': return 'text-red-500 font-bold bg-red-900/20'
      case 'SUCCESS': return 'text-green-400'
      default: return 'text-slate-400'
    }
  }

  return (
    <div className="h-full flex flex-col font-mono text-sm">
      <div className="p-3 border-b border-white/10 bg-slate-900 text-slate-400 text-xs uppercase tracking-widest flex justify-between">
        <span>Runtime Logs</span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          LIVE
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-black/80">
        {logs.length === 0 && (
          <div className="text-slate-600 italic">Waiting for transaction...</div>
        )}
        
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 font-mono text-xs opacity-90 hover:opacity-100">
            <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
            <span className={`break-all ${getLogColor(log.level)}`}>
              {log.level !== 'INFO' && <span className="mr-2">[{log.level}]</span>}
              {log.message}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  )
}
