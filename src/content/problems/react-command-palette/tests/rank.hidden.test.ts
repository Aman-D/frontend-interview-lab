import { rankCommands } from '../rank';

const ids = (list: { id: string }[]) => list.map((c) => c.id);

describe('rankCommands — hidden', () => {
  it('keeps the original order for ties (no alphabetical or reversed sorting)', () => {
    const list = ['Item b', 'Item 10', 'Item a', 'Item 2', 'Item c', 'Item 1'].map((title, i) => ({ id: String(i), title }));
    expect(ids(rankCommands('item', list))).toEqual(['0', '1', '2', '3', '4', '5']);
    expect(ids(rankCommands('', list))).toEqual(['0', '1', '2', '3', '4', '5']);
  });

  it('recency breaks ties inside a tier but never lifts a weaker match above a stronger one', () => {
    const list = [
      { id: 'print', title: 'Print page' },
      { id: 'preview', title: 'Preview page' },
      { id: 'publish', title: 'Publish page' },
      { id: 'prefs', title: 'Open preferences' }, // word start for "p"
    ];
    expect(ids(rankCommands('p', list, ['prefs', 'preview']))).toEqual(['preview', 'print', 'publish', 'prefs']);
    expect(ids(rankCommands('p', list, ['publish', 'print']))).toEqual(['publish', 'print', 'preview', 'prefs']);
  });

  it('detects a word start at ANY occurrence, including after punctuation', () => {
    const list = [
      { id: 'asset', title: 'Asset list' }, // "set" only mid-word → substring
      { id: 'reset-settings', title: 'Reset settings' }, // mid-word first, then a word start
    ];
    expect(ids(rankCommands('set', list))).toEqual(['reset-settings', 'asset']);
    const git = [
      { id: 'compute', title: 'Compute totals' }, // "pu" mid-word
      { id: 'pull', title: 'Git: pull' }, // "pu" after ": "
      { id: 'push', title: 'git/push' }, // "pu" after "/"
    ];
    expect(ids(rankCommands('pu', git))).toEqual(['pull', 'push', 'compute']);
  });

  it('subsequence matching respects order and repeated characters', () => {
    const list = [
      { id: 'open', title: 'Open file' }, // only one "o"
      { id: 'home', title: 'Go home' }, // o … o → subsequence
      { id: 'zoom', title: 'Zoom in' }, // "oo" substring
      { id: 'back', title: 'Back' },
    ];
    expect(ids(rankCommands('oo', list))).toEqual(['zoom', 'home']);
    expect(ids(rankCommands('ab', list))).toEqual([]);
  });

  it('trims the query and ignores inner whitespace only for subsequence matching', () => {
    const list = [
      { id: 'create', title: 'Create new file' },
      { id: 'open', title: 'Open file' },
      { id: 'devtools', title: 'Toggle DevTools' },
    ];
    expect(ids(rankCommands('  NEW FI ', list))).toEqual(['create']);
    // No space after "Dev" in the title: only a whitespace-insensitive subsequence ("devt") matches.
    expect(ids(rankCommands('dev t', list))).toEqual(['devtools']);
    // "n f" is a substring of "Open file" but only a subsequence ("nf") of "Create new file".
    expect(ids(rankCommands('n f', list))).toEqual(['open', 'create']);
  });

  it('handles duplicates in recentIds, empty lists and queries longer than every title', () => {
    const list = [
      { id: 'a', title: 'Alpha' },
      { id: 'b', title: 'Beta' },
      { id: 'c', title: 'Gamma' },
    ];
    expect(ids(rankCommands('', list, ['b', 'c', 'b']))).toEqual(['b', 'c', 'a']);
    expect(rankCommands('alpha beta gamma', list)).toEqual([]);
    expect(rankCommands('a', [], ['a'])).toEqual([]);
  });
});
