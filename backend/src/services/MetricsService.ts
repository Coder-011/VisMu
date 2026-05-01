import { getDB } from '../database/db';

export class MetricsService {
  public async logMetric(sessionId: string, latency: number, confidence: number, note: string | null) {
    const db = getDB();
    await db.run(
      'INSERT INTO session_metrics (session_id, latency, confidence, note) VALUES (?, ?, ?, ?)',
      sessionId, latency, confidence, note
    );
  }

  public async getPerformanceMetrics() {
    const db = getDB();
    const stats = await db.get(`
      SELECT 
        AVG(latency) as avgLatency, 
        AVG(confidence) as avgConfidence, 
        COUNT(*) as totalFrames 
      FROM session_metrics
    `);
    return stats;
  }
}

export const metricsService = new MetricsService();
