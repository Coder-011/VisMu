import { Request, Response } from 'express';
import { handDetectionService } from '../../services/HandDetectionService';
import { noteMappingService } from '../../services/NoteMappingService';

export const detectLandmarks = (req: Request, res: Response) => {
  const { landmarks, timestamp } = req.body;

  if (!landmarks || !Array.isArray(landmarks)) {
    return res.status(400).json({ error: 'Invalid landmarks data' });
  }

  const startTime = timestamp || Date.now();
  const detectionResult = handDetectionService.processLandmarks(landmarks, startTime);

  // Map finger states to holes
  // Thumb: H1, Index: H2, Middle: H3, Ring: H4, Pinky: H5, Extra: H6
  const holeState = {
    H1: !detectionResult.fingers.thumb.lifted,
    H2: !detectionResult.fingers.indexFinger.lifted,
    H3: !detectionResult.fingers.middleFinger.lifted,
    H4: !detectionResult.fingers.ringFinger.lifted,
    H5: !detectionResult.fingers.pinkyFinger.lifted,
    H6: !detectionResult.fingers.extraFinger.lifted,
  };

  const currentNote = noteMappingService.determineNote(holeState);
  const frequency = noteMappingService.getFrequency(currentNote);

  res.json({
    fingerState: {
      thumb: !detectionResult.fingers.thumb.lifted,
      index: !detectionResult.fingers.indexFinger.lifted,
      middle: !detectionResult.fingers.middleFinger.lifted,
      ring: !detectionResult.fingers.ringFinger.lifted,
      pinky: !detectionResult.fingers.pinkyFinger.lifted,
      extra: !detectionResult.fingers.extraFinger.lifted,
    },
    holeState,
    currentNote,
    frequency,
    confidence: detectionResult.overallConfidence,
    latency: detectionResult.latency,
    pressure: [
      detectionResult.fingers.thumb.pressure,
      detectionResult.fingers.indexFinger.pressure,
      detectionResult.fingers.middleFinger.pressure,
      detectionResult.fingers.ringFinger.pressure,
      detectionResult.fingers.pinkyFinger.pressure,
      detectionResult.fingers.extraFinger.pressure,
    ],
  });
};

export const detectMultiFrame = (req: Request, res: Response) => {
  const { frames } = req.body;

  if (!frames || !Array.isArray(frames) || frames.length === 0) {
    return res.status(400).json({ error: 'Invalid frames data' });
  }

  try {
    const results = frames.map((frame: any) => {
      const startTime = frame.timestamp || Date.now();
      const detectionResult = handDetectionService.processLandmarks(frame.landmarks, startTime);

      const holeState = {
        H1: !detectionResult.fingers.thumb.lifted,
        H2: !detectionResult.fingers.indexFinger.lifted,
        H3: !detectionResult.fingers.middleFinger.lifted,
        H4: !detectionResult.fingers.ringFinger.lifted,
        H5: !detectionResult.fingers.pinkyFinger.lifted,
        H6: !detectionResult.fingers.extraFinger.lifted,
      };

      const currentNote = noteMappingService.determineNote(holeState);
      const frequency = noteMappingService.getFrequency(currentNote);

      return {
        fingerState: {
          thumb: !detectionResult.fingers.thumb.lifted,
          index: !detectionResult.fingers.indexFinger.lifted,
          middle: !detectionResult.fingers.middleFinger.lifted,
          ring: !detectionResult.fingers.ringFinger.lifted,
          pinky: !detectionResult.fingers.pinkyFinger.lifted,
          extra: !detectionResult.fingers.extraFinger.lifted,
        },
        holeState,
        currentNote,
        frequency,
        confidence: detectionResult.overallConfidence,
        latency: detectionResult.latency,
        pressure: [
          detectionResult.fingers.thumb.pressure,
          detectionResult.fingers.indexFinger.pressure,
          detectionResult.fingers.middleFinger.pressure,
          detectionResult.fingers.ringFinger.pressure,
          detectionResult.fingers.pinkyFinger.pressure,
          detectionResult.fingers.extraFinger.pressure,
        ],
      };
    });

    // Apply simple smoothing (average confidence and latency)
    const avgConfidence = results.reduce((sum: number, r: any) => sum + r.confidence, 0) / results.length;
    const avgLatency = results.reduce((sum: number, r: any) => sum + r.latency, 0) / results.length;

    res.json({
      frames: results,
      summary: {
        avgConfidence,
        avgLatency,
        frameCount: results.length,
      },
    });
  } catch (err) {
    console.error('Multi-frame detection error:', err);
    res.status(500).json({ error: 'Failed to process frames' });
  }
};