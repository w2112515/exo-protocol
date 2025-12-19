import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useDemoStore } from "@/store/use-demo-store"

export function DemoBlinkCard() {
  const { step, setStep, addLog, isMaliciousMode } = useDemoStore()

  const handleExecute = () => {
    addLog('INFO', 'User clicked Execute Skill')
    setStep('LOCKED')
    
    setTimeout(() => {
      addLog('INFO', 'Escrow funds locked (1.5 SOL)')
      setStep('EXECUTING')
    }, 1000)
  }

  return (
    <Card className="h-full bg-slate-900 border-white/10 p-6 flex flex-col items-center justify-center space-y-8">
      <div className="text-center space-y-2">
        <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">⚡</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Code Review Skill</h2>
        <p className="text-slate-400">Execute autonomous code review on your repository.</p>
        <div className="text-sm font-mono text-purple-400 bg-purple-900/20 px-3 py-1 rounded inline-block">
          Cost: 0.1 SOL
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <Button 
          size="lg" 
          className="w-full bg-white text-black hover:bg-slate-200 font-bold text-lg h-14"
          onClick={handleExecute}
          disabled={step !== 'IDLE'}
        >
          {step === 'IDLE' ? 'Execute Skill' : 'Processing...'}
        </Button>
        
        {step !== 'IDLE' && (
          <div className="text-center text-xs text-slate-500 animate-pulse">
            Transaction Signature: 5x...9z
          </div>
        )}
      </div>

      {isMaliciousMode && (
         <div className="absolute top-4 left-4 text-xs text-red-500 font-mono border border-red-500/50 px-2 py-1">
           MALICIOUS MODE ACTIVE
         </div>
      )}
    </Card>
  )
}
