import type { CommentStore, NewComment, SortOrder } from './types';

// Every function here must be PURE: never mutate `store` (or anything inside it).
// Copy only what changes; untouched comments, and `rootIds` when it does not change, keep their identity.
// When nothing changes (unknown id, invalid input), return `store` itself.

/**
 * Adds a comment. `parentId === null` appends a top-level comment to `rootIds`; otherwise the new id is
 * appended to the parent's `childIds` (replies are oldest first). The text is trimmed.
 * No-op when the trimmed text is empty, the id is already used, or the parent is unknown or deleted.
 * The new comment starts with votes 0, voted/edited/deleted false and no children.
 */
export function addReply(store: CommentStore, parentId: string | null, comment: NewComment): CommentStore {
  // TODO
  return store;
}

/**
 * Replaces the text (trimmed) and sets `edited: true`.
 * No-op for unknown or deleted comments, empty text, or text identical to the current text.
 */
export function editComment(store: CommentStore, id: string, text: string): CommentStore {
  // TODO
  return store;
}

/**
 * - A comment WITH replies is soft-deleted: `deleted: true`, `text: ''`, replies are kept.
 * - A comment WITHOUT replies is removed from `byId` and from its parent's `childIds` (or `rootIds`).
 *   If that leaves a soft-deleted parent with no replies, the parent is removed too (and so on upwards).
 * No-op for unknown or already-deleted ids.
 */
export function deleteComment(store: CommentStore, id: string): CommentStore {
  // TODO
  return store;
}

/** Flips `voted` and adjusts `votes` by ±1. No-op for unknown or deleted comments. */
export function toggleVote(store: CommentStore, id: string): CommentStore {
  // TODO
  return store;
}

/** Number of replies at ANY depth below `id` that are not deleted (the comment itself is not counted). Unknown id → 0. */
export function countDescendants(store: CommentStore, id: string): number {
  // TODO
  return 0;
}

/**
 * Top-level ids in display order, as a NEW array (never sort `store.rootIds` in place).
 * - 'newest': createdAt descending.
 * - 'top': votes descending, ties broken by createdAt descending.
 * Remaining ties: id ascending, so the order is deterministic.
 */
export function sortRootIds(store: CommentStore, order: SortOrder): string[] {
  // TODO
  return store.rootIds;
}
