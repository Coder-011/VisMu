declare class AudioEngine {
    private ctx;
    private oscillator;
    private gainNode;
    private currentNote;
    private initialized;
    initialize(): Promise<void>;
    playNote(note: string | null): void;
    isInitialized(): boolean;
}
export declare const audioEngine: AudioEngine;
export {};
//# sourceMappingURL=audioEngine.d.ts.map