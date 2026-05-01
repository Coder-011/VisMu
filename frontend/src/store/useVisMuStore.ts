import { create } from 'zustand';

interface VisMuState {
  handTrackingActive: boolean;
  confidenceScore: number;
  currentPitch: string;
  frequency: number;
  latency: number;
  holeStates: boolean[]; // true = closed
  pressure: number;
  resonance: number;
  totalHolesClosed: number;
  activeNote: string;
  
  setHandTrackingActive: (active: boolean) => void;
  setConfidenceScore: (score: number) => void;
  setPitchData: (pitch: string, freq: number) => void;
  setLatency: (ms: number) => void;
  setHoleStates: (states: boolean[]) => void;
  setMetrics: (pressure: number, resonance: number) => void;
}

export const useVisMuStore = create<VisMuState>((set) => ({
  handTrackingActive: false,
  confidenceScore: 0,
  currentPitch: '--',
  frequency: 0,
  latency: 0,
  holeStates: [false, false, false, false, false, false],
  pressure: 0,
  resonance: 0,
  totalHolesClosed: 0,
  activeNote: '',

  setHandTrackingActive: (active) => set({ handTrackingActive: active }),
  setConfidenceScore: (score) => set({ confidenceScore: score }),
  setPitchData: (pitch, freq) => set({ currentPitch: pitch, frequency: freq }),
  setLatency: (ms) => set({ latency: ms }),
  setHoleStates: (states) => set({ 
    holeStates: states, 
    totalHolesClosed: states.filter(s => s).length 
  }),
  setMetrics: (pressure, resonance) => set({ pressure, resonance }),
}));
