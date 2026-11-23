// Normalised comment store: every comment is stored once by id; parents only hold ordered id lists.

export interface Comment {
  id: string;
  /** null for a top-level comment. */
  parentId: string | null;
  author: string;
  text: string;
  /** Epoch milliseconds. */
  createdAt: number;
  votes: number;
  /** Whether the current user has upvoted this comment. */
  voted: boolean;
  /** True once the text has been changed with editComment. */
  edited: boolean;
  /** Soft-deleted: kept as a "[deleted]" placeholder because it still has replies. Its text is cleared. */
  deleted: boolean;
  /** Reply ids, oldest first. */
  childIds: string[];
}

export interface CommentStore {
  byId: Record<string, Comment>;
  /** Top-level comment ids in insertion order (sorting is a view concern, see sortRootIds). */
  rootIds: string[];
}

/** What the UI provides when posting; the store fills in the rest. */
export interface NewComment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
}

export type SortOrder = 'newest' | 'top';
