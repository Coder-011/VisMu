"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionMetrics = exports.logEvent = exports.getPerformance = void 0;
const express_1 = require("express");
const db_1 = require("../../database/db");
const getPerformance = async (req, res) => {
    const timeWindow = req.query.timeWindow || '1m';
    // In production, calculate from database based on timeWindow
    // For now, return sample metrics matching spec
    res.json({
        avgLatency: 4.2,
        avgConfidence: 0.992,
        fps: 60,
        cpuUsage: 0.35,
        memoryUsage: 0.42,
        droppedFrames: 0,
        audioUnderrun: false
    });
};
exports.getPerformance = getPerformance;
const logEvent = async (req, res) => {
    const { eventType, note, latency, confidence, timestamp, sessionId } = req.body;
    const db = (0, db_1.getDB)();
    try {
        await db.run(`
      INSERT INTO detection_metrics 
      (session_id, frame_latency, confidence, detected_note, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `, sessionId || 'default', latency, confidence, note, timestamp || new Date().toISOString());
        res.json({ recorded: true });
    }
    catch (err) {
        console.error('Failed to log event:', err);
        res.status(500).json({ error: 'Failed to log event' });
    }
};
exports.logEvent = logEvent;
const getSessionMetrics = async (req, res) => {
    const sessionId = req.params.sessionId;
    const db = (0, db_1.getDB)();
    try {
        const metrics = await db.all(`
      SELECT * FROM detection_metrics 
      WHERE session_id = ?
      ORDER BY timestamp DESC
    `, sessionId);
        if (metrics.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        // Calculate session stats
        const stats = {
            sessionId,
            totalFrames: metrics.length,
            avgLatency: metrics.reduce((sum, m) => sum + m.frame_latency, 0) / metrics.length,
            avgConfidence: metrics.reduce((sum, m) => sum + m.confidence, 0) / metrics.length,
            notesDetected: metrics.filter((m) => m.detected_note).length
        };
        res.json(stats);
    }
    catch (err) {
        console.error('Failed to fetch session metrics:', err);
        res.status(500).json({ error: 'Failed to fetch session metrics' });
    }
};
exports.getSessionMetrics = getSessionMetrics;
//# sourceMappingURL=metrics.js.map