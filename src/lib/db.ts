import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type SubscriberRecord = {
  id: number;
  email: string;
  consent: number;
  mailerlite_status: 'pending' | 'synced' | 'failed' | 'disabled' | 'not_configured';
  mailerlite_subscriber_id: string | null;
  mailerlite_error: string | null;
  created_at: string;
  updated_at: string;
};

let database: Database.Database | undefined;

export function getDatabasePath() {
  const configuredPath = process.env.DATABASE_PATH?.trim();
  return resolve(process.cwd(), configuredPath || './data/subscribers.sqlite');
}

export function createDatabase(databasePath = getDatabasePath()) {
  const absolutePath = resolve(databasePath);
  mkdirSync(dirname(absolutePath), { recursive: true });

  const db = new Database(absolutePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      consent INTEGER NOT NULL CHECK (consent IN (0, 1)),
      mailerlite_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (mailerlite_status IN ('pending', 'synced', 'failed', 'disabled', 'not_configured')),
      mailerlite_subscriber_id TEXT,
      mailerlite_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_subscribers_mailerlite_status
      ON subscribers (mailerlite_status);
  `);

  return db;
}

export function getDatabase() {
  database ||= createDatabase();
  return database;
}

export function closeDatabase() {
  if (!database) return;
  database.close();
  database = undefined;
}
