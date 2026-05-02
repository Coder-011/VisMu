import { create } from 'zustand';
export const useVisMuStore = create((set) => ({
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
    // Enhanced metrics
    fps: 60,
    cpuUsage: 0,
    memoryUsage: 0,
    droppedFrames: 0,
    audioUnderrun: false,
    noteAccuracy: 0,
    sessionNoteCount: 0,
    // Backend integration
    useBackendAPI: false,
    backendConnected: false,
    setHandTrackingActive: (active) => set({ handTrackingActive: active }),
    setConfidenceScore: (score) => set({ confidenceScore: score }),
    setPitchData: (pitch, freq) => set({ currentPitch: pitch, frequency: freq }),
    setLatency: (ms) => set({ latency: ms }),
    setHoleStates: (states) => set({
        holeStates: states,
        totalHolesClosed: states.filter(s => s).length
    }),
    setMetrics: (pressure, resonance) => set({ pressure, resonance }),
    setPerformanceMetrics: (metrics) => set((state) => ({ ...state, ...metrics })),
    setBackendAPI: (use) => set({ useBackendAPI: use }),
    setBackendConnected: (connected) => set({ backendConnected: connected }),
}));
//# sourceMappingURL=useVisMuStore.js.map