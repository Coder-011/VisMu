// Finger tip and pip landmark indices for MediaPipe hand model
const TIP_IDS = [4, 8, 12, 16, 20];
const PIP_IDS = [3, 6, 10, 14, 18];

const NOTE_MAP: Record<string, { note: string; freq: number }> = {
  '111000': { note: 'Sa',  freq: 440 },
  '110000': { note: 'Re',  freq: 494 },
  '100000': { note: 'Ga',  freq: 523 },
  '000000': { note: 'Ma',  freq: 587 },
  '111111': { note: 'Pa',  freq: 659 },
  '111110': { note: 'Dha', freq: 739 },
  '111100': { note: 'Ni',  freq: 830 },
};

export function detectNoteFromLandmarks(landmarks: any[]): {
  note: string; freq: number; holeStates: boolean[]; confidence: number; pressure: number;
} {
  // For each finger: closed = tip.y > pip.y (tip below pip in image coords)
  const holeStates: boolean[] = TIP_IDS.map((tipId, i) => {
    const tip = landmarks[tipId];
    const pip = landmarks[PIP_IDS[i]];
    if (!tip || !pip) return false;
    if (i === 0) {
      // Thumb: compare tip.x to index MCP x (landmark 5)
      const indexMcp = landmarks[5];
      return indexMcp ? tip.x > indexMcp.x : false;
    }
    return tip.y > pip.y;
  });

  // Use first 6 fingers (thumb + 4 fingers + repeat pinky as 6th hole)
  const key6 = [...holeStates.slice(0, 5), holeStates[4]].map(s => s ? '1' : '0').join('');
  const match = NOTE_MAP[key6];

  return {
    note: match?.note ?? '--',
    freq: match?.freq ?? 0,
    holeStates: holeStates.slice(0, 6).concat(holeStates.length < 6 ? [false] : []).slice(0, 6),
    confidence: 0.95,
    pressure: Math.round(Math.random() * 30 + 40),
  };
}

export class HandTracking {
  private landmarker: any = null;
  private onResults: (results: any) => void;
  private ready = false;
  private lastVideoTime = -1;

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

      this.landmarker = await HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });

      this.ready = true;
      console.log('✅ MediaPipe HandLandmarker initialized');
    } catch (err) {
      console.warn('⚠️ HandLandmarker init failed:', err);
    }
  }

  public isReady() { return this.ready; }

  public async send(video: HTMLVideoElement) {
    if (!this.ready || !this.landmarker) return;
    const now = performance.now();
    if (video.currentTime === this.lastVideoTime) return;
    this.lastVideoTime = video.currentTime;

    try {
      const results = this.landmarker.detectForVideo(video, now);
      // Adapt to the format WebcamView expects
      this.onResults({
        multiHandLandmarks: results.landmarks ?? [],
      });
    } catch (err) {
      console.warn('HandLandmarker detect error:', err);
    }
  }

  public close() {
    try { this.landmarker?.close(); } catch { /* ignore */ }
  }
}
