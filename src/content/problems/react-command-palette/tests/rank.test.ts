import { rankCommands } from '../rank';

const COMMANDS = [
  { id: 'sidebar', title: 'Toggle sidebar' },
  { id: 'open-settings', title: 'Open settings' },
  { id: 'settings-sync', title: 'Settings: sync' },
  { id: 'reset', title: 'Reset view' },
  { id: 'close', title: 'Close tab' },
];
const ids = (list: { id: string }[]) => list.map((c) => c.id);

describe('rankCommands — public', () => {
  it('empty query: recent commands first (most recent first), then the rest in original order', () => {
    expect(ids(rankCommands('', COMMANDS, ['reset', 'does-not-exist', 'open-settings']))).toEqual(['reset', 'open-settings', 'sidebar', 'settings-sync', 'close']);
    expect(ids(rankCommands('   ', COMMANDS, []))).toEqual(ids(COMMANDS));
  });

  it('matches case-insensitively as a subsequence and drops commands that do not match', () => {
    expect(ids(rankCommands('TSB', COMMANDS))).toEqual(['sidebar']);
    expect(ids(rankCommands('xyz', COMMANDS))).toEqual([]);
  });

  it('orders by match quality: prefix > word start > substring > subsequence', () => {
    // "Settings: sync" (prefix), "Open settings" (word start), "Reset view" (substring), "Close tab" (subsequence)
    expect(ids(rankCommands('set', COMMANDS))).toEqual(['settings-sync', 'open-settings', 'reset', 'close']);
  });

  it('boosts recent commands among equally good matches', () => {
    const list = [
      { id: 'print', title: 'Print page' },
      { id: 'preview', title: 'Preview page' },
      { id: 'publish', title: 'Publish page' },
    ];
    expect(ids(rankCommands('p', list, ['publish']))).toEqual(['publish', 'print', 'preview']);
  });

  it('is pure: does not mutate (even frozen) inputs and returns a new array', () => {
    const frozen = Object.freeze(COMMANDS.map((c) => Object.freeze({ ...c })));
    const recents = Object.freeze(['close']);
    const result = rankCommands('', frozen, recents);
    expect(result).not.toBe(frozen);
    expect(ids(result)).toEqual(['close', 'sidebar', 'open-settings', 'settings-sync', 'reset']);
    expect(ids(rankCommands('set', frozen, recents))).toEqual(['settings-sync', 'open-settings', 'reset', 'close']);
  });
});
