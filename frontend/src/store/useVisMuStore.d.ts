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
    droppedFrames: number;
    audioUnderrun: boolean;
    noteAccuracy: number;
    sessionNoteCount: number;
    useBackendAPI: boolean;
    backendConnected: boolean;
    setHandTrackingActive: (active: boolean) => void;
    setConfidenceScore: (score: number) => void;
    setPitchData: (pitch: string, freq: number) => void;
    setLatency: (ms: number) => void;
    setHoleStates: (states: boolean[]) => void;
    setMetrics: (pressure: number, resonance: number) => void;
    setPerformanceMetrics: (metrics: Partial<VisMuState>) => void;
    setBackendAPI: (use: boolean) => void;
    setBackendConnected: (connected: boolean) => void;
}
export declare const useVisMuStore: import("zustand").UseBoundStore<import("zustand").StoreApi<VisMuState>>;
export {};
//# sourceMappingURL=useVisMuStore.d.ts.map