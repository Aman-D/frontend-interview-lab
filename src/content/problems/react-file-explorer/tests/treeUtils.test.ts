import { insertNode, removeNode, sortNodes } from '../treeUtils';
import type { FolderNode } from '../types';

function makeTree(): FolderNode {
  return {
    kind: 'folder', id: 'r', name: 'r',
    children: [
      { kind: 'file', id: 'r/b.txt', name: 'b.txt' },
      { kind: 'folder', id: 'r/src', name: 'src', children: [{ kind: 'file', id: 'r/src/a.ts', name: 'a.ts' }] },
      { kind: 'folder', id: 'r/docs', name: 'docs', children: [] },
      { kind: 'file', id: 'r/A.txt', name: 'A.txt' },
    ],
  };
}

describe('treeUtils — public', () => {
  it('sortNodes: folders first, then case-insensitive by name, without mutating', () => {
    const tree = makeTree();
    const before = tree.children.map((c) => c.name);
    expect(sortNodes(tree.children).map((c) => c.name)).toEqual(['docs', 'src', 'A.txt', 'b.txt']);
    expect(tree.children.map((c) => c.name)).toEqual(before);
  });

  it('insertNode adds to the right folder and does not mutate the input', () => {
    const tree = makeTree();
    const snapshot = JSON.stringify(tree);
    const next = insertNode(tree, 'r/src', { kind: 'file', id: 'r/src/b.ts', name: 'b.ts' });
    expect(JSON.stringify(tree)).toBe(snapshot);
    const src = next.children.find((c) => c.id === 'r/src') as FolderNode;
    expect(src.children.map((c) => c.id)).toEqual(['r/src/a.ts', 'r/src/b.ts']);
  });

  it('insertNode shares unchanged subtrees (structural sharing)', () => {
    const tree = makeTree();
    const next = insertNode(tree, 'r/src', { kind: 'file', id: 'r/src/b.ts', name: 'b.ts' });
    expect(next).not.toBe(tree);
    expect(next.children[1]).not.toBe(tree.children[1]); // path to the change is copied
    expect(next.children[0]).toBe(tree.children[0]); // siblings are reused
    expect(next.children[2]).toBe(tree.children[2]);
  });

  it('removeNode removes a nested node immutably', () => {
    const tree = makeTree();
    const next = removeNode(tree, 'r/src/a.ts');
    expect((next.children[1] as FolderNode).children).toHaveLength(0);
    expect((tree.children[1] as FolderNode).children).toHaveLength(1);
  });
});

describe('treeUtils — no-op cases return the same reference', () => {
  it('insert into a missing parent returns the original tree', () => {
    const tree = makeTree();
    expect(insertNode(tree, 'nope', { kind: 'file', id: 'x', name: 'x' })).toBe(tree);
  });
  it('remove of a missing id returns the original tree', () => {
    const tree = makeTree();
    expect(removeNode(tree, 'nope')).toBe(tree);
  });
});
