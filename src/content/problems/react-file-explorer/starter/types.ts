// A discriminated union: `kind` tells TypeScript (and you) which shape you have.
export interface FileNode {
  kind: 'file';
  id: string;
  name: string;
}

export interface FolderNode {
  kind: 'folder';
  id: string;
  name: string;
  children: TreeNode[];
}

export type TreeNode = FileNode | FolderNode;
