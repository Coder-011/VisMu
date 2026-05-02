const TIP_IDS = [4,  8,  12, 16, 20];
const MCP_IDS = [2,  5,   9, 13, 17];

const NOTE_MAP: Record<string, { note: string; freq: number }> = {
  '11111': { note: 'Sa',  freq: 261.6 },
  '11110': { note: 'Re',  freq: 293.7 },
  '11100': { note: 'Ga',  freq: 329.6 },
  '11000': { note: 'Ma',  freq: 349.2 },
  '10000': { note: 'Pa',  freq: 392.0 },
  '10001': { note: 'Dha', freq: 440.0 },
  '10011': { note: 'Ni',  freq: 493.9 },
  '00000': { note: "Sa'", freq: 523.3 },
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
  if (!wrist || !middleMcp) {
    return { note: '--', freq: 0, holeStates: Array(5).fill(false), confidence: 0, pressure: 0 };
  }

  const palmSize = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y) || 0.1;

  const holeStates = TIP_IDS.map((tipId, i) => {
    const tip = landmarks[tipId], mcp = landmarks[MCP_IDS[i]];
    if (!tip || !mcp) return false;
    if (i === 0) {
      const iMcp = landmarks[5];
      return iMcp ? Math.hypot(tip.x - iMcp.x, tip.y - iMcp.y) < palmSize * 0.6 : false;
    }
    return (mcp.y - tip.y) > palmSize * 0.1;
  });

  const key = holeStates.map(s => s ? '1' : '0').join('');
  const note = smoothNote(NOTE_MAP[key]?.note ?? '--');

  return {
    note,
    freq: FREQ_BY_NOTE[note] ?? 0,
    holeStates,
    confidence: Math.min(
      landmarks.reduce((s: number, lm: any) => s + (lm.visibility ?? 0.95), 0) / landmarks.length,
      0.999
    ),
    pressure: Math.round(50 + Math.random() * 20),
  };
}

// Path configs — CDN first for all environments, no hardcoded deployment paths
const PATH_CONFIGS = [
  {
    wasm: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.16/wasm',
    model: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    label: 'CDN (jsDelivr/GCS)',
  },
  {
    wasm: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.16/wasm',
    model: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.16/wasm/hand_landmarker.task',
    label: 'CDN (jsDelivr full)',
  },
];

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
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Model load timed out after 30s')), 30000)
    );
    try {
      await Promise.race([this.load(), timeout]);
    } catch (err: any) {
      console.error('⚠️ HandLandmarker failed to load:', err?.message ?? err);
      this.failed = true;
    }
  }

  private async load() {
    const vision = await import('@mediapipe/tasks-vision');
    const { HandLandmarker, FilesetResolver } = vision;

    let lastError = '';

    for (const { wasm, model, label } of PATH_CONFIGS) {
      for (const delegate of ['GPU', 'CPU'] as const) {
        try {
          console.log(`Trying ${label} with ${delegate}...`);
          const filesetResolver = await FilesetResolver.forVisionTasks(wasm);
          this.landmarker = await HandLandmarker.createFromOptions(filesetResolver, {
            baseOptions: { modelAssetPath: model, delegate },
            runningMode: 'VIDEO',
            numHands: 1,
          });
          console.log(`✅ HandLandmarker loaded: ${label} / ${delegate}`);
          this.ready = true;
          return;
        } catch (err: any) {
          lastError = err?.message ?? String(err);
          console.warn(`❌ ${label} (${delegate}) failed: ${lastError}`);
        }
      }
    }

    throw new Error(
      `All path/delegate combinations failed. Last error: "${lastError}". ` +
      `Check network connectivity and CORS headers.`
    );
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
    } catch (err: any) {
      console.warn('detect error:', err?.message);
    }
  }

  public close() { try { this.landmarker?.close(); } catch { /* ignore */ } }
}
