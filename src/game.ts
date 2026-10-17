import wordsData from "./assets/data/words.json"

export const words = wordsData as Record<string, string[]>;
export const categories = Object.keys(words);

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 20;

export interface GameSettings {
  category: string;
  players: number;
  time: number;
}