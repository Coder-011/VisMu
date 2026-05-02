const TIP_IDS = [4,  8,  12, 16, 20];
const MCP_IDS = [2,  5,   9, 13, 17];

// C-scale bansuri: 5 holes (thumb + 4 fingers), key built from 5 booleans
const NOTE_MAP: Record<string, { note: string; freq: number }> = {
  '11111': { note: 'Sa',  freq: 261.6 }, // all closed  → C4
  '11110': { note: 'Re',  freq: 293.7 }, // pinky open  → D4
  '11100': { note: 'Ga',  freq: 329.6 }, // ring+pinky  → E4
  '11000': { note: 'Ma',  freq: 349.2 }, // middle+ring+pinky → F4
  '10000': { note: 'Pa',  freq: 392.0 }, // only thumb  → G4
  '10001': { note: 'Dha', freq: 440.0 }, // thumb+pinky → A4
  '10011': { note: 'Ni',  freq: 493.9 }, // thumb+ring+pinky → B4
  '00000': { note: "Sa'", freq: 523.3 }, // all open    → C5
};

const FREQ_BY_NOTE: Record<string, number> = {};
for (const v of Object.values(NOTE_MAP)) FREQ_BY_NOTE[v.note] = v.freq;

// Smoothing: note must be stable for 3 consecutive frames
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

  // Bug 4 fix: closed finger = tip.y < mcp.y (tip ABOVE knuckle in MediaPipe coords)
  const holeStates = TIP_IDS.map((tipId, i) => {
    const tip = landmarks[tipId], mcp = landmarks[MCP_IDS[i]];
    if (!tip || !mcp) return false;
    if (i === 0) {
      // Thumb: closed when tip is near index MCP
      const iMcp = landmarks[5];
      return iMcp ? Math.hypot(tip.x - iMcp.x, tip.y - iMcp.y) < palmSize * 0.6 : false;
    }
    // Bug 4 fix: mcp.y - tip.y > threshold means tip is ABOVE mcp = finger CLOSED
    return (mcp.y - tip.y) > palmSize * 0.1;
  });

  // Bug 3 fix: 5-char key from 5 fingers — no duplicate pinky
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
      setTimeout(() => reject(new Error('timeout')), 30000)
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

    // Bug 1 fix: use CDN on localhost, local assets on GitHub Pages
    const isProd = window.location.hostname !== 'localhost' &&
                   window.location.hostname !== '127.0.0.1';
    const wasmPath = isProd
      ? window.location.origin + '/VisMu/mediapipe'
      : 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.16/wasm';

    const filesetResolver = await FilesetResolver.forVisionTasks(wasmPath);

    const modelPaths = isProd
      ? [window.location.origin + '/VisMu/mediapipe/hand_landmarker.task']
      : ['https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'];

    for (const modelAssetPath of modelPaths) {
      for (const delegate of ['GPU', 'CPU'] as const) {
        try {
          this.landmarker = await HandLandmarker.createFromOptions(filesetResolver, {
            baseOptions: { modelAssetPath, delegate },
            runningMode: 'VIDEO',
            numHands: 1,
          });
          console.log(`✅ HandLandmarker ready (${delegate})`);
          this.ready = true;
          return;
        } catch { /* try next */ }
      }
    }
    throw new Error('All combinations failed');
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
