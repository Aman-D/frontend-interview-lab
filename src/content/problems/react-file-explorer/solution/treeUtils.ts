import type { FolderNode, TreeNode } from './types';

/** Folders first, then case-insensitive alphabetical by name. Returns a new array. */
export function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return [...nodes].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
  });
}

/** Immutable insert with structural sharing: only the path from the root to `parentId` is copied. */
export function insertNode(tree: FolderNode, parentId: string, node: TreeNode): FolderNode {
  if (tree.id === parentId) return { ...tree, children: [...tree.children, node] };
  let changed = false;
  const children = tree.children.map((child) => {
    if (child.kind !== 'folder') return child;
    const next = insertNode(child, parentId, node);
    if (next !== child) changed = true;
    return next;
  });
  return changed ? { ...tree, children } : tree;
}

/** Immutable removal with structural sharing. The root itself is never removed. */
export function removeNode(tree: FolderNode, id: string): FolderNode {
  let changed = false;
  const children: TreeNode[] = [];
  for (const child of tree.children) {
    if (child.id === id) {
      changed = true;
      continue;
    }
    if (child.kind === 'folder') {
      const next = removeNode(child, id);
      if (next !== child) changed = true;
      children.push(next);
    } else {
      children.push(child);
    }
  }
  return changed ? { ...tree, children } : tree;
}

export interface TreeIndex {
  byId: Map<string, TreeNode>;
  parentOf: Map<string, string>;
}

/** O(n) index used for parent lookups (keyboard ArrowLeft, "create next to selected file"). */
export function indexTree(tree: FolderNode): TreeIndex {
  const byId = new Map<string, TreeNode>([[tree.id, tree]]);
  const parentOf = new Map<string, string>();
  const stack: FolderNode[] = [tree];
  while (stack.length) {
    const folder = stack.pop()!;
    for (const child of folder.children) {
      byId.set(child.id, child);
      parentOf.set(child.id, folder.id);
      if (child.kind === 'folder') stack.push(child);
    }
  }
  return { byId, parentOf };
}
