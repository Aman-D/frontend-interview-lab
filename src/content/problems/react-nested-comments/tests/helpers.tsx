import CommentThread, { type CommentThreadProps } from '../CommentThread';
import type { Comment, CommentStore } from '../types';

export const T0 = 1_700_000_000_000;
const MIN = 60_000;

export function makeComment(id: string, parentId: string | null, author: string, text: string, minutes: number, votes: number, childIds: string[] = []): Comment {
  return { id, parentId, author, text, createdAt: T0 + minutes * MIN, votes, voted: false, edited: false, deleted: false, childIds };
}

/**
 * Fresh fixture for every test.
 *   c1 Ada (2 votes)            c5 Cleo (5 votes, HTML-looking text)     c6 Dev (0 votes, newest)
 *   ├─ c2 Ben ── c3 Eve
 *   └─ c4 You
 */
export function makeStore(): CommentStore {
  return {
    rootIds: ['c1', 'c5', 'c6'],
    byId: {
      c1: makeComment('c1', null, 'Ada', 'Recursion is the natural fit here.', 0, 2, ['c2', 'c4']),
      c2: makeComment('c2', 'c1', 'Ben', 'Unless the thread is thousands of levels deep.', 1, 1, ['c3']),
      c3: makeComment('c3', 'c2', 'Eve', 'Then flatten it and render a window.', 2, 0),
      c4: makeComment('c4', 'c1', 'You', 'Agreed.', 3, 0),
      c5: makeComment('c5', null, 'Cleo', '<img src=x onerror="window.__ncPwned=true"> is just text here.', 10, 5),
      c6: makeComment('c6', null, 'Dev', 'Newest top-level comment.', 20, 0),
    },
  };
}

/** Recursively freezes a value so any mutation throws in strict-mode code. */
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v);
  }
  return value;
}

/**
 * Renders the thread with a deep-frozen copy of the fixture (so mutating it throws), deterministic ids
 * (n1, n2, …) and a clock that is always later than every fixture comment.
 */
export function renderThread(overrides: Partial<CommentThreadProps> = {}) {
  const onChange = fn();
  let seq = 0;
  let clock = T0 + 100 * MIN;
  const utils = render(
    <CommentThread
      initialStore={deepFreeze(makeStore())}
      currentUser="You"
      onChange={onChange}
      generateId={() => `n${++seq}`}
      now={() => (clock += MIN)}
      {...overrides}
    />,
  );
  return { ...utils, onChange, lastStore: () => onChange.mock.calls[onChange.mock.calls.length - 1][0] as CommentStore };
}

/** A comment's <article>, named "Comment by <author>" (or "Deleted comment"). */
export const comment = (author: string) => screen.getByRole('article', { name: `Comment by ${author}` });

export const topList = () => screen.getByRole('list', { name: /^Comments/ });

/** aria-labels of the articles that are DIRECT items of `list`, in DOM order. */
export function labelsIn(list: HTMLElement) {
  return Array.from(list.children).map((li) => li.querySelector('article')?.getAttribute('aria-label'));
}

export const button = (scope: HTMLElement, name: string | RegExp) => within(scope).getByRole('button', { name });
