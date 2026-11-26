import { insertText, isMarkActive, marksAt, normalize, toggleMark, toHTML } from '../model';
import type { Doc } from '../types';

const doc: Doc = [
  { text: 'Hello ', marks: [] },
  { text: 'bold', marks: ['bold'] },
  { text: ' world', marks: [] },
];

describe('model — public', () => {
  it('normalize merges equal neighbours, drops empty runs and orders marks', () => {
    expect(
      normalize([
        { text: 'a', marks: ['italic', 'bold'] },
        { text: '', marks: ['underline'] },
        { text: 'b', marks: ['bold', 'italic', 'bold'] },
        { text: 'c', marks: [] },
      ]),
    ).toEqual([
      { text: 'ab', marks: ['bold', 'italic'] },
      { text: 'c', marks: [] },
    ]);
  });

  it('toggleMark adds a mark to a partly formatted range', () => {
    // "lo bo" — 'lo ' is plain, 'bo' is already bold → not active on the whole range → add
    expect(toggleMark(doc, 3, 8, 'bold')).toEqual([
      { text: 'Hel', marks: [] },
      { text: 'lo bold', marks: ['bold'] },
      { text: ' world', marks: [] },
    ]);
  });

  it('toggleMark removes a mark that is active on the whole range', () => {
    expect(toggleMark(doc, 6, 10, 'bold')).toEqual([{ text: 'Hello bold world', marks: [] }]);
  });

  it('isMarkActive and marksAt', () => {
    expect(isMarkActive(doc, 6, 10, 'bold')).toBe(true);
    expect(isMarkActive(doc, 5, 10, 'bold')).toBe(false);
    expect(marksAt(doc, 10)).toEqual(['bold']); // the character before the caret is the last "d" of "bold"
    expect(marksAt(doc, 6)).toEqual([]);
    expect(isMarkActive(doc, 8, 8, 'bold')).toBe(true);
  });

  it('insertText replaces a range with text that has exactly the given marks', () => {
    expect(insertText(doc, 6, 10, 'big', ['italic'])).toEqual([
      { text: 'Hello ', marks: [] },
      { text: 'big', marks: ['italic'] },
      { text: ' world', marks: [] },
    ]);
  });

  it('toHTML nests strong > em > u and escapes text', () => {
    expect(toHTML([{ text: 'a<b>&', marks: ['underline', 'bold'] }, { text: ' c', marks: [] }])).toBe('<strong><u>a&lt;b&gt;&amp;</u></strong> c');
    expect(toHTML([])).toBe('');
  });
});
