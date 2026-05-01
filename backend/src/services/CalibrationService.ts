import { getDB } from '../database/db';

export class CalibrationService {
  public async saveProfile(userId: string, thresholds: any) {
    const db = getDB();
    const id = `profile_${Date.now()}`;
    await db.run(
      'INSERT INTO calibration_profiles (id, user_id, thresholds) VALUES (?, ?, ?)',
      id, userId, JSON.stringify(thresholds)
    );
    return id;
  }

  public async getLatestProfile(userId: string) {
    const db = getDB();
    const row = await db.get(
      'SELECT * FROM calibration_profiles WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      userId
    );
    return row ? { ...row, thresholds: JSON.parse(row.thresholds) } : null;
  }
}

export const calibrationService = new CalibrationService();
