// Note mapping logic (runs entirely client-side, no backend needed)
const NOTE_MAP: Record<string, { note: string; freq: number }> = {
  '111000': { note: 'Sa', freq: 440 },
  '110000': { note: 'Re', freq: 494 },
  '100000': { note: 'Ga', freq: 523 },
  '000000': { note: 'Ma', freq: 587 },
  '111111': { note: 'Pa', freq: 659 },
  '111110': { note: 'Dha', freq: 739 },
  '111100': { note: 'Ni', freq: 830 },
};

export function detectNoteFromLandmarks(landmarks: any[]): {
  note: string;
  freq: number;
  holeStates: boolean[];
  confidence: number;
  pressure: number;
} {
  // Fingertip landmark indices in MediaPipe hand model
  const FINGERTIP_IDS = [4, 8, 12, 16, 20, 0]; // thumb, index, middle, ring, pinky, wrist
  const PALM_Y = landmarks[9]?.y ?? 0.5; // MCP of middle finger as reference

  const holeStates: boolean[] = FINGERTIP_IDS.map((id, i) => {
    const tip = landmarks[id];
    if (!tip) return false;
    if (i === 0) {
      // Thumb: compare to index MCP
      return tip.y > (landmarks[5]?.y ?? 0.5);
    }
    if (i === 5) {
      // Wrist/extra: always treat as matching thumb
      return holeStates[0] ?? false;
    }
    // For other fingers, "closed" = fingertip below its MCP joint
    const mcpId = id - 2; // MCP is 2 landmarks before tip
    const mcp = landmarks[mcpId];
    return tip.y > (mcp?.y ?? PALM_Y);
  });

  // Build key string
  const key = holeStates.map(s => s ? '1' : '0').join('');
  const match = NOTE_MAP[key];

  // Average confidence from landmark visibility
  const avgConf = landmarks.reduce((sum: number, lm: any) => sum + (lm.visibility ?? 0.95), 0) / landmarks.length;

  return {
    note: match?.note ?? '--',
    freq: match?.freq ?? 0,
    holeStates,
    confidence: Math.min(avgConf, 0.999),
    pressure: Math.round(Math.random() * 30 + 40), // simulated
  };
}

export class HandTracking {
  private hands: any = null;
  private onResults: (results: any) => void;
  private ready = false;

  constructor(onResults: (results: any) => void) {
    this.onResults = onResults;
    this.initAsync();
  }

  private async initAsync() {
    try {
      // Dynamic import to avoid build-time issues
      const handsModule = await import('@mediapipe/hands');
      const HandsClass = (handsModule as any).Hands
        || (handsModule as any).default?.Hands
        || (handsModule as any).default;

      if (!HandsClass) {
        console.error('MediaPipe Hands class not found in module:', Object.keys(handsModule));
        return;
      }

      this.hands = new HandsClass({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      this.hands.onResults(this.onResults);
      this.ready = true;
      console.log('✅ MediaPipe Hands initialized');
    } catch (err) {
      console.warn('⚠️ MediaPipe Hands failed to init, will use demo mode:', err);
    }
  }

  public isReady() {
    return this.ready;
  }

  public async send(image: HTMLVideoElement | HTMLCanvasElement) {
    if (!this.ready || !this.hands) return;
    try {
      await this.hands.send({ image });
    } catch (err) {
      console.warn('MediaPipe send error:', err);
    }
  }

  public close() {
    try {
      this.hands?.close();
    } catch { /* ignore */ }
  }
}
