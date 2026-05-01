export interface Landmark {
    x: number;
    y: number;
    z: number;
    confidence: number;
}
export interface FingerState {
    lifted: boolean;
    confidence: number;
    pressure: number;
}
export interface DetectionResult {
    fingers: {
        thumb: FingerState;
        indexFinger: FingerState;
        middleFinger: FingerState;
        ringFinger: FingerState;
        pinkyFinger: FingerState;
        extraFinger: FingerState;
    };
    overallConfidence: number;
    latency: number;
}
export declare class HandDetectionService {
    private static readonly FINGER_INDICES;
    private thresholds;
    processLandmarks(landmarks: Landmark[], startTime: number): DetectionResult;
    updateThresholds(newThresholds: any): void;
}
export declare const handDetectionService: HandDetectionService;
//# sourceMappingURL=HandDetectionService.d.ts.map