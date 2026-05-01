"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const detectionHandler = __importStar(require("./handlers/detection"));
const calibrationHandler = __importStar(require("./handlers/calibration"));
const metricsHandler = __importStar(require("./handlers/metrics"));
const audioHandler = __importStar(require("./handlers/audio"));
const configHandler = __importStar(require("./handlers/config"));
const router = (0, express_1.Router)();
// Status
router.get('/status', (req, res) => {
    res.json({
        handTrackingActive: true,
        audioReady: true,
        latency: 4.2,
        systemLoad: 0.35
    });
});
// Detection
router.post('/detect/landmarks', detectionHandler.detectLandmarks);
router.post('/detect/multi-frame', detectionHandler.detectMultiFrame);
// Calibration
router.post('/calibrate/start', calibrationHandler.startCalibration);
router.post('/calibrate/record-position', calibrationHandler.recordPosition);
router.post('/calibrate/generate-profile', calibrationHandler.generateProfile);
router.get('/calibrate/profile', calibrationHandler.getProfile);
// Audio
router.get('/audio/note/:note', audioHandler.getNote);
router.post('/audio/play', audioHandler.playNote);
router.post('/audio/stop', audioHandler.stopNote);
// Config
router.get('/config/defaults', configHandler.getDefaults);
router.patch('/config/update', configHandler.updateConfig);
// Metrics
router.get('/metrics/performance', metricsHandler.getPerformance);
router.post('/metrics/log', metricsHandler.logEvent);
router.get('/metrics/session/:sessionId', metricsHandler.getSessionMetrics);
exports.default = router;
//# sourceMappingURL=routes.js.map