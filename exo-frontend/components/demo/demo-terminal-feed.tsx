'use client'

import { useDemoStore } from "@/store/use-demo-store"
import React, { useEffect, useRef, useCallback } from "react"

const SOLANA_HASH_REGEX = /\b([1-9A-HJ-NP-Za-km-z]{43,88})\b/g

function isSolanaSignature(str: string): boolean {
  if (str.length < 43 || str.length > 88) return false
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(str)
}

export function DemoTerminalFeed() {
  const { logs } = useDemoStore()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const getLogColor = useCallback((level: string) => {
    switch (level) {
      case 'INFO': return 'text-blue-400'
      case 'WARN': return 'text-yellow-400'
      case 'CRIT': return 'text-red-500 font-bold bg-red-900/20'
      case 'SUCCESS': return 'text-green-400'
      default: return 'text-slate-400'
    }
  }, [])

  const renderMessageWithLinks = useCallback((message: string) => {
    const parts: (string | React.ReactElement)[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    const regex = new RegExp(SOLANA_HASH_REGEX.source, 'g')
    
    while ((match = regex.exec(message)) !== null) {
      const hash = match[1]
      if (isSolanaSignature(hash)) {
        if (match.index > lastIndex) {
          parts.push(message.slice(lastIndex, match.index))
        }
        parts.push(
          <a
            key={`${hash}-${match.index}`}
            href={`https://solscan.io/tx/${hash}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
            onClick={(e) => e.stopPropagation()}
          >
            {hash.slice(0, 8)}...{hash.slice(-4)}
          </a>
        )
        lastIndex = match.index + match[0].length
      }
    }
    
    if (lastIndex < message.length) {
      parts.push(message.slice(lastIndex))
    }
    
    return parts.length > 0 ? parts : message
  }, [])

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
              {renderMessageWithLinks(log.message)}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  )
}
