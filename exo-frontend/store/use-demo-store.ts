import { create } from 'zustand';

export type DemoStep = 'IDLE' | 'LOCKED' | 'EXECUTING' | 'COMMITTED' | 'CHALLENGE_WINDOW' | 'FINALIZED' | 'CHALLENGED' | 'SLASHED';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'CRIT' | 'SUCCESS';
  message: string;
}

interface DemoState {
  step: DemoStep;
  logs: LogEntry[];
  isMaliciousMode: boolean; // Magic toggle for the "Red" branch
  
  // Challenge Window State
  challengeWindowProgress: number; // 0-100
  challengeWindowSlots: number;    // Current slots
  totalChallengeSlots: number;     // Total slots (40)

  // Actions
  setStep: (step: DemoStep) => void;
  addLog: (level: LogEntry['level'], message: string) => void;
  toggleMaliciousMode: () => void;
  reset: () => void;
  
  // Challenge Actions
  tickChallengeWindow: () => void;
  startChallengeWindow: () => void;
}

export const useDemoStore = create<DemoState>((set) => ({
  step: 'IDLE',
  logs: [],
  isMaliciousMode: false,
  
  challengeWindowProgress: 0,
  challengeWindowSlots: 0,
  totalChallengeSlots: 40,

  setStep: (step) => set({ step }),
  
  addLog: (level, message) => set((state) => ({
    logs: [
      ...state.logs,
      {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toLocaleTimeString(),
        level,
        message,
      }
    ].slice(-50) // Keep last 50 logs
  })),

  toggleMaliciousMode: () => set((state) => {
    const newMode = !state.isMaliciousMode;
    return {
      isMaliciousMode: newMode,
      logs: [
        ...state.logs,
        {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toLocaleTimeString(),
          level: 'WARN',
          message: `[SYSTEM] Malicious Simulation Mode: ${newMode ? 'ENABLED' : 'DISABLED'}`
        }
      ]
    };
  }),

  reset: () => set({ 
    step: 'IDLE', 
    logs: [],
    challengeWindowProgress: 0,
    challengeWindowSlots: 0
  }),

  startChallengeWindow: () => set({
    step: 'CHALLENGE_WINDOW',
    challengeWindowSlots: 0,
    challengeWindowProgress: 0
  }),

  tickChallengeWindow: () => set((state) => {
    const nextSlot = state.challengeWindowSlots + 1;
    const progress = (nextSlot / state.totalChallengeSlots) * 100;
    
    // If finished, auto-transition to FINALIZED (logic can be here or in component, but store update is safe)
    // We'll leave the state transition to the component/page to handle side effects (logs etc)
    
    return {
      challengeWindowSlots: nextSlot,
      challengeWindowProgress: Math.min(progress, 100)
    };
  })
}));
