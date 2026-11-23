import type { Comment, CommentStore, NewComment, SortOrder } from './types';

// Every function here is PURE: it never mutates `store`. Only the comments that change (and the parent whose
// childIds change) are copied; every other comment object, and `rootIds` when unchanged, keeps its identity.
// No-ops return `store` itself so callers can detect "nothing happened" with ===.

/** Own-property lookup, so ids such as "constructor" or "toString" never hit Object.prototype. */
function get(store: CommentStore, id: string): Comment | undefined {
  return Object.prototype.hasOwnProperty.call(store.byId, id) ? store.byId[id] : undefined;
}

export function addReply(store: CommentStore, parentId: string | null, input: NewComment): CommentStore {
  const text = input.text.trim();
  if (!text || get(store, input.id)) return store;
  const comment: Comment = {
    id: input.id,
    parentId,
    author: input.author,
    text,
    createdAt: input.createdAt,
    votes: 0,
    voted: false,
    edited: false,
    deleted: false,
    childIds: [],
  };
  if (parentId === null) {
    return { byId: { ...store.byId, [comment.id]: comment }, rootIds: [...store.rootIds, comment.id] };
  }
  const parent = get(store, parentId);
  if (!parent || parent.deleted) return store;
  return {
    byId: { ...store.byId, [parentId]: { ...parent, childIds: [...parent.childIds, comment.id] }, [comment.id]: comment },
    rootIds: store.rootIds,
  };
}

export function editComment(store: CommentStore, id: string, text: string): CommentStore {
  const comment = get(store, id);
  const next = text.trim();
  if (!comment || comment.deleted || !next || next === comment.text) return store;
  return { byId: { ...store.byId, [id]: { ...comment, text: next, edited: true } }, rootIds: store.rootIds };
}

export function deleteComment(store: CommentStore, id: string): CommentStore {
  const comment = get(store, id);
  if (!comment || comment.deleted) return store;

  // Has replies: keep the node as a tombstone so the subtree stays attached.
  if (comment.childIds.length > 0) {
    return { byId: { ...store.byId, [id]: { ...comment, deleted: true, text: '' } }, rootIds: store.rootIds };
  }

  // Leaf: remove it, then prune tombstones that no longer have any replies, walking up.
  const byId = { ...store.byId }; // our own copy — safe to `delete` from
  let rootIds = store.rootIds;
  let removedId = id;
  let parentId = comment.parentId;
  delete byId[removedId];
  while (true) {
    if (parentId === null) {
      rootIds = rootIds.filter((rootId) => rootId !== removedId);
      break;
    }
    const parent = byId[parentId];
    if (!parent) break; // dangling parent reference: nothing more to update
    const childIds = parent.childIds.filter((childId) => childId !== removedId);
    if (parent.deleted && childIds.length === 0) {
      delete byId[parentId];
      removedId = parentId;
      parentId = parent.parentId;
      continue;
    }
    byId[parentId] = { ...parent, childIds };
    break;
  }
  return { byId, rootIds };
}

export function toggleVote(store: CommentStore, id: string): CommentStore {
  const comment = get(store, id);
  if (!comment || comment.deleted) return store;
  const voted = !comment.voted;
  return { byId: { ...store.byId, [id]: { ...comment, voted, votes: comment.votes + (voted ? 1 : -1) } }, rootIds: store.rootIds };
}

export function countDescendants(store: CommentStore, id: string): number {
  const root = get(store, id);
  if (!root) return 0;
  // Iterative depth-first walk: no recursion-depth limit for pathological threads.
  let count = 0;
  const stack = [...root.childIds];
  while (stack.length > 0) {
    const comment = get(store, stack.pop()!);
    if (!comment) continue;
    if (!comment.deleted) count++;
    for (const childId of comment.childIds) stack.push(childId);
  }
  return count;
}

export function sortRootIds(store: CommentStore, order: SortOrder): string[] {
  const byId = store.byId;
  const compareIds = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
  return [...store.rootIds].sort((a, b) => {
    const ca = byId[a];
    const cb = byId[b];
    if (order === 'top' && cb.votes !== ca.votes) return cb.votes - ca.votes;
    if (cb.createdAt !== ca.createdAt) return cb.createdAt - ca.createdAt;
    return compareIds(a, b);
  });
}
