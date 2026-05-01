import { Router } from 'express';
import * as detectionHandler from './handlers/detection';
import * as calibrationHandler from './handlers/calibration';
import * as metricsHandler from './handlers/metrics';

const router = Router();

// Detection
router.post('/detect/landmarks', detectionHandler.detectLandmarks);

// Calibration
router.post('/calibrate/start', calibrationHandler.startCalibration);
router.post('/calibrate/record-position', calibrationHandler.recordPosition);
router.post('/calibrate/generate-profile', calibrationHandler.generateProfile);
router.get('/calibrate/profile', calibrationHandler.getProfile);

// Metrics
router.get('/metrics/performance', metricsHandler.getPerformance);
router.post('/metrics/log', metricsHandler.logEvent);

export default router;
