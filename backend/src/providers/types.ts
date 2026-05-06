export interface CrosswordPosition {
  x: number;
  y: number;
}

export interface CrosswordEntry {
  id: string;
  number: number;
  humanNumber: string;
  clue: string;
  direction: 'across' | 'down';
  length: number;
  position: CrosswordPosition;
  solution?: string;
  group: string[];
  separatorLocations?: Record<string, number[]>;
  format?: string;
}

export interface CrosswordDimensions {
  rows: number;
  cols: number;
}

export interface CrosswordData {
  id: string;
  number: number;
  name: string;
  date: number;
  entries: CrosswordEntry[];
  dimensions: CrosswordDimensions;
  crosswordType: string;
  solutionAvailable: boolean;
  provider: string;
}

export interface CrosswordProvider {
  readonly providerId: string;
  readonly crosswordType: string;
  readonly hostId: string;
  fetchForDate(date: Date): Promise<CrosswordData>;
}

export interface CrosswordHost {
  readonly hostId: string;
  readonly displayName: string;
  readonly providers: CrosswordProvider[];
}
