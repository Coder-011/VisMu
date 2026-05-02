const TIP_IDS = [4,  8,  12, 16, 20];
const MCP_IDS = [2,  5,   9, 13, 17];

const NOTE_MAP: Record<string, { note: string; freq: number }> = {
  '000000': { note: 'Ma',  freq: 261.6 },
  '100000': { note: 'Ga',  freq: 293.7 },
  '110000': { note: 'Re',  freq: 329.6 },
  '111000': { note: 'Sa',  freq: 349.2 },
  '111100': { note: 'Ni',  freq: 392.0 },
  '111110': { note: 'Dha', freq: 440.0 },
  '111111': { note: 'Pa',  freq: 493.9 },
  '011000': { note: 'Sa',  freq: 349.2 },
  '011100': { note: 'Ni',  freq: 392.0 },
  '011110': { note: 'Dha', freq: 440.0 },
  '011111': { note: 'Pa',  freq: 493.9 },
  '001000': { note: 'Ga',  freq: 293.7 },
  '001100': { note: 'Re',  freq: 329.6 },
};

const FREQ_BY_NOTE: Record<string, number> = {};
for (const v of Object.values(NOTE_MAP)) FREQ_BY_NOTE[v.note] = v.freq;

let pendingNote = '--'; let pendingCount = 0; let stableNote = '--';
function smoothNote(raw: string): string {
  if (raw === pendingNote) { if (++pendingCount >= 3) stableNote = raw; }
  else { pendingNote = raw; pendingCount = 1; }
  return stableNote;
}

export function detectNoteFromLandmarks(landmarks: any[]): {
  note: string; freq: number; holeStates: boolean[]; confidence: number; pressure: number;
} {
  const wrist = landmarks[0], middleMcp = landmarks[9];
  if (!wrist || !middleMcp) return { note: '--', freq: 0, holeStates: Array(6).fill(false), confidence: 0, pressure: 0 };

  const palmSize = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y) || 0.1;

  const holeStates = TIP_IDS.map((tipId, i) => {
    const tip = landmarks[tipId], mcp = landmarks[MCP_IDS[i]];
    if (!tip || !mcp) return false;
    if (i === 0) {
      const iMcp = landmarks[5];
      return iMcp ? Math.hypot(tip.x - iMcp.x, tip.y - iMcp.y) < palmSize * 0.6 : false;
    }
    return (tip.y - mcp.y) > palmSize * 0.1;
  });

  const key = [...holeStates, holeStates[4]].slice(0, 6).map(s => s ? '1' : '0').join('');
  const note = smoothNote(NOTE_MAP[key]?.note ?? '--');
  return {
    note, freq: FREQ_BY_NOTE[note] ?? 0,
    holeStates: [...holeStates, holeStates[4]].slice(0, 6),
    confidence: Math.min(landmarks.reduce((s: number, lm: any) => s + (lm.visibility ?? 0.95), 0) / landmarks.length, 0.999),
    pressure: Math.round(50 + Math.random() * 20),
  };
}

export class HandTracking {
  private landmarker: any = null;
  private onResults: (r: any) => void;
  private ready = false;
  private failed = false;
  private lastTs = -1;

  constructor(onResults: (r: any) => void) {
    this.onResults = onResults;
    this.initAsync();
  }

  private async initAsync() {
    // 30 second hard timeout
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Model load timeout after 30s')), 30000)
    );

    try {
      await Promise.race([this.load(), timeout]);
    } catch (err) {
      console.warn('⚠️ HandLandmarker failed:', err);
      this.failed = true;
    }
  }

  private async load() {
    const vision = await import('@mediapipe/tasks-vision');
    const { HandLandmarker, FilesetResolver } = vision;

    // Use locally deployed WASM assets (from deploy workflow) to avoid CDN latency
    const wasmPath = window.location.origin + '/VisMu/mediapipe';

    const filesetResolver = await FilesetResolver.forVisionTasks(wasmPath);

    // Local model first, CDN fallback
    const modelPaths = [
      window.location.origin + '/VisMu/mediapipe/hand_landmarker.task',
      'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    ];

    for (const modelAssetPath of modelPaths) {
      for (const delegate of ['GPU', 'CPU'] as const) {
        try {
          this.landmarker = await HandLandmarker.createFromOptions(filesetResolver, {
            baseOptions: { modelAssetPath, delegate },
            runningMode: 'VIDEO',
            numHands: 1,
          });
          console.log(`✅ HandLandmarker ready (${delegate}, ${modelAssetPath.includes('VisMu') ? 'local' : 'CDN'})`);
          this.ready = true;
          return;
        } catch { /* try next */ }
      }
    }
    throw new Error('All model/delegate combinations failed');
  }

  public isReady() { return this.ready; }
  public isFailed() { return this.failed; }

  public send(video: HTMLVideoElement) {
    if (!this.ready || !this.landmarker) return;
    const now = performance.now();
    if (now === this.lastTs) return;
    this.lastTs = now;
    try {
      const results = this.landmarker.detectForVideo(video, now);
      this.onResults({ multiHandLandmarks: results.landmarks ?? [] });
    } catch (err) {
      console.warn('detect error:', err);
    }
  }

  public close() { try { this.landmarker?.close(); } catch { /* ignore */ } }
}
