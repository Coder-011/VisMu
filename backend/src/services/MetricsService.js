"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsService = exports.MetricsService = void 0;
const db_1 = require("../database/db");
class MetricsService {
    async logMetric(sessionId, latency, confidence, note) {
        const db = (0, db_1.getDB)();
        await db.run('INSERT INTO session_metrics (session_id, latency, confidence, note) VALUES (?, ?, ?, ?)', sessionId, latency, confidence, note);
    }
    async getPerformanceMetrics() {
        const db = (0, db_1.getDB)();
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
exports.MetricsService = MetricsService;
exports.metricsService = new MetricsService();
//# sourceMappingURL=MetricsService.js.map