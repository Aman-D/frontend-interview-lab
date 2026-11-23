export interface Rankable {
  id: string;
  title: string;
}

/** Match quality, best first. NONE means "exclude". */
export const Tier = { NONE: 0, SUBSEQUENCE: 1, SUBSTRING: 2, WORD_START: 3, PREFIX: 4 } as const;

const WORD_CHAR = /[\p{L}\p{N}]/u;

/** `q` must already be trimmed and lower-cased; `title` is lower-cased here. */
export function matchTier(q: string, title: string): number {
  const t = title.toLowerCase();
  if (t.startsWith(q)) return Tier.PREFIX;

  // Look at EVERY occurrence: "reset settings" has "set" mid-word first and at a word start second.
  let at = t.indexOf(q);
  const isSubstring = at !== -1;
  while (at !== -1) {
    if (at === 0 || !WORD_CHAR.test(t[at - 1])) return Tier.WORD_START;
    at = t.indexOf(q, at + 1);
  }
  if (isSubstring) return Tier.SUBSTRING;

  // Greedy in-order scan is enough to decide "is a subsequence" (and handles repeated letters).
  const chars = q.replace(/\s+/g, '');
  let i = 0;
  for (let k = 0; k < t.length && i < chars.length; k++) {
    if (t[k] === chars[i]) i++;
  }
  return i === chars.length ? Tier.SUBSEQUENCE : Tier.NONE;
}

/**
 * Filters and orders `commands` for `query`. Pure: never mutates its inputs, always returns a new array.
 * See the starter file for the full rules.
 */
export function rankCommands<T extends Rankable>(query: string, commands: readonly T[], recentIds: readonly string[] = []): T[] {
  // First occurrence wins, so ['b', 'a', 'b'] means "b most recent, then a".
  const recency = new Map<string, number>();
  recentIds.forEach((id, i) => {
    if (!recency.has(id)) recency.set(id, i);
  });
  const NOT_RECENT = Number.MAX_SAFE_INTEGER;

  const q = query.trim().toLowerCase();
  const scored: { command: T; index: number; tier: number; recent: number }[] = [];
  commands.forEach((command, index) => {
    // With an empty query every command is an equally good "match", so only recency and order matter.
    const tier = q === '' ? Tier.PREFIX : matchTier(q, command.title);
    if (tier === Tier.NONE) return;
    scored.push({ command, index, tier, recent: recency.get(command.id) ?? NOT_RECENT });
  });

  // Explicit index tie-break: stable regardless of engine, and documents the intent.
  scored.sort((a, b) => b.tier - a.tier || a.recent - b.recent || a.index - b.index);
  return scored.map((s) => s.command);
}
