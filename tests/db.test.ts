import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../src/lib/db';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('createDatabase', () => {
  it('tworzy tabelę subskrybentów i wymusza unikalność adresu', () => {
    const directory = mkdtempSync(join(tmpdir(), 'wianek-db-'));
    temporaryDirectories.push(directory);
    const db = createDatabase(join(directory, 'subscribers.sqlite'));

    const insert = db.prepare(
      `INSERT INTO subscribers (
         email, consent, mailerlite_status, created_at, updated_at
       ) VALUES (?, ?, 'pending', ?, ?)`,
    );
    const timestamp = new Date().toISOString();

    insert.run('test@example.com', 1, timestamp, timestamp);

    expect(() => insert.run('TEST@example.com', 1, timestamp, timestamp)).toThrow();
    db.close();
  });
});
