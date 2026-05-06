export interface CrosswordPosition {
  x: number;
  y: number;
}

export interface CrosswordEntry {
  id: string;
  number: number;
  humanNumber: string;
  clue: string;
  direction: "across" | "down";
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

export interface CrosswordProviderMeta {
  providerId: string;
  crosswordType: string;
}

export interface CrosswordHostMeta {
  hostId: string;
  displayName: string;
  providers: CrosswordProviderMeta[];
}
