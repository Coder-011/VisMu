import { Router } from 'express';
import * as detectionHandler from './handlers/detection';
import * as calibrationHandler from './handlers/calibration';
import * as metricsHandler from './handlers/metrics';
import * as audioHandler from './handlers/audio';
import * as configHandler from './handlers/config';

const router = Router();

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

export default router;
