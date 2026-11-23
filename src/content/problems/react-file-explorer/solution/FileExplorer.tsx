import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { indexTree, insertNode, removeNode, sortNodes } from './treeUtils';
import type { FileNode, FolderNode, TreeNode } from './types';

export interface FileExplorerProps {
  initialTree: FolderNode;
  onOpenFile?: (file: FileNode) => void;
}

interface VisibleItem {
  node: TreeNode;
  level: number;
}

interface Draft {
  kind: 'file' | 'folder';
  parentId: string;
  name: string;
  error: string | null;
}

export default function FileExplorer({ initialTree, onOpenFile }: FileExplorerProps) {
  const [tree, setTree] = useState(initialTree);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const index = useMemo(() => indexTree(tree), [tree]);
  const uid = useId();
  // Each treeitem is labelled by its own name only (otherwise its accessible name would include all descendants).
  const labelId = (id: string) => `${uid}-label-${id}`;

  // Depth-first list of the rows currently on screen, in display order — the basis for keyboard navigation.
  const visible = useMemo(() => {
    const out: VisibleItem[] = [];
    const walk = (nodes: TreeNode[], level: number) => {
      for (const node of sortNodes(nodes)) {
        out.push({ node, level });
        if (node.kind === 'folder' && expanded.has(node.id)) walk(node.children, level + 1);
      }
    };
    walk(tree.children, 1);
    return out;
  }, [tree, expanded]);

  // Roving tabindex: exactly one treeitem is tabbable.
  const tabbableId = focusedId && visible.some((v) => v.node.id === focusedId) ? focusedId : visible[0]?.node.id ?? null;

  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const moveFocus = useRef(false);
  useEffect(() => {
    if (!moveFocus.current || !focusedId) return;
    moveFocus.current = false;
    itemRefs.current.get(focusedId)?.focus();
  }, [focusedId, visible]);

  function focusItem(id: string) {
    moveFocus.current = true;
    setFocusedId(id);
  }

  function toggle(id: string, open?: boolean) {
    setExpanded((prev) => {
      const next = new Set(prev);
      const shouldOpen = open ?? !next.has(id);
      if (shouldOpen) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function activate(node: TreeNode) {
    setSelectedId(node.id);
    setFocusedId(node.id);
    if (node.kind === 'folder') toggle(node.id);
    else onOpenFile?.(node);
  }

  function targetFolderId(): string {
    if (!selectedId) return tree.id;
    const node = index.byId.get(selectedId);
    if (!node) return tree.id;
    if (node.kind === 'folder') return node.id;
    return index.parentOf.get(node.id) ?? tree.id;
  }

  function startCreate(kind: Draft['kind']) {
    setDraft({ kind, parentId: targetFolderId(), name: '', error: null });
  }

  function commitCreate() {
    if (!draft) return;
    const name = draft.name.trim();
    const parent = index.byId.get(draft.parentId);
    if (!name) return setDraft({ ...draft, error: 'Name is required.' });
    if (name.includes('/')) return setDraft({ ...draft, error: 'Name cannot contain "/".' });
    if (!parent || parent.kind !== 'folder') return setDraft(null);
    if (parent.children.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      return setDraft({ ...draft, error: `"${name}" already exists in ${parent.name}.` });
    }
    const id = `${parent.id}/${name}`;
    const node: TreeNode = draft.kind === 'file' ? { kind: 'file', id, name } : { kind: 'folder', id, name, children: [] };
    setTree((t) => insertNode(t, parent.id, node));
    if (parent.id !== tree.id) toggle(parent.id, true);
    setSelectedId(id);
    setDraft(null);
    focusItem(id);
  }

  function deleteSelected() {
    if (!selectedId || selectedId === tree.id) return;
    const pos = visible.findIndex((v) => v.node.id === selectedId);
    setTree((t) => removeNode(t, selectedId));
    setSelectedId(null);
    // keep keyboard users anchored near where they were
    const fallback = visible[pos - 1]?.node.id ?? null;
    setFocusedId(fallback);
  }

  function onTreeKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    if (!tabbableId) return;
    const i = visible.findIndex((v) => v.node.id === tabbableId);
    if (i === -1) return;
    const { node } = visible[i];
    const isOpenFolder = node.kind === 'folder' && expanded.has(node.id);
    let handled = true;
    switch (e.key) {
      case 'ArrowDown':
        if (i < visible.length - 1) focusItem(visible[i + 1].node.id);
        break;
      case 'ArrowUp':
        if (i > 0) focusItem(visible[i - 1].node.id);
        break;
      case 'ArrowRight':
        if (node.kind === 'folder') {
          if (!isOpenFolder) toggle(node.id, true);
          else if (node.children.length) focusItem(visible[i + 1].node.id);
        }
        break;
      case 'ArrowLeft': {
        if (isOpenFolder) toggle(node.id, false);
        else {
          const parentId = index.parentOf.get(node.id);
          if (parentId && parentId !== tree.id) focusItem(parentId);
        }
        break;
      }
      case 'Home':
        focusItem(visible[0].node.id);
        break;
      case 'End':
        focusItem(visible[visible.length - 1].node.id);
        break;
      case 'Enter':
      case ' ':
        activate(node);
        break;
      default:
        handled = false;
    }
    if (handled) e.preventDefault();
  }

  function renderNodes(nodes: TreeNode[], level: number) {
    return sortNodes(nodes).map((node) => {
      const isFolder = node.kind === 'folder';
      const isOpen = isFolder && expanded.has(node.id);
      return (
        <li
          key={node.id}
          role="treeitem"
          aria-level={level}
          aria-labelledby={labelId(node.id)}
          aria-expanded={isFolder ? isOpen : undefined}
          aria-selected={selectedId === node.id}
          tabIndex={tabbableId === node.id ? 0 : -1}
          ref={(el) => {
            if (el) itemRefs.current.set(node.id, el);
            else itemRefs.current.delete(node.id);
          }}
        >
          <div
            className="row"
            onClick={(e) => {
              e.stopPropagation();
              activate(node);
            }}
          >
            <span aria-hidden="true">{isFolder ? (isOpen ? '📂' : '📁') : '📄'}</span>
            <span id={labelId(node.id)}>{node.name}</span>
          </div>
          {isFolder && isOpen && (
            <ul role="group">{node.children.length ? renderNodes(node.children, level + 1) : null}</ul>
          )}
        </li>
      );
    });
  }

  return (
    <div className="explorer">
      <div className="toolbar">
        <button type="button" onClick={() => startCreate('file')}>New file</button>
        <button type="button" onClick={() => startCreate('folder')}>New folder</button>
        <button type="button" onClick={deleteSelected} disabled={!selectedId}>Delete</button>
        {draft && (
          <>
            <input
              aria-label={draft.kind === 'file' ? 'New file name' : 'New folder name'}
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value, error: null })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitCreate();
                if (e.key === 'Escape') setDraft(null);
              }}
            />
            {draft.error && <span className="error" role="alert">{draft.error}</span>}
          </>
        )}
      </div>
      {tree.children.length === 0 ? (
        <p>This folder is empty.</p>
      ) : (
        <ul role="tree" aria-label={tree.name} className="tree" onKeyDown={onTreeKeyDown}>
          {renderNodes(tree.children, 1)}
        </ul>
      )}
    </div>
  );
}
