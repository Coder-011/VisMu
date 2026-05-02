// MediaPipe landmark indices
const TIP_IDS  = [4,  8,  12, 16, 20];
const PIP_IDS  = [3,  7,  11, 15, 19];
const MCP_IDS  = [2,  5,   9, 13, 17];

// Bansuri fingering: H1=thumb H2=index H3=middle H4=ring H5=pinky H6=pinky(doubled)
// true = hole closed (finger down)
const NOTE_MAP: Record<string, { note: string; freq: number }> = {
  // All open → Ma (lowest)
  '000000': { note: 'Ma',  freq: 261.6 },
  // Thumb only
  '100000': { note: 'Ga',  freq: 293.7 },
  // Thumb + index
  '110000': { note: 'Re',  freq: 329.6 },
  // Thumb + index + middle
  '111000': { note: 'Sa',  freq: 349.2 },
  // Thumb + index + middle + ring
  '111100': { note: 'Ni',  freq: 392.0 },
  // Thumb + index + middle + ring + pinky
  '111110': { note: 'Dha', freq: 440.0 },
  // All closed
  '111111': { note: 'Pa',  freq: 493.9 },
  // Partial combos for smoother transitions
  '011000': { note: 'Sa',  freq: 349.2 },
  '011100': { note: 'Ni',  freq: 392.0 },
  '011110': { note: 'Dha', freq: 440.0 },
  '011111': { note: 'Pa',  freq: 493.9 },
  '001000': { note: 'Ga',  freq: 293.7 },
  '001100': { note: 'Re',  freq: 329.6 },
};

// Smoothing: require note to be stable for N consecutive frames before accepting
const STABILITY_FRAMES = 3;

let pendingNote = '--';
let pendingCount = 0;
let stableNote = '--';

function smoothNote(raw: string): string {
  if (raw === pendingNote) {
    pendingCount++;
    if (pendingCount >= STABILITY_FRAMES) {
      stableNote = raw;
    }
  } else {
    pendingNote = raw;
    pendingCount = 1;
  }
  return stableNote;
}

export function detectNoteFromLandmarks(landmarks: any[]): {
  note: string; freq: number; holeStates: boolean[]; confidence: number; pressure: number;
} {
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  if (!wrist || !middleMcp) {
    return { note: '--', freq: 0, holeStates: [false,false,false,false,false,false], confidence: 0, pressure: 0 };
  }

  // Palm size for normalisation (wrist to middle MCP distance)
  const palmSize = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y) || 0.1;

  const holeStates: boolean[] = TIP_IDS.map((tipId, i) => {
    const tip = landmarks[tipId];
    const pip = landmarks[PIP_IDS[i]];
    const mcp = landmarks[MCP_IDS[i]];
    if (!tip || !pip || !mcp) return false;

    if (i === 0) {
      // Thumb: closed when tip is close to index finger MCP (landmark 5)
      const indexMcp = landmarks[5];
      if (!indexMcp) return false;
      const dist = Math.hypot(tip.x - indexMcp.x, tip.y - indexMcp.y);
      return dist < palmSize * 0.6;
    }

    // Other fingers: closed when tip is below (higher y) than MCP
    // Use normalised distance so it works at any hand size / distance
    const tipToMcp = tip.y - mcp.y;
    return tipToMcp > palmSize * 0.1;
  });

  // Build 6-hole key (H6 = pinky repeated)
  const key = [...holeStates, holeStates[4]].slice(0, 6).map(s => s ? '1' : '0').join('');
  const rawNote = NOTE_MAP[key]?.note ?? '--';
  const note = smoothNote(rawNote);
  const freq = NOTE_MAP[Object.keys(NOTE_MAP).find(k => NOTE_MAP[k].note === note) ?? '']?.freq ?? 0;

  // Confidence from landmark visibility (tasks-vision doesn't expose it, default high)
  const confidence = landmarks.reduce((s: number, lm: any) => s + (lm.visibility ?? 0.95), 0) / landmarks.length;

  return {
    note,
    freq,
    holeStates: [...holeStates, holeStates[4]].slice(0, 6),
    confidence: Math.min(confidence, 0.999),
    pressure: Math.round(50 + Math.random() * 20),
  };
}

export class HandTracking {
  private landmarker: any = null;
  private onResults: (results: any) => void;
  private ready = false;
  private lastTimestamp = -1;

  constructor(onResults: (results: any) => void) {
    this.onResults = onResults;
    this.initAsync();
  }

  private async initAsync() {
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const { HandLandmarker, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.16/wasm'
      );

      // Try GPU first, fall back to CPU
      let landmarker: any = null;
      for (const delegate of ['GPU', 'CPU'] as const) {
        try {
          landmarker = await HandLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate,
            },
            runningMode: 'VIDEO',
            numHands: 1,
          });
          console.log(`✅ HandLandmarker initialized (${delegate})`);
          break;
        } catch {
          console.warn(`HandLandmarker ${delegate} failed, trying next...`);
        }
      }

      if (!landmarker) throw new Error('All delegates failed');
      this.landmarker = landmarker;
      this.ready = true;
    } catch (err) {
      console.warn('⚠️ HandLandmarker init failed:', err);
    }
  }

  public isReady() { return this.ready; }

  public send(video: HTMLVideoElement) {
    if (!this.ready || !this.landmarker) return;
    const now = performance.now();
    // Skip if same frame
    if (now === this.lastTimestamp) return;
    this.lastTimestamp = now;

    try {
      const results = this.landmarker.detectForVideo(video, now);
      this.onResults({ multiHandLandmarks: results.landmarks ?? [] });
    } catch (err) {
      console.warn('HandLandmarker detect error:', err);
    }
  }

  public close() {
    try { this.landmarker?.close(); } catch { /* ignore */ }
  }
}
