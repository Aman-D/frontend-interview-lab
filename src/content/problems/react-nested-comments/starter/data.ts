import type { Comment, CommentStore } from './types';

const t0 = Date.UTC(2026, 10, 20, 9, 0);
const min = 60_000;

function c(id: string, parentId: string | null, author: string, text: string, minutes: number, votes: number, childIds: string[] = []): Comment {
  return { id, parentId, author, text, createdAt: t0 + minutes * min, votes, voted: false, edited: false, deleted: false, childIds };
}

/** Sample discussion used by App.tsx. Six levels deep on the first thread. */
export const sampleStore: CommentStore = {
  rootIds: ['a1', 'b1', 'x1'],
  byId: {
    a1: c('a1', null, 'Priya', 'Should the reply tree live in one normalised map or as nested objects?', 0, 7, ['a2', 'a5']),
    a2: c('a2', 'a1', 'Marco', 'A map keyed by id. Edits become O(1) lookups instead of tree searches.', 4, 4, ['a3']),
    a3: c('a3', 'a2', 'Priya', 'But rendering needs the nesting back.', 9, 1, ['a4']),
    a4: c('a4', 'a3', 'Lena', 'childIds gives you the nesting; recursion walks it.', 15, 3, ['a6']),
    a6: c('a6', 'a4', 'You', 'And each level only needs its own ids.', 18, 0, ['a7']),
    a7: c('a7', 'a6', 'Marco', 'Past a few levels the indentation stops growing so long threads stay readable.', 22, 0),
    a5: c('a5', 'a1', 'Tomás', 'Nested objects are fine until you need to update something five levels down.', 30, 2),
    b1: c('b1', null, 'Lena', 'Reminder: comment text is user input. Render it as text, never as HTML.', 60, 12, ['b2']),
    b2: c('b2', 'b1', 'You', 'Agreed — React escapes text children for us.', 64, 1),
    x1: c('x1', null, 'Sam', '<img src=x onerror="alert(1)"> should show up as literal text.', 90, 0),
  },
};
