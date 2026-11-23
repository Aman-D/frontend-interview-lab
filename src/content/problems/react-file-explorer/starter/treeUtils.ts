import type { FolderNode, TreeNode } from './types';

/** Folders first, then case-insensitive alphabetical by name. Returns a new array. */
export function sortNodes(nodes: TreeNode[]): TreeNode[] {
  // TODO
  return nodes;
}

/**
 * Returns a new tree with `node` added to the children of folder `parentId`.
 * Must not mutate `tree`. Unchanged subtrees must keep their identity (structural sharing).
 * If `parentId` doesn't exist (or isn't a folder), return `tree` itself.
 */
export function insertNode(tree: FolderNode, parentId: string, node: TreeNode): FolderNode {
  // TODO
  return tree;
}

/**
 * Returns a new tree without the node `id` (and its descendants).
 * If `id` doesn't exist, return `tree` itself. The root cannot be removed.
 */
export function removeNode(tree: FolderNode, id: string): FolderNode {
  // TODO
  return tree;
}
