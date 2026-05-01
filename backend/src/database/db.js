"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDB = initDB;
exports.getDB = getDB;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
let db;
async function initDB() {
    db = await (0, sqlite_1.open)({
        filename: path_1.default.join(__dirname, '../../vismu.db'),
        driver: sqlite3_1.default.Database
    });
    await db.exec(`
    -- Users & Sessions
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active_at DATETIME,
      device_info TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      note_count INTEGER DEFAULT 0,
      accuracy REAL DEFAULT 0.0,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    -- Calibration Data
    CREATE TABLE IF NOT EXISTS calibration_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      hole_thresholds TEXT,
      ambient_light TEXT,
      camera_model TEXT,
      accuracy REAL,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    );

    -- Detection Metrics
    CREATE TABLE IF NOT EXISTS detection_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      frame_latency REAL,
      confidence REAL,
      detected_note TEXT,
      finger_state TEXT,
      hole_state TEXT,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    );

    -- Audio Events
    CREATE TABLE IF NOT EXISTS audio_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      note TEXT,
      start_time REAL,
      duration REAL,
      confidence REAL,
      pressure REAL,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    );

    -- User Preferences
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      pressure_sensitivity REAL DEFAULT 0.8,
      calibration_mode TEXT DEFAULT 'auto',
      audio_format TEXT DEFAULT 'wav',
      smoothing_algorithm TEXT DEFAULT 'kalman',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
    console.log('Database initialized with full schema');
    return db;
}
function getDB() {
    return db;
}
//# sourceMappingURL=db.js.map