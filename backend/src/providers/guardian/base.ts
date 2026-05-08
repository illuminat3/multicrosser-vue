import { CrosswordData, CrosswordProvider } from "../types";

const GUARDIAN_SITE = "https://www.theguardian.com/crosswords";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json",
};

export interface GuardianAnchor {
  number: number;
  date: string;
}

export abstract class GuardianBaseProvider implements CrosswordProvider {
  readonly hostId = "guardian";
  abstract readonly providerId: string;
  abstract readonly crosswordType: string;
  abstract readonly anchor: GuardianAnchor;

  async fetchForDate(date: Date): Promise<CrosswordData> {
    const number = this.numberForDate(date);
    return this.fetchWithFallback(number);
  }

  private numberForDate(date: Date): number {
    const p = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const get = (t: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === t)!.value;
    const ukDateStr = `${get("year")}-${get("month")}-${get("day")}`;
    const anchorMs = new Date(this.anchor.date).getTime();
    const targetMs = new Date(ukDateStr).getTime();
    const daysDiff = Math.round((targetMs - anchorMs) / 86_400_000);
    return this.anchor.number + daysDiff;
  }

  private async fetchWithFallback(number: number): Promise<CrosswordData> {
    const candidates = [0, 1, -1, 2, -2, 3, -3].map((d) => number + d);

    for (const n of candidates) {
      const result = await this.tryFetch(n);
      if (result) return result;
    }

    throw new Error(`Guardian ${this.crosswordType} #${number} (±3) not found`);
  }

  private async tryFetch(number: number): Promise<CrosswordData | null> {
    const url = `${GUARDIAN_SITE}/${this.crosswordType}/${number}.json`;
    try {
      const res = await fetch(url, { headers: FETCH_HEADERS });
      if (!res.ok) return null;
      return this.parseResponse((await res.json()) as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  protected parseResponse(raw: Record<string, unknown>): CrosswordData {
    const data = (raw as { crossword?: Record<string, unknown> }).crossword ?? raw;
    return {
      id: `${this.providerId}:${data["number"] as number}`,
      number: data["number"] as number,
      name: data["name"] as string,
      date: data["date"] as number,
      entries: data["entries"] as CrosswordData["entries"],
      dimensions: data["dimensions"] as CrosswordData["dimensions"],
      crosswordType: this.crosswordType,
      solutionAvailable: (data["solutionAvailable"] as boolean) ?? false,
      provider: this.providerId,
    };
  }
}
