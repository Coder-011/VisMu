import { Request, Response } from 'express';

const defaults = {
  pressureSensitivity: 0.8,
  calibrationMode: 'auto',
  smoothingAlgorithm: 'kalman',
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
  maxNumHands: 1,
};

let currentConfig = { ...defaults };

export const getDefaults = (req: Request, res: Response) => {
  res.json(currentConfig);
};

export const updateConfig = (req: Request, res: Response) => {
  const updates = req.body;
  currentConfig = { ...currentConfig, ...updates };
  res.json({ updated: true, config: currentConfig });
};
