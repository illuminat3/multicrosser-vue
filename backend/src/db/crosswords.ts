import { crosswordsDb } from "./index";
import { CrosswordData } from "../providers/types";
import { getProvider } from "../providers/registry";

export function dateKey(date: Date): string {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function getCachedCrossword(providerId: string, date: Date): CrosswordData | null {
  const row = crosswordsDb
    .prepare("SELECT data FROM crosswords WHERE provider_id = ? AND date_key = ?")
    .get(providerId, dateKey(date)) as { data: string } | undefined;

  return row ? (JSON.parse(row.data) as CrosswordData) : null;
}

export function saveCrossword(data: CrosswordData, date: Date): void {
  crosswordsDb
    .prepare(
      `INSERT OR REPLACE INTO crosswords
       (id, provider_id, crossword_type, date_key, data, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      data.id,
      data.provider,
      data.crosswordType,
      dateKey(date),
      JSON.stringify(data),
      Date.now(),
    );
}

export async function getOrFetchCrossword(providerId: string, date: Date): Promise<CrosswordData> {
  const cached = getCachedCrossword(providerId, date);
  if (cached) return cached;

  const provider = getProvider(providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  const data = await provider.fetchForDate(date);
  saveCrossword(data, date);
  return data;
}

export function getAvailableDates(providerId: string, limit = 30): string[] {
  const rows = crosswordsDb
    .prepare(
      "SELECT DISTINCT date_key FROM crosswords WHERE provider_id = ? ORDER BY date_key DESC LIMIT ?",
    )
    .all(providerId, limit) as { date_key: string }[];
  return rows.map((r) => r.date_key);
}

export function deleteOldCrosswords(daysToKeep = 30): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  const result = crosswordsDb
    .prepare("DELETE FROM crosswords WHERE date_key < ?")
    .run(dateKey(cutoff));
  return Number(result.changes);
}
