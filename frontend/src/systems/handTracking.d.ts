export declare function detectNoteFromLandmarks(landmarks: any[]): {
    note: string;
    freq: number;
    holeStates: boolean[];
    confidence: number;
    pressure: number;
};
export declare class HandTracking {
    private landmarker;
    private onResults;
    private ready;
    private lastVideoTime;
    constructor(onResults: (results: any) => void);
    private initAsync;
    isReady(): boolean;
    send(video: HTMLVideoElement): Promise<void>;
    close(): void;
}
//# sourceMappingURL=handTracking.d.ts.map