import { addReply, countDescendants, deleteComment, toggleVote } from '../commentStore';
import { deepFreeze, makeStore } from './helpers';

describe('commentStore — public', () => {
  it('addReply appends a nested reply without mutating the store, sharing untouched parts', () => {
    const store = deepFreeze(makeStore());
    const snapshot = JSON.stringify(store);
    const next = addReply(store, 'c2', { id: 'r1', author: 'Zoe', text: '  Deep reply  ', createdAt: 42 });

    expect(JSON.stringify(store)).toBe(snapshot);
    expect(next).not.toBe(store);
    expect(next.byId.r1).toEqual({ id: 'r1', parentId: 'c2', author: 'Zoe', text: 'Deep reply', createdAt: 42, votes: 0, voted: false, edited: false, deleted: false, childIds: [] });
    expect(next.byId.c2.childIds).toEqual(['c3', 'r1']);
    expect(next.byId.c2).not.toBe(store.byId.c2);
    // Only the parent changed: everything else keeps its identity.
    expect(next.byId.c1).toBe(store.byId.c1);
    expect(next.byId.c3).toBe(store.byId.c3);
    expect(next.byId.c5).toBe(store.byId.c5);
    expect(next.rootIds).toBe(store.rootIds);
  });

  it('addReply with parentId null adds a top-level comment; invalid input returns the same store', () => {
    const store = deepFreeze(makeStore());
    const next = addReply(store, null, { id: 't1', author: 'Zoe', text: 'Top', createdAt: 1 });
    expect(next.rootIds).toEqual(['c1', 'c5', 'c6', 't1']);
    expect(next.byId.t1.parentId).toBeNull();

    expect(addReply(store, 'c1', { id: 'x', author: 'Zoe', text: '   ', createdAt: 1 })).toBe(store);
    expect(addReply(store, 'nope', { id: 'x', author: 'Zoe', text: 'Hi', createdAt: 1 })).toBe(store);
    expect(addReply(store, 'c1', { id: 'c3', author: 'Zoe', text: 'Duplicate id', createdAt: 1 })).toBe(store);
  });

  it('deleteComment removes a leaf from byId and from its parent (or rootIds)', () => {
    const store = deepFreeze(makeStore());
    const next = deleteComment(store, 'c4');
    expect('c4' in next.byId).toBe(false);
    expect(next.byId.c1.childIds).toEqual(['c2']);
    expect(next.byId.c2).toBe(store.byId.c2);

    const top = deleteComment(store, 'c6');
    expect('c6' in top.byId).toBe(false);
    expect(top.rootIds).toEqual(['c1', 'c5']);
  });

  it('deleteComment soft-deletes a comment that has replies and keeps the whole subtree', () => {
    const store = deepFreeze(makeStore());
    const next = deleteComment(store, 'c1');
    expect(next.byId.c1).toEqual({ ...store.byId.c1, deleted: true, text: '' });
    expect(next.byId.c1.childIds).toEqual(['c2', 'c4']);
    expect(next.byId.c2).toBe(store.byId.c2);
    expect(next.byId.c3).toBe(store.byId.c3);
    expect(next.byId.c4).toBe(store.byId.c4);
    expect(next.rootIds).toBe(store.rootIds);
  });

  it('countDescendants counts replies at every depth', () => {
    const store = makeStore();
    expect(countDescendants(store, 'c1')).toBe(3);
    expect(countDescendants(store, 'c2')).toBe(1);
    expect(countDescendants(store, 'c3')).toBe(0);
    expect(countDescendants(store, 'missing')).toBe(0);
  });

  it('toggleVote adds and removes the current user\'s vote', () => {
    const store = deepFreeze(makeStore());
    const once = toggleVote(store, 'c2');
    expect(once.byId.c2.votes).toBe(2);
    expect(once.byId.c2.voted).toBe(true);
    expect(once.byId.c1).toBe(store.byId.c1);
    const twice = toggleVote(once, 'c2');
    expect(twice.byId.c2.votes).toBe(1);
    expect(twice.byId.c2.voted).toBe(false);
    expect(toggleVote(store, 'missing')).toBe(store);
  });
});
