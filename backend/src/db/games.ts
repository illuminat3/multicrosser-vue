import { gamesDb } from './index';
import { v4 as uuidv4 } from 'uuid';

const GAME_TTL_MS = 36 * 60 * 60 * 1000;

export interface GameState {
  cells: Record<string, string>;
}

export interface Game {
  guid: string;
  crosswordId: string;
  state: GameState;
  createdAt: number;
  expiresAt: number;
}

interface GameRow {
  guid: string;
  crossword_id: string;
  state: string;
  created_at: number;
  expires_at: number;
}

function rowToGame(row: GameRow): Game {
  return {
    guid: row.guid,
    crosswordId: row.crossword_id,
    state: JSON.parse(row.state) as GameState,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export function getGame(guid: string): Game | null {
  const row = gamesDb
    .prepare('SELECT * FROM games WHERE guid = ?')
    .get(guid) as GameRow | undefined;

  if (!row) return null;
  if (row.expires_at < Date.now()) {
    gamesDb.prepare('DELETE FROM games WHERE guid = ?').run(guid);
    return null;
  }
  return rowToGame(row);
}

export function createGame(crosswordId: string): Game {
  const now = Date.now();
  const game: Game = {
    guid: uuidv4(),
    crosswordId,
    state: { cells: {} },
    createdAt: now,
    expiresAt: now + GAME_TTL_MS,
  };

  gamesDb
    .prepare(
      `INSERT INTO games (guid, crossword_id, state, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(game.guid, game.crosswordId, JSON.stringify(game.state), game.createdAt, game.expiresAt);

  return game;
}

export function updateCell(guid: string, x: number, y: number, value: string): Game | null {
  const game = getGame(guid);
  if (!game) return null;

  const key = `${x},${y}`;
  if (value === '') {
    delete game.state.cells[key];
  } else {
    game.state.cells[key] = value.toUpperCase();
  }

  gamesDb
    .prepare('UPDATE games SET state = ? WHERE guid = ?')
    .run(JSON.stringify(game.state), guid);

  return game;
}

export function deleteExpiredGames(): number {
  const result = gamesDb
    .prepare('DELETE FROM games WHERE expires_at < ?')
    .run(Date.now()) as { changes: number };
  return result.changes;
}
