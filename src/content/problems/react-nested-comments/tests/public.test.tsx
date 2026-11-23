import { button, comment, labelsIn, renderThread, topList } from './helpers';

describe('CommentThread — public', () => {
  it('renders replies recursively as nested lists, newest top-level comment first', () => {
    renderThread();
    expect(screen.getByRole('heading', { name: 'Comments (6)' })).toBeInTheDocument();
    expect(labelsIn(topList())).toEqual(['Comment by Dev', 'Comment by Cleo', 'Comment by Ada']);
    expect(labelsIn(screen.getByRole('list', { name: 'Replies to Ada' }))).toEqual(['Comment by Ben', 'Comment by You']);
    expect(labelsIn(screen.getByRole('list', { name: 'Replies to Ben' }))).toEqual(['Comment by Eve']);
    // Eve's reply is nested inside Ada's list item, two levels down.
    expect(comment('Ada').closest('li')!.contains(comment('Eve'))).toBe(true);
    expect(comment('Eve')).toHaveTextContent('Then flatten it and render a window.');
  });

  it('Reply moves focus into a labelled textarea; posting appends the reply and returns focus', () => {
    const { onChange, lastStore } = renderThread();
    fireEvent.click(button(comment('Ben'), 'Reply to Ben'));
    const box = screen.getByRole('textbox', { name: 'Your reply to Ben' });
    expect(box).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Post reply' })).toBeDisabled();

    fireEvent.change(box, { target: { value: '  Virtualise it  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post reply' }));

    expect(screen.queryByRole('textbox', { name: 'Your reply to Ben' })).toBeNull();
    expect(labelsIn(screen.getByRole('list', { name: 'Replies to Ben' }))).toEqual(['Comment by Eve', 'Comment by You']);
    expect(screen.getByText('Virtualise it')).toBeInTheDocument();
    expect(button(comment('Ben'), 'Reply to Ben')).toHaveFocus();
    expect(button(comment('Ada'), '4 replies to Ada')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Comments (7)' })).toBeInTheDocument();

    expect(onChange).toHaveBeenCalledTimes(1);
    const store = lastStore();
    expect(store.byId.c2.childIds).toEqual(['c3', 'n1']);
    expect(store.byId.n1).toEqual({ id: 'n1', parentId: 'c2', author: 'You', text: 'Virtualise it', createdAt: store.byId.n1.createdAt, votes: 0, voted: false, edited: false, deleted: false, childIds: [] });
    expect(store.byId.n1.createdAt).toBeGreaterThan(store.byId.c3.createdAt);
  });

  it('Cancel closes the reply box without changes and returns focus to the Reply button', () => {
    const { onChange } = renderThread();
    fireEvent.click(button(comment('Ada'), 'Reply to Ada'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your reply to Ada' }), { target: { value: 'never mind' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('textbox', { name: 'Your reply to Ada' })).toBeNull();
    expect(button(comment('Ada'), 'Reply to Ada')).toHaveFocus();
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  it('deleting a leaf removes it; deleting a comment with replies leaves "[deleted]" and keeps the replies', () => {
    const first = renderThread(); // signed in as "You"
    fireEvent.click(button(comment('You'), 'Delete comment by You'));
    expect(screen.queryByRole('article', { name: 'Comment by You' })).toBeNull();
    expect(screen.queryByText('Agreed.')).toBeNull();
    expect(button(comment('Ada'), '2 replies to Ada')).toBeInTheDocument();
    expect(first.lastStore().byId.c1.childIds).toEqual(['c2']);
    first.unmount();

    const second = renderThread({ currentUser: 'Ben' });
    fireEvent.click(button(comment('Ben'), 'Delete comment by Ben'));
    const tombstone = screen.getByRole('article', { name: 'Deleted comment' });
    expect(tombstone).toHaveTextContent('[deleted]');
    expect(tombstone).not.toHaveTextContent('Unless the thread');
    expect(comment('Eve')).toBeVisible();
    expect(second.lastStore().byId.c2.deleted).toBe(true);
  });

  it('collapses and expands a thread; the toggle shows the total reply count', () => {
    renderThread();
    const toggle = button(comment('Ada'), '3 replies to Ada');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('article', { name: 'Comment by Ben' })).toBeNull();
    expect(screen.queryByRole('article', { name: 'Comment by Eve' })).toBeNull();
    expect(comment('Ada')).toBeVisible();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(comment('Eve')).toBeVisible();
    // Leaves have no toggle.
    expect(within(comment('Eve')).queryByRole('button', { name: /repl(y|ies) to Eve/ })).toBeNull();
  });

  it('upvote toggles aria-pressed and the count', () => {
    const { lastStore } = renderThread();
    const up = button(comment('Ben'), 'Upvote comment by Ben');
    const count = within(comment('Ben')).getByTestId('vote-count');
    expect(up).toHaveAttribute('aria-pressed', 'false');
    expect(count).toHaveTextContent('1');
    fireEvent.click(up);
    expect(up).toHaveAttribute('aria-pressed', 'true');
    expect(within(comment('Ben')).getByTestId('vote-count')).toHaveTextContent('2');
    expect(lastStore().byId.c2.votes).toBe(2);
    fireEvent.click(up);
    expect(up).toHaveAttribute('aria-pressed', 'false');
    expect(within(comment('Ben')).getByTestId('vote-count')).toHaveTextContent('1');
  });

  it('sorting by Top reorders top-level comments only', () => {
    renderThread();
    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'top' } });
    expect(labelsIn(topList())).toEqual(['Comment by Cleo', 'Comment by Ada', 'Comment by Dev']);
    expect(labelsIn(screen.getByRole('list', { name: 'Replies to Ada' }))).toEqual(['Comment by Ben', 'Comment by You']);
    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'newest' } });
    expect(labelsIn(topList())).toEqual(['Comment by Dev', 'Comment by Cleo', 'Comment by Ada']);
  });
});

