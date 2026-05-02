import { create } from 'zustand';

interface VisMuState {
  handTrackingActive: boolean;
  confidenceScore: number;
  currentPitch: string;
  frequency: number;
  latency: number;
  holeStates: boolean[];
  pressure: number;
  resonance: number;
  totalHolesClosed: number;
  sessionNoteCount: number;

  setHandTrackingActive: (active: boolean) => void;
  setConfidenceScore: (score: number) => void;
  setPitchData: (pitch: string, freq: number) => void;
  setLatency: (ms: number) => void;
  setHoleStates: (states: boolean[]) => void;
  setMetrics: (pressure: number, resonance: number) => void;
  resetSession: () => void;
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
  sessionNoteCount: 0,

  setHandTrackingActive: (active) => set({ handTrackingActive: active }),
  setConfidenceScore: (score) => set({ confidenceScore: score }),
  setPitchData: (pitch, freq) => set((s) => ({
    currentPitch: pitch,
    frequency: freq,
    sessionNoteCount: pitch !== '--' && pitch !== s.currentPitch
      ? s.sessionNoteCount + 1
      : s.sessionNoteCount,
  })),
  setLatency: (ms) => set({ latency: ms }),
  setHoleStates: (states) => set({ holeStates: states, totalHolesClosed: states.filter(Boolean).length }),
  setMetrics: (pressure, resonance) => set({ pressure, resonance }),
  resetSession: () => set({
    handTrackingActive: false, confidenceScore: 0, currentPitch: '--',
    frequency: 0, latency: 0, holeStates: [false, false, false, false, false, false],
    pressure: 0, resonance: 0, totalHolesClosed: 0, sessionNoteCount: 0,
  }),
}));
