const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export const hasBackend = !!API_URL;

export async function detectLandmarks(landmarks: any[]): Promise<{
  note: string;
  frequency: number;
  holeStates: boolean[];
  confidence: number;
  pressure: number;
} | null> {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}/api/detect/landmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ landmarks, timestamp: Date.now() }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      note: data.currentNote ?? '--',
      frequency: data.frequency ?? 0,
      holeStates: [
        data.fingerState.thumb,
        data.fingerState.index,
        data.fingerState.middle,
        data.fingerState.ring,
        data.fingerState.pinky,
        data.fingerState.extra,
      ],
      confidence: data.confidence ?? 0.95,
      pressure: data.pressure?.[0] ?? 50,
    };
  } catch {
    return null;
  }
}

export async function logMetric(payload: {
  note: string; latency: number; confidence: number; sessionId: string;
}) {
  if (!API_URL) return;
  try {
    await fetch(`${API_URL}/api/metrics/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, eventType: 'note_detected', timestamp: new Date().toISOString() }),
    });
  } catch { /* non-critical */ }
}

export async function getBackendStatus(): Promise<boolean> {
  if (!API_URL) return false;
  try {
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
