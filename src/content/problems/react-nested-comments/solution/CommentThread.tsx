import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { addReply, countDescendants, deleteComment, editComment, sortRootIds, toggleVote } from './commentStore';
import type { CommentStore, SortOrder } from './types';

export interface CommentThreadProps {
  initialStore: CommentStore;
  /** Author name used for new comments; only this user's comments show Edit and Delete. */
  currentUser: string;
  /** Called with the new store after every change that actually changed something. */
  onChange?: (store: CommentStore) => void;
  /** Injectable for tests. */
  generateId?: () => string;
  /** Injectable clock (epoch ms) for tests. */
  now?: () => number;
}

/** Replies indent until this depth; deeper levels stay flush so long threads remain readable on narrow screens. */
const MAX_INDENT = 4;

let fallbackSeq = 0;
const defaultId = () => `local-${Date.now().toString(36)}-${++fallbackSeq}`;
const dateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });
const hasOwn = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

/** What every comment row needs from the thread. Rebuilt each render (rows are not memoised, see notes). */
interface ThreadApi {
  store: CommentStore;
  currentUser: string;
  articleId: (id: string) => string;
  reply: (parentId: string, text: string) => boolean;
  edit: (id: string, text: string) => void;
  remove: (id: string) => void;
  vote: (id: string) => void;
}

export default function CommentThread({ initialStore, currentUser, onChange, generateId = defaultId, now = Date.now }: CommentThreadProps) {
  const [store, setStore] = useState(initialStore);
  const [sort, setSort] = useState<SortOrder>('newest');
  const [announcement, setAnnouncement] = useState('');
  // The latest committed store, readable synchronously: two events in the same tick compose instead of
  // the second one overwriting the first with a stale closure value.
  const storeRef = useRef(store);
  const focusAfterCommit = useRef<string | null>(null);

  const prefix = useId();
  const headingId = `${prefix}-heading`;
  const sortId = `${prefix}-sort`;
  const articleId = (id: string) => `${prefix}-comment-${id}`;

  // Focus that can only move once React has rendered the new tree (e.g. after a row unmounts).
  useEffect(() => {
    const target = focusAfterCommit.current;
    if (target === null) return;
    focusAfterCommit.current = null;
    document.getElementById(target)?.focus();
  }, [store]);

  function commit(next: CommentStore, message: string): boolean {
    if (next === storeRef.current) return false; // helpers return the same store for no-ops
    storeRef.current = next;
    setStore(next);
    setAnnouncement(message);
    onChange?.(next);
    return true;
  }

  const api: ThreadApi = {
    store,
    currentUser,
    articleId,
    reply: (parentId, text) => commit(addReply(storeRef.current, parentId, { id: generateId(), author: currentUser, text, createdAt: now() }), 'Reply posted.'),
    edit: (id, text) => {
      commit(editComment(storeRef.current, id, text), 'Comment updated.');
    },
    vote: (id) => {
      commit(toggleVote(storeRef.current, id), '');
    },
    remove: (id) => {
      const prev = storeRef.current;
      const next = deleteComment(prev, id);
      if (next === prev) return;
      // The focused Delete button is about to disappear. Move focus to the tombstone (soft delete), else the
      // nearest ancestor that survived pruning, else the heading — never leave it on <body>.
      let target: string | null = id;
      while (target !== null && !hasOwn(next.byId, target)) target = prev.byId[target].parentId;
      focusAfterCommit.current = target === null ? headingId : articleId(target);
      commit(next, 'Comment deleted.');
    },
  };

  const postTopLevel = (text: string) =>
    commit(addReply(storeRef.current, null, { id: generateId(), author: currentUser, text, createdAt: now() }), 'Comment posted.');

  const ordered = useMemo(() => sortRootIds(store, sort), [store, sort]);
  const total = ordered.reduce((n, id) => n + (store.byId[id].deleted ? 0 : 1) + countDescendants(store, id), 0);

  return (
    <section className="thread" aria-labelledby={headingId}>
      <div className="thread__toolbar">
        <h2 id={headingId} tabIndex={-1}>
          Comments ({total})
        </h2>
        <div>
          <label htmlFor={sortId}>Sort by </label>
          <select id={sortId} value={sort} onChange={(e) => setSort(e.target.value as SortOrder)}>
            <option value="newest">Newest</option>
            <option value="top">Top</option>
          </select>
        </div>
      </div>

      <Composer onPost={postTopLevel} />

      {ordered.length === 0 ? (
        <p className="empty">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="comments" aria-labelledby={headingId}>
          {ordered.map((id) => (
            <CommentItem key={id} id={id} depth={0} api={api} />
          ))}
        </ul>
      )}
      <p role="status" className="visually-hidden">
        {announcement}
      </p>
    </section>
  );
}

function CommentItem({ id, depth, api }: { id: string; depth: number; api: ThreadApi }) {
  // UI-only state lives with the row. Rows are keyed by comment id, so it follows the comment when the
  // order changes (sorting, new replies) instead of staying at a position.
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const replyButton = useRef<HTMLButtonElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const restoreEditFocus = useRef(false);

  useEffect(() => {
    // The Edit button is not rendered while editing, so focus can only return after this render.
    if (!editing && restoreEditFocus.current) {
      restoreEditFocus.current = false;
      editButton.current?.focus();
    }
  }, [editing]);

  const comment = api.store.byId[id];
  if (!comment) return null;

  const domId = api.articleId(id);
  const repliesId = `${domId}-replies`;
  const name = comment.deleted ? 'deleted comment' : comment.author;
  const own = !comment.deleted && comment.author === api.currentUser;
  const hasReplies = comment.childIds.length > 0;
  const replyCount = hasReplies ? countDescendants(api.store, id) : 0;
  const parent = comment.parentId === null ? undefined : api.store.byId[comment.parentId];

  const closeReply = () => {
    setReplying(false);
    replyButton.current?.focus();
  };
  const submitReply = (text: string) => {
    if (api.reply(id, text)) {
      setReplying(false);
      setCollapsed(false); // show the reply that was just posted
      replyButton.current?.focus();
    }
  };
  const closeEdit = () => {
    restoreEditFocus.current = true;
    setEditing(false);
  };

  return (
    <li className={comment.deleted ? 'comment comment--deleted' : 'comment'}>
      <article id={domId} tabIndex={-1} className="comment__body" aria-label={comment.deleted ? 'Deleted comment' : `Comment by ${comment.author}`}>
        {comment.deleted ? (
          <p className="comment__text">[deleted]</p>
        ) : (
          <>
            <div className="comment__meta">
              <span className="comment__author">{comment.author}</span>
              <time dateTime={new Date(comment.createdAt).toISOString()}>{dateFormat.format(comment.createdAt)}</time>
              {comment.edited && <span>(edited)</span>}
              {depth >= MAX_INDENT && parent && <span>↳ replying to {parent.deleted ? '[deleted]' : parent.author}</span>}
            </div>
            {editing ? (
              <TextForm
                label="Edit your comment"
                submitLabel="Save"
                initial={comment.text}
                onSubmit={(text) => {
                  api.edit(id, text);
                  closeEdit();
                }}
                onCancel={closeEdit}
              />
            ) : (
              // Plain text child: React escapes it. Never dangerouslySetInnerHTML for user content.
              <p className="comment__text">{comment.text}</p>
            )}
            <div className="comment__actions">
              <button type="button" aria-pressed={comment.voted} aria-label={`Upvote comment by ${comment.author}`} onClick={() => api.vote(id)}>
                ▲
              </button>
              <span className="comment__votes" data-testid="vote-count">
                {comment.votes}
              </span>
              <button
                type="button"
                ref={replyButton}
                aria-label={`Reply to ${comment.author}`}
                aria-expanded={replying}
                onClick={() => (replying ? closeReply() : setReplying(true))}
              >
                Reply
              </button>
              {own && !editing && (
                <button type="button" ref={editButton} aria-label={`Edit comment by ${comment.author}`} onClick={() => setEditing(true)}>
                  Edit
                </button>
              )}
              {own && (
                <button type="button" aria-label={`Delete comment by ${comment.author}`} onClick={() => api.remove(id)}>
                  Delete
                </button>
              )}
            </div>
            {replying && <TextForm label={`Your reply to ${comment.author}`} submitLabel="Post reply" initial="" onSubmit={submitReply} onCancel={closeReply} />}
          </>
        )}
        {hasReplies && (
          <button
            type="button"
            className="comment__toggle"
            aria-label={`${replyCount} ${replyCount === 1 ? 'reply' : 'replies'} to ${name}`}
            aria-expanded={!collapsed}
            aria-controls={repliesId}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? '▸' : '▾'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </article>
      {hasReplies && (
        // `hidden` rather than unmounting: drafts and collapse state inside the subtree survive collapsing.
        <ul id={repliesId} className={depth + 1 >= MAX_INDENT ? 'replies replies--flat' : 'replies'} aria-label={`Replies to ${name}`} hidden={collapsed}>
          {comment.childIds.map((childId) => (
            <CommentItem key={childId} id={childId} depth={depth + 1} api={api} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Draft state is local, so typing re-renders this form only — not every comment in the thread. */
function Composer({ onPost }: { onPost: (text: string) => boolean }) {
  const [draft, setDraft] = useState('');
  const fieldId = useId();
  function submit(event: FormEvent) {
    event.preventDefault();
    if (onPost(draft)) setDraft('');
  }
  return (
    <form className="thread__composer" onSubmit={submit}>
      <label htmlFor={fieldId}>Add a comment</label>
      <textarea id={fieldId} value={draft} onChange={(e) => setDraft(e.target.value)} />
      <div className="form__buttons">
        <button type="submit" disabled={!draft.trim()}>
          Post comment
        </button>
      </div>
    </form>
  );
}

interface TextFormProps {
  label: string;
  submitLabel: string;
  initial: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

function TextForm({ label, submitLabel, initial, onSubmit, onCancel }: TextFormProps) {
  const [value, setValue] = useState(initial);
  const fieldId = useId();
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length); // caret at the end when editing
  }, []);

  return (
    <form
      className="comment__form"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value);
      }}
    >
      <label htmlFor={fieldId}>{label}</label>
      <textarea
        id={fieldId}
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
      />
      <div className="form__buttons">
        <button type="submit" disabled={!value.trim()}>
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
