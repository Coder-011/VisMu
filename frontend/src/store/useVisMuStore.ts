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
  activeNote: string;
  fps: number;
  cpuUsage: number;
  memoryUsage: number;
  noteAccuracy: number;
  sessionNoteCount: number;
  backendConnected: boolean;
  useBackendAPI: boolean;

  setHandTrackingActive: (active: boolean) => void;
  setConfidenceScore: (score: number) => void;
  setPitchData: (pitch: string, freq: number) => void;
  setLatency: (ms: number) => void;
  setHoleStates: (states: boolean[]) => void;
  setMetrics: (pressure: number, resonance: number) => void;
  setFps: (fps: number) => void;
  setSystemMetrics: (cpu: number, memory: number) => void;
  setNoteAccuracy: (accuracy: number) => void;
  incrementNoteCount: () => void;
  setBackendConnected: (connected: boolean) => void;
  setUseBackendAPI: (use: boolean) => void;
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
  activeNote: '',
  fps: 0,
  cpuUsage: 0,
  memoryUsage: 0,
  noteAccuracy: 0,
  sessionNoteCount: 0,
  backendConnected: false,
  useBackendAPI: !!import.meta.env.VITE_API_URL,

  setHandTrackingActive: (active) => set({ handTrackingActive: active }),
  setConfidenceScore: (score) => set({ confidenceScore: score }),
  setPitchData: (pitch, freq) => set((s) => ({
    currentPitch: pitch,
    frequency: freq,
    sessionNoteCount: pitch !== '--' && pitch !== s.currentPitch ? s.sessionNoteCount + 1 : s.sessionNoteCount,
  })),
  setLatency: (ms) => set({ latency: ms }),
  setHoleStates: (states) => set({ holeStates: states, totalHolesClosed: states.filter(Boolean).length }),
  setMetrics: (pressure, resonance) => set({ pressure, resonance }),
  setFps: (fps) => set({ fps }),
  setSystemMetrics: (cpuUsage, memoryUsage) => set({ cpuUsage, memoryUsage }),
  setNoteAccuracy: (noteAccuracy) => set({ noteAccuracy }),
  incrementNoteCount: () => set((s) => ({ sessionNoteCount: s.sessionNoteCount + 1 })),
  setBackendConnected: (backendConnected) => set({ backendConnected }),
  setUseBackendAPI: (useBackendAPI) => set({ useBackendAPI }),
  resetSession: () => set({
    handTrackingActive: false, confidenceScore: 0, currentPitch: '--',
    frequency: 0, latency: 0, holeStates: [false, false, false, false, false, false],
    pressure: 0, resonance: 0, totalHolesClosed: 0, activeNote: '',
    sessionNoteCount: 0, noteAccuracy: 0,
  }),
}));
