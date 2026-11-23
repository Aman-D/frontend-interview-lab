import { addReply, countDescendants, deleteComment, editComment, sortRootIds, toggleVote } from '../commentStore';
import { deepFreeze, makeComment, makeStore } from './helpers';

describe('commentStore — hidden', () => {
  it('deleting the last reply of a [deleted] comment prunes the placeholder, cascading upwards', () => {
    const store = deepFreeze(makeStore());
    const s1 = deleteComment(store, 'c2'); // has c3 → soft
    expect(s1.byId.c2.deleted).toBe(true);
    const s2 = deleteComment(s1, 'c3'); // leaf → removed, and c2 is now an empty tombstone → removed too
    expect('c3' in s2.byId).toBe(false);
    expect('c2' in s2.byId).toBe(false);
    expect(s2.byId.c1.childIds).toEqual(['c4']);
    expect(s2.byId.c1.deleted).toBe(false); // a live parent is never pruned

    const s3 = deleteComment(s2, 'c1'); // still has c4 → soft
    const s4 = deleteComment(s3, 'c4'); // last reply gone → the top-level tombstone goes as well
    expect(Object.keys(s4.byId).sort()).toEqual(['c5', 'c6']);
    expect(s4.rootIds).toEqual(['c5', 'c6']);
  });

  it('deleteComment is a no-op for unknown or already-deleted comments and copies nothing else', () => {
    const store = deepFreeze(makeStore());
    expect(deleteComment(store, 'missing')).toBe(store);
    const soft = deleteComment(store, 'c2');
    expect(deleteComment(soft, 'c2')).toBe(soft);
    expect(soft.byId.c5).toBe(store.byId.c5);
    expect(soft.byId.c1).toBe(store.byId.c1);
  });

  it('countDescendants skips deleted placeholders but still counts their replies', () => {
    const soft = deleteComment(deepFreeze(makeStore()), 'c2');
    expect(countDescendants(soft, 'c1')).toBe(2);
    expect(countDescendants(soft, 'c2')).toBe(1);
  });

  it('countDescendants handles deep chains', () => {
    let store = makeStore();
    let parent = 'c3';
    for (let i = 0; i < 300; i++) {
      store = addReply(store, parent, { id: `d${i}`, author: 'Bot', text: `level ${i}`, createdAt: i });
      parent = `d${i}`;
    }
    expect(countDescendants(store, 'c1')).toBe(303);
    expect(countDescendants(store, 'd0')).toBe(299);
  });

  it('editComment trims, marks edited and ignores empty, unchanged, deleted or unknown targets', () => {
    const store = deepFreeze(makeStore());
    const next = editComment(store, 'c4', '  Agreed, mostly.  ');
    expect(next.byId.c4.text).toBe('Agreed, mostly.');
    expect(next.byId.c4.edited).toBe(true);
    expect(next.byId.c1).toBe(store.byId.c1);
    expect(next.rootIds).toBe(store.rootIds);

    expect(editComment(store, 'c4', '   ')).toBe(store);
    expect(editComment(store, 'c4', ' Agreed. ')).toBe(store);
    expect(editComment(store, 'missing', 'Hi')).toBe(store);
    const soft = deleteComment(store, 'c1');
    expect(editComment(soft, 'c1', 'Resurrected')).toBe(soft);
  });

  it('toggleVote and addReply refuse deleted comments', () => {
    const soft = deleteComment(deepFreeze(makeStore()), 'c1');
    expect(toggleVote(soft, 'c1')).toBe(soft);
    expect(addReply(soft, 'c1', { id: 'r', author: 'Zoe', text: 'Hello?', createdAt: 1 })).toBe(soft);
  });

  it('sortRootIds returns a new, deterministic order and never sorts in place', () => {
    const store = deepFreeze(makeStore());
    const newest = sortRootIds(store, 'newest');
    expect(newest).toEqual(['c6', 'c5', 'c1']);
    expect(newest).not.toBe(store.rootIds);
    expect(sortRootIds(store, 'top')).toEqual(['c5', 'c1', 'c6']);
    expect(store.rootIds).toEqual(['c1', 'c5', 'c6']);

    // Ties: votes, then createdAt (newest first), then id.
    const tied = deepFreeze({
      rootIds: ['b', 'a', 'c', 'd'],
      byId: {
        a: makeComment('a', null, 'A', 'a', 5, 3),
        b: makeComment('b', null, 'B', 'b', 5, 3),
        c: makeComment('c', null, 'C', 'c', 9, 3),
        d: makeComment('d', null, 'D', 'd', 1, 4),
      },
    });
    expect(sortRootIds(tied, 'top')).toEqual(['d', 'c', 'a', 'b']);
    expect(sortRootIds(tied, 'newest')).toEqual(['c', 'a', 'b', 'd']);
  });
});
