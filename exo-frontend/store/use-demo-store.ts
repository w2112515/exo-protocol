import { create } from 'zustand';

export type DemoStep = 'IDLE' | 'LOCKED' | 'EXECUTING' | 'COMMITTED' | 'CHALLENGED' | 'SLASHED';

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
  
  // Actions
  setStep: (step: DemoStep) => void;
  addLog: (level: LogEntry['level'], message: string) => void;
  toggleMaliciousMode: () => void;
  reset: () => void;
}

export const useDemoStore = create<DemoState>((set) => ({
  step: 'IDLE',
  logs: [],
  isMaliciousMode: false,

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

  reset: () => set({ step: 'IDLE', logs: [] }),
}));
