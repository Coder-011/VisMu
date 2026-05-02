const TIP_IDS = [4,  8,  12, 16, 20];
const MCP_IDS = [2,  5,   9, 13, 17];

// C-scale bansuri — 6 holes
// All 6 closed  → Sa  (C4, 261.6 Hz)
// Open 1 hole   → Re  (D4, 293.7 Hz)  — open H6 (pinky side)
// Open 2 holes  → Ga  (E4, 329.6 Hz)  — open H5+H6
// Open 3 holes  → Ma  (F4, 349.2 Hz)  — open H4+H5+H6
// Open 4 holes  → Pa  (G4, 392.0 Hz)  — open H3+H4+H5+H6
// Open 5 holes  → Dha (A4, 440.0 Hz)  — open H2+H3+H4+H5+H6
// Open 6 holes  → Ni  (B4, 493.9 Hz)  — all open
// All open      → Sa' (C5, 523.3 Hz)  — same as all open (octave)
const NOTE_MAP: Record<string, { note: string; freq: number }> = {
  '111111': { note: 'Sa',  freq: 261.6 },
  '111110': { note: 'Re',  freq: 293.7 },
  '111100': { note: 'Ga',  freq: 329.6 },
  '111000': { note: 'Ma',  freq: 349.2 },
  '110000': { note: 'Pa',  freq: 392.0 },
  '100000': { note: 'Dha', freq: 440.0 },
  '000000': { note: 'Ni',  freq: 493.9 },
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
    return { note: '--', freq: 0, holeStates: Array(6).fill(false), confidence: 0, pressure: 0 };
  }

  const palmSize = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y) || 0.1;

  // 5 fingers → 6 holes (H6 mirrors H5/pinky)
  const fingers = TIP_IDS.map((tipId, i) => {
    const tip = landmarks[tipId], mcp = landmarks[MCP_IDS[i]];
    if (!tip || !mcp) return false;
    if (i === 0) {
      // Thumb: closed when tip near index MCP
      const iMcp = landmarks[5];
      return iMcp ? Math.hypot(tip.x - iMcp.x, tip.y - iMcp.y) < palmSize * 0.6 : false;
    }
    // Finger closed: tip is ABOVE mcp (mcp.y > tip.y in MediaPipe coords)
    return (mcp.y - tip.y) > palmSize * 0.1;
  });

  const holeStates: boolean[] = [...fingers, fingers[4]]; // H6 = pinky mirror
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
      setTimeout(() => reject(new Error('timeout after 30s')), 30000)
    );
    try {
      await Promise.race([this.load(), timeout]);
    } catch (err: any) {
      console.error('⚠️ HandLandmarker failed:', err?.message ?? err);
      this.failed = true;
    }
  }

  private async load() {
    const vision = await import('@mediapipe/tasks-vision');
    const { HandLandmarker, FilesetResolver } = vision;

    // BASE_URL is '/' on localhost, '/VisMu/' on GitHub Pages — set by Vite
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const localWasm = `${window.location.origin}${base}/mediapipe`;
    const localModel = `${window.location.origin}${base}/mediapipe/hand_landmarker.task`;
    const cdnModel = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

    const cdnWasm = 'https://unpkg.com/@mediapipe/tasks-vision@0.10.3/wasm';

    const configs = [
      { wasm: localWasm, model: localModel, label: 'local' },
      { wasm: cdnWasm,   model: cdnModel,   label: 'cdn'   },
    ];

    let lastErr = '';
    for (const { wasm, model, label } of configs) {
      for (const delegate of ['GPU', 'CPU'] as const) {
        try {
          console.log(`[HandTracking] trying ${label} / ${delegate} — wasm: ${wasm}`);
          const fs = await FilesetResolver.forVisionTasks(wasm);
          this.landmarker = await HandLandmarker.createFromOptions(fs, {
            baseOptions: { modelAssetPath: model, delegate },
            runningMode: 'VIDEO',
            numHands: 1,
          });
          console.log(`✅ HandLandmarker ready: ${label} / ${delegate}`);
          this.ready = true;
          return;
        } catch (err: any) {
          lastErr = err?.message ?? String(err);
          console.warn(`❌ ${label} / ${delegate}: ${lastErr}`);
        }
      }
    }
    throw new Error(`All attempts failed. Last error: ${lastErr}`);
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
