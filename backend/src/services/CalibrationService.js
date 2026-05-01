"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calibrationService = exports.CalibrationService = void 0;
const db_1 = require("../database/db");
class CalibrationService {
    async saveProfile(userId, thresholds) {
        const db = (0, db_1.getDB)();
        const id = `profile_${Date.now()}`;
        await db.run('INSERT INTO calibration_profiles (id, user_id, thresholds) VALUES (?, ?, ?)', id, userId, JSON.stringify(thresholds));
        return id;
    }
    async getLatestProfile(userId) {
        const db = (0, db_1.getDB)();
        const row = await db.get('SELECT * FROM calibration_profiles WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', userId);
        return row ? { ...row, thresholds: JSON.parse(row.thresholds) } : null;
    }
}
exports.CalibrationService = CalibrationService;
exports.calibrationService = new CalibrationService();
//# sourceMappingURL=CalibrationService.js.map