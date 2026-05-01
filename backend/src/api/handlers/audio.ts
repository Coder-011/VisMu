import { Request, Response } from 'express';
import { noteMappingService } from '../../services/NoteMappingService';

export const getNote = (req: Request, res: Response) => {
  const { note } = req.params;
  const freq = noteMappingService.getFrequency(note as any);
  if (!freq) return res.status(404).json({ error: 'Note not found' });
  res.json({ note, frequency: freq });
};

export const playNote = (req: Request, res: Response) => {
  const { note, sessionId } = req.body;
  const freq = noteMappingService.getFrequency(note);
  res.json({ note, frequency: freq, sessionId, playing: true });
};

export const stopNote = (req: Request, res: Response) => {
  res.json({ stopped: true });
};
