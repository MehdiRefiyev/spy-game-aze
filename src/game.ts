import wordsData from "./assets/data/words.json";

export const words = wordsData as Record<string, string[]>;
export const categories = Object.keys(words);

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 20;

// Rule: spies must always be fewer than the other players.
// 3-4 players -> 1, 5-6 -> 2, ... 19-20 -> 9
export const maxSpiesFor = (players: number) =>
  Math.max(1, Math.floor((players - 1) / 2));

/** Data passed from Home to Cards via router state (already resolved). */
export interface GameSettings {
  category: string; // the category that was actually picked
  word: string; // the secret word
  players: number;
  spies: number[]; // 0-based player indexes, all different
  time: number; // minutes
  categoryHidden: boolean; // true -> players don't know the category yet
}

export interface SetupOptions {
  categories: string[]; // categories chosen by the host
  randomCategory: boolean; // ignore `categories`, use all of them
  players: number;
  spies: number;
  time: number;
}

// ---------- randomness ----------

/** Unbiased random integer in [0, max). Uses crypto, no modulo bias. */
export const randomInt = (max: number): number => {
  if (max <= 1) return 0;
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
};

/** `count` different random items (partial Fisher-Yates). */
export const pickDistinct = <T>(list: readonly T[], count: number): T[] => {
  const copy = [...list];
  const n = Math.min(count, copy.length);
  for (let i = 0; i < n; i++) {
    const j = i + randomInt(copy.length - i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
};

// ---------- history: fewer repeats between games ----------

const HISTORY_KEY = "spy-game:recent";
const HISTORY_LIMIT = 60;

interface History {
  used: string[]; // "category|word", oldest first
  lastCategory: string | null;
}

const readHistory = (): History => {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "null");
    if (parsed && Array.isArray(parsed.used)) {
      return {
        used: parsed.used.filter((x: unknown) => typeof x === "string"),
        lastCategory:
          typeof parsed.lastCategory === "string" ? parsed.lastCategory : null,
      };
    }
  } catch {
    // storage blocked or corrupted: behave like a fresh start
  }
  return { used: [], lastCategory: null };
};

const writeHistory = (h: History) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
  } catch {
    // ignore: the game works without history
  }
};

// ---------- round creation ----------

export const createGame = (o: SetupOptions): GameSettings => {
  const pool = o.randomCategory
    ? categories
    : o.categories.filter((c) => words[c]?.length > 0);

  const history = readHistory();

  // don't repeat the previous category when there is a choice
  const categoryChoices =
    pool.length > 1 ? pool.filter((c) => c !== history.lastCategory) : pool;
  const category = categoryChoices[randomInt(categoryChoices.length)];

  const list = words[category];
  const keyOf = (w: string) => `${category}|${w}`;

  let used = history.used;
  let fresh = list.filter((w) => !used.includes(keyOf(w)));

  if (fresh.length === 0) {
    // whole category was played recently: start a new cycle,
    // but never repeat the very last word
    const last = used[used.length - 1];
    used = used.filter((k) => !k.startsWith(`${category}|`));
    fresh = list.length > 1 ? list.filter((w) => keyOf(w) !== last) : list;
  }

  const word = fresh[randomInt(fresh.length)];

  writeHistory({
    used: [...used, keyOf(word)].slice(-HISTORY_LIMIT),
    lastCategory: category,
  });

  const spyCount = Math.min(Math.max(1, o.spies), maxSpiesFor(o.players));
  const spies = pickDistinct(
    Array.from({ length: o.players }, (_, i) => i),
    spyCount,
  ).sort((a, b) => a - b);

  return {
    category,
    word,
    players: o.players,
    spies,
    time: o.time,
    categoryHidden: o.randomCategory || pool.length > 1,
  };
};