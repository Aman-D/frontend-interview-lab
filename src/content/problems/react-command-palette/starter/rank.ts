export interface Rankable {
  id: string;
  title: string;
}

/**
 * Filters and orders `commands` for `query`. Pure: never mutates its inputs, always returns a new array.
 *
 * Normalise: trim the query and compare case-insensitively.
 *
 * Empty query → every command: those whose id is in `recentIds` first (in `recentIds` order;
 * unknown or repeated ids are ignored), then the rest in their original order.
 *
 * Non-empty query → only matching commands, ranked by match quality (best first):
 *   4. prefix      — the title starts with the query                 ("set" → "Settings: sync")
 *   3. word start  — the query occurs at the start of a word         ("set" → "Open settings")
 *                    (index 0 or right after a non-letter/digit character)
 *   2. substring   — the query occurs anywhere                       ("set" → "Reset view")
 *   1. subsequence — the query's characters, ignoring whitespace,
 *                    appear in the title in order                     ("set" → "Close tab")
 *   Anything else is excluded.
 * Within the same tier: recent commands first (more recent first), then original order (stable).
 */
export function rankCommands<T extends Rankable>(query: string, commands: readonly T[], recentIds: readonly string[] = []): T[] {
  // TODO: implement the rules above.
  void query;
  void recentIds;
  return commands.slice();
}
