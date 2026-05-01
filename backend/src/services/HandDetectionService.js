"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handDetectionService = exports.HandDetectionService = void 0;
class HandDetectionService {
    static FINGER_INDICES = {
        thumb: 4,
        indexFinger: 8,
        middleFinger: 12,
        ringFinger: 16,
        pinkyFinger: 20,
        extraFinger: 0, // Wrist or secondary point
    };
    // Thresholds (can be updated via calibration)
    thresholds = {
        thumb: 0.5,
        indexFinger: 0.5,
        middleFinger: 0.5,
        ringFinger: 0.5,
        pinkyFinger: 0.5,
        extraFinger: 0.5,
    };
    processLandmarks(landmarks, startTime) {
        const fingerStates = {};
        let totalConfidence = 0;
        let count = 0;
        for (const [finger, index] of Object.entries(HandDetectionService.FINGER_INDICES)) {
            const landmark = landmarks[index];
            if (!landmark)
                continue;
            // Logic: Higher Y means finger is lower (pressed against flute)
            // We'll use a simple threshold for now.
            // In a real app, this would be relative to the palm (landmark 0 or 9).
            const threshold = this.thresholds[finger];
            const isPressed = landmark.y > threshold;
            // Pressure is derived from Z (depth) and Y (press depth)
            const pressure = Math.min(100, Math.max(0, (landmark.y - threshold) * 200 + (landmark.z * -100)));
            fingerStates[finger] = {
                lifted: !isPressed,
                confidence: landmark.confidence,
                pressure: isPressed ? pressure : 0,
            };
            totalConfidence += landmark.confidence;
            count++;
        }
        const latency = Date.now() - startTime;
        return {
            fingers: fingerStates,
            overallConfidence: count > 0 ? totalConfidence / count : 0,
            latency: latency,
        };
    }
    updateThresholds(newThresholds) {
        this.thresholds = { ...this.thresholds, ...newThresholds };
    }
}
exports.HandDetectionService = HandDetectionService;
exports.handDetectionService = new HandDetectionService();
//# sourceMappingURL=HandDetectionService.js.map