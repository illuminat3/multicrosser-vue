import type { CrosswordData, CrosswordHostMeta, Game } from "@/types";

const BASE = "/api";

export async function fetchHosts(): Promise<CrosswordHostMeta[]> {
  const res = await fetch(`${BASE}/crosswords/hosts`);
  if (!res.ok) throw new Error("Failed to fetch hosts");
  return res.json() as Promise<CrosswordHostMeta[]>;
}

export async function fetchTodaysCrossword(
  providerId: string,
  signal?: AbortSignal,
): Promise<CrosswordData> {
  const res = await fetch(`${BASE}/crosswords/${providerId}/today`, { signal });
  if (!res.ok) throw new Error(`Failed to fetch crossword for ${providerId}`);
  return res.json() as Promise<CrosswordData>;
}

export async function createGame(crosswordId: string): Promise<Game> {
  const res = await fetch(`${BASE}/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ crosswordId }),
  });
  if (!res.ok) throw new Error("Failed to create game");
  return res.json() as Promise<Game>;
}

export async function fetchGame(crosswordId: string, guid: string): Promise<Game> {
  const res = await fetch(`${BASE}/games/${crosswordId}/${guid}`);
  if (!res.ok) throw new Error("Game not found or expired");
  return res.json() as Promise<Game>;
}
