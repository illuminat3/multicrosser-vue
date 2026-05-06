import { crosswordsDb } from './index';
import { CrosswordData } from '../providers/types';
import { getProvider } from '../providers/registry';

function dateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getCachedCrossword(
  providerId: string,
  date: Date
): CrosswordData | null {
  const row = crosswordsDb
    .prepare('SELECT data FROM crosswords WHERE provider_id = ? AND date_key = ?')
    .get(providerId, dateKey(date)) as { data: string } | undefined;

  return row ? (JSON.parse(row.data) as CrosswordData) : null;
}

export function saveCrossword(data: CrosswordData, date: Date): void {
  crosswordsDb
    .prepare(
      `INSERT OR REPLACE INTO crosswords
       (id, provider_id, crossword_type, date_key, data, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(data.id, data.provider, data.crosswordType, dateKey(date), JSON.stringify(data), Date.now());
}

export async function getOrFetchCrossword(
  providerId: string,
  date: Date
): Promise<CrosswordData> {
  const cached = getCachedCrossword(providerId, date);
  if (cached) return cached;

  const provider = getProvider(providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  const data = await provider.fetchForDate(date);
  saveCrossword(data, date);
  return data;
}
