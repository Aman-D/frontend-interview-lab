import { button, comment, deepFreeze, labelsIn, makeComment, renderThread, topList } from './helpers';
import type { CommentStore } from '../types';

describe('CommentThread — hidden', () => {
  it('renders HTML-looking comment text as literal text (no element injection)', () => {
    const { container } = renderThread();
    const cleo = comment('Cleo');
    expect(cleo).toHaveTextContent('<img src=x onerror="window.__ncPwned=true"> is just text here.');
    expect(container.querySelector('img')).toBeNull();
    expect((window as unknown as { __ncPwned?: boolean }).__ncPwned).toBeUndefined();
  });

  it('only the current user\'s comments can be edited; Save trims, marks "(edited)" and restores focus', () => {
    const { lastStore, onChange } = renderThread();
    expect(within(comment('Ada')).queryByRole('button', { name: /^Edit/ })).toBeNull();
    expect(within(comment('Ada')).queryByRole('button', { name: /^Delete/ })).toBeNull();

    fireEvent.click(button(comment('You'), 'Edit comment by You'));
    const box = screen.getByRole('textbox', { name: 'Edit your comment' });
    expect(box).toHaveFocus();
    expect(box).toHaveValue('Agreed.');

    fireEvent.change(box, { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    fireEvent.change(box, { target: { value: '  Agreed, mostly.  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.queryByRole('textbox', { name: 'Edit your comment' })).toBeNull();
    expect(comment('You')).toHaveTextContent('Agreed, mostly.');
    expect(comment('You')).toHaveTextContent('(edited)');
    expect(button(comment('You'), 'Edit comment by You')).toHaveFocus();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(lastStore().byId.c4.text).toBe('Agreed, mostly.');
  });

  it('Escape cancels editing or replying and puts focus back on the button that opened it', () => {
    const { onChange } = renderThread();
    fireEvent.click(button(comment('You'), 'Edit comment by You'));
    const edit = screen.getByRole('textbox', { name: 'Edit your comment' });
    fireEvent.change(edit, { target: { value: 'changed my mind' } });
    fireEvent.keyDown(edit, { key: 'Escape' });
    expect(screen.queryByRole('textbox', { name: 'Edit your comment' })).toBeNull();
    expect(comment('You')).toHaveTextContent('Agreed.');
    expect(button(comment('You'), 'Edit comment by You')).toHaveFocus();

    fireEvent.click(button(comment('Eve'), 'Reply to Eve'));
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Your reply to Eve' }), { key: 'Escape' });
    expect(screen.queryByRole('textbox', { name: 'Your reply to Eve' })).toBeNull();
    expect(button(comment('Eve'), 'Reply to Eve')).toHaveFocus();
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  it('per-comment UI state (open reply draft, collapsed thread) follows its comment when the order changes', () => {
    renderThread();
    fireEvent.click(button(comment('Ada'), 'Reply to Ada'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your reply to Ada' }), { target: { value: 'half-written thought' } });
    fireEvent.click(button(comment('Ben'), '1 reply to Ben')); // collapse Ben's thread

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'top' } });
    expect(labelsIn(topList())).toEqual(['Comment by Cleo', 'Comment by Ada', 'Comment by Dev']);
    const draft = within(comment('Ada')).getByRole('textbox', { name: 'Your reply to Ada' });
    expect(draft).toHaveValue('half-written thought');
    expect(screen.getAllByRole('textbox', { name: /^Your reply to/ })).toHaveLength(1);
    expect(button(comment('Ben'), '1 reply to Ben')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('article', { name: 'Comment by Eve' })).toBeNull();
  });

  it('replying to a collapsed thread expands it so the new reply is visible', () => {
    renderThread();
    const toggle = button(comment('Ada'), '3 replies to Ada');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button(comment('Ada'), 'Reply to Ada'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your reply to Ada' }), { target: { value: 'Late to the party' } });
    fireEvent.submit(screen.getByRole('textbox', { name: 'Your reply to Ada' }).closest('form')!);
    const expanded = button(comment('Ada'), '4 replies to Ada');
    expect(expanded).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Late to the party')).toBeVisible();
    expect(labelsIn(screen.getByRole('list', { name: 'Replies to Ada' }))).toEqual(['Comment by Ben', 'Comment by You', 'Comment by You']);
  });

  it('whitespace-only replies and comments are never posted', () => {
    const { onChange } = renderThread();
    fireEvent.click(button(comment('Dev'), 'Reply to Dev'));
    const box = screen.getByRole('textbox', { name: 'Your reply to Dev' });
    fireEvent.change(box, { target: { value: '  \n  ' } });
    expect(screen.getByRole('button', { name: 'Post reply' })).toBeDisabled();
    fireEvent.submit(box.closest('form')!);
    const composer = screen.getByRole('textbox', { name: 'Add a comment' });
    fireEvent.change(composer, { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: 'Post comment' })).toBeDisabled();
    fireEvent.submit(composer.closest('form')!);
    expect(onChange).toHaveBeenCalledTimes(0);
    expect(within(comment('Dev')).queryByRole('button', { name: /repl(y|ies) to Dev/ })).toBeNull();
  });

  it('the composer posts a new top-level comment, which appears first under "Newest"', () => {
    const { lastStore } = renderThread();
    const composer = screen.getByRole('textbox', { name: 'Add a comment' });
    fireEvent.change(composer, { target: { value: 'Fresh take' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }));
    expect(composer).toHaveValue('');
    expect(labelsIn(topList())).toEqual(['Comment by You', 'Comment by Dev', 'Comment by Cleo', 'Comment by Ada']);
    expect(screen.getByRole('heading', { name: 'Comments (7)' })).toBeInTheDocument();
    expect(lastStore().rootIds).toEqual(['c1', 'c5', 'c6', 'n1']);
  });

  it('a [deleted] placeholder has no actions, and disappears once its last reply is deleted; focus is never lost', () => {
    const store: CommentStore = deepFreeze({
      rootIds: ['p1', 'q1'],
      byId: {
        p1: makeComment('p1', null, 'You', 'Parent', 0, 3, ['p2']),
        p2: makeComment('p2', 'p1', 'You', 'Only reply', 1, 0),
        q1: makeComment('q1', null, 'Ada', 'Unrelated', 2, 0),
      },
    });
    renderThread({ initialStore: store });
    const parentArticle = screen.getAllByRole('article', { name: 'Comment by You' })[0];
    fireEvent.click(within(parentArticle).getByRole('button', { name: 'Delete comment by You' }));

    const tombstone = screen.getByRole('article', { name: 'Deleted comment' });
    expect(tombstone).toHaveFocus();
    expect(within(tombstone).queryByRole('button', { name: /^(Reply|Edit|Delete|Upvote)/ })).toBeNull();
    expect(within(tombstone).getByRole('button', { name: '1 reply to deleted comment' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Comments (2)' })).toBeInTheDocument();

    fireEvent.click(button(comment('You'), 'Delete comment by You'));
    expect(screen.queryByRole('article', { name: 'Deleted comment' })).toBeNull();
    expect(labelsIn(topList())).toEqual(['Comment by Ada']);
    expect(screen.getByRole('heading', { name: 'Comments (1)' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Comment deleted.');
  });

  it('deleting a leaf reply moves focus to its parent comment', () => {
    renderThread();
    fireEvent.click(button(comment('You'), 'Delete comment by You'));
    expect(comment('Ada')).toHaveFocus();
    expect(document.activeElement).not.toBe(document.body);
  });
});

