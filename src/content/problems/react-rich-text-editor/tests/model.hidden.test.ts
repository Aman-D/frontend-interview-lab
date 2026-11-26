import { insertText, isMarkActive, marksAt, normalize, plainText, toggleMark, toHTML } from '../model';
import type { Doc } from '../types';

const mixed: Doc = [
  { text: 'ab', marks: ['bold'] },
  { text: 'cd', marks: ['bold', 'italic'] },
  { text: 'ef', marks: ['italic'] },
];

describe('model — hidden', () => {
  it('functions never mutate their input', () => {
    const input: Doc = JSON.parse(JSON.stringify(mixed));
    const copy = JSON.stringify(input);
    toggleMark(input, 1, 5, 'underline');
    toggleMark(input, 0, 4, 'bold');
    insertText(input, 2, 4, 'X', ['bold']);
    normalize([...input, { text: 'g', marks: ['italic'] }]);
    toHTML(input);
    expect(JSON.stringify(input)).toBe(copy);
  });

  it('toggleMark across run boundaries splits runs and keeps other marks', () => {
    expect(toggleMark(mixed, 1, 5, 'underline')).toEqual([
      { text: 'a', marks: ['bold'] },
      { text: 'b', marks: ['bold', 'underline'] },
      { text: 'cd', marks: ['bold', 'italic', 'underline'] },
      { text: 'e', marks: ['italic', 'underline'] },
      { text: 'f', marks: ['italic'] },
    ]);
    // italic is not on "b" → added everywhere in [1, 5)
    expect(toggleMark(mixed, 1, 5, 'italic')).toEqual([
      { text: 'a', marks: ['bold'] },
      { text: 'bcd', marks: ['bold', 'italic'] },
      { text: 'ef', marks: ['italic'] },
    ]);
    // bold on all of [0, 4) → removed, and the result merges with its neighbour
    expect(toggleMark(mixed, 0, 4, 'bold')).toEqual([
      { text: 'ab', marks: [] },
      { text: 'cdef', marks: ['italic'] },
    ]);
  });

  it('a collapsed toggle returns the normalised document unchanged', () => {
    expect(toggleMark(mixed, 3, 3, 'bold')).toEqual(mixed);
    expect(toggleMark([{ text: 'a', marks: [] }, { text: 'b', marks: [] }], 1, 1, 'bold')).toEqual([{ text: 'ab', marks: [] }]);
  });

  it('marksAt: offset 0 uses the first character, empty document has no marks; returns a copy', () => {
    expect(marksAt(mixed, 0)).toEqual(['bold']);
    expect(marksAt(mixed, 2)).toEqual(['bold']);
    expect(marksAt(mixed, 3)).toEqual(['bold', 'italic']);
    expect(marksAt(mixed, 6)).toEqual(['italic']);
    expect(marksAt([], 0)).toEqual([]);
    const m = marksAt(mixed, 1);
    m.push('underline');
    expect(mixed[0].marks).toEqual(['bold']);
  });

  it('isMarkActive over a range requires every character', () => {
    expect(isMarkActive(mixed, 0, 4, 'bold')).toBe(true);
    expect(isMarkActive(mixed, 0, 5, 'bold')).toBe(false);
    expect(isMarkActive(mixed, 2, 6, 'italic')).toBe(true);
    expect(isMarkActive(mixed, 2, 2, 'italic')).toBe(false); // caret after "b" → bold only
    expect(isMarkActive([], 0, 0, 'bold')).toBe(false);
  });

  it('insertText across runs, at the edges, and deleting everything', () => {
    expect(insertText(mixed, 1, 5, '', [])).toEqual([
      { text: 'a', marks: ['bold'] },
      { text: 'f', marks: ['italic'] },
    ]);
    expect(insertText(mixed, 0, 0, 'Z', ['bold'])).toEqual([
      { text: 'Zab', marks: ['bold'] },
      { text: 'cd', marks: ['bold', 'italic'] },
      { text: 'ef', marks: ['italic'] },
    ]);
    expect(insertText(mixed, 6, 6, '!', [])).toEqual([...mixed, { text: '!', marks: [] }]);
    expect(insertText(mixed, 0, 6, '', [])).toEqual([]);
    expect(insertText([], 0, 0, 'hi', ['underline', 'bold'])).toEqual([{ text: 'hi', marks: ['bold', 'underline'] }]);
    expect(plainText(insertText(mixed, 2, 4, '\n', ['bold']))).toBe('ab\nef');
  });

  it('toHTML: <br> for line breaks, every escape, all three marks', () => {
    expect(toHTML([{ text: `1\n"2" & '3'`, marks: ['italic', 'underline', 'bold'] }])).toBe('<strong><em><u>1<br>&quot;2&quot; &amp; &#39;3&#39;</u></em></strong>');
    expect(toHTML([{ text: '<img src=x onerror=alert(1)>', marks: [] }])).toBe('&lt;img src=x onerror=alert(1)&gt;');
    expect(toHTML([{ text: 'a', marks: ['bold'] }, { text: 'b', marks: ['italic'] }])).toBe('<strong>a</strong><em>b</em>');
  });
});
