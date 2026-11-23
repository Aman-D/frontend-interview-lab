import { useState } from 'react';
import type { FileNode, FolderNode } from './types';

export interface FileExplorerProps {
  initialTree: FolderNode;
  onOpenFile?: (file: FileNode) => void;
}

export default function FileExplorer({ initialTree }: FileExplorerProps) {
  const [tree] = useState(initialTree);
  // TODO: render the tree (role="tree" / "treeitem" / "group"), expand/collapse folders,
  // select items, create files/folders, delete, keyboard navigation.
  return (
    <div className="explorer">
      <p>{tree.name}</p>
    </div>
  );
}
