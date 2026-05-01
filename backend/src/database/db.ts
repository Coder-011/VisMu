import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database;

export async function initDB() {
  db = await open({
    filename: path.join(__dirname, '../../vismu.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS calibration_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      thresholds TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS session_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      latency REAL,
      confidence REAL,
      note TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database initialized');
  return db;
}

export function getDB() {
  return db;
}
