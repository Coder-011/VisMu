// All data stored in localStorage — no backend needed

export interface SessionMetric {
  note: string;
  latency: number;
  confidence: number;
  timestamp: string;
}

export interface CalibrationProfile {
  id: string;
  createdAt: string;
  thresholds: Record<string, number>;
}

const METRICS_KEY = 'vismu_metrics';
const CALIBRATION_KEY = 'vismu_calibration';

export function logMetric(metric: Omit<SessionMetric, 'timestamp'>) {
  try {
    const existing: SessionMetric[] = JSON.parse(localStorage.getItem(METRICS_KEY) || '[]');
    existing.push({ ...metric, timestamp: new Date().toISOString() });
    // Keep last 500 entries
    if (existing.length > 500) existing.splice(0, existing.length - 500);
    localStorage.setItem(METRICS_KEY, JSON.stringify(existing));
  } catch { /* ignore */ }
}

export function getSessionMetrics(): SessionMetric[] {
  try {
    return JSON.parse(localStorage.getItem(METRICS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearSessionMetrics() {
  localStorage.removeItem(METRICS_KEY);
}

export function saveCalibrationProfile(thresholds: Record<string, number>): CalibrationProfile {
  const profile: CalibrationProfile = {
    id: `profile_${Date.now()}`,
    createdAt: new Date().toISOString(),
    thresholds,
  };
  localStorage.setItem(CALIBRATION_KEY, JSON.stringify(profile));
  return profile;
}

export function getCalibrationProfile(): CalibrationProfile | null {
  try {
    const raw = localStorage.getItem(CALIBRATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getPerformanceSummary() {
  const metrics = getSessionMetrics();
  if (!metrics.length) return { avgLatency: 0, avgConfidence: 0, totalNotes: 0 };
  return {
    avgLatency: metrics.reduce((s, m) => s + m.latency, 0) / metrics.length,
    avgConfidence: metrics.reduce((s, m) => s + m.confidence, 0) / metrics.length,
    totalNotes: metrics.filter(m => m.note !== '--').length,
  };
}
