import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, '../../data');
fs.mkdirSync(DATA_DIR, { recursive: true });

export const crosswordsDb = new DatabaseSync(path.join(DATA_DIR, 'crosswords.db'));
export const gamesDb = new DatabaseSync(path.join(DATA_DIR, 'games.db'));

crosswordsDb.exec('PRAGMA journal_mode = WAL');
gamesDb.exec('PRAGMA journal_mode = WAL');

crosswordsDb.exec(`
  CREATE TABLE IF NOT EXISTS crosswords (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    crossword_type TEXT NOT NULL,
    date_key TEXT NOT NULL,
    data TEXT NOT NULL,
    fetched_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_crosswords_provider_date
    ON crosswords (provider_id, date_key);
`);

gamesDb.exec(`
  CREATE TABLE IF NOT EXISTS games (
    guid TEXT PRIMARY KEY,
    crossword_id TEXT NOT NULL,
    state TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_games_crossword ON games (crossword_id);
  CREATE INDEX IF NOT EXISTS idx_games_expires ON games (expires_at);
`);
