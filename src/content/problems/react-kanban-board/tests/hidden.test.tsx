import KanbanBoard from '../KanbanBoard';
import { column, countIn, handle, makeBoard, pickUp, press, pressOnFocused, status, titlesIn } from './helpers';

describe('KanbanBoard — hidden', () => {
  it('focus follows the card when it moves to another column and back (the <li> is remounted)', () => {
    render(<KanbanBoard initialBoard={makeBoard()} />);
    const alphaNode = handle('Alpha');
    const charlieNode = handle('Charlie');
    pickUp('Bravo');
    pressOnFocused('ArrowRight');
    // Stable keys (card ids, not indexes): the cards left behind keep their DOM nodes.
    expect(handle('Alpha')).toBe(alphaNode);
    expect(handle('Charlie')).toBe(charlieNode);
    expect(titlesIn('In progress')).toEqual(['Delta', 'Bravo']);
    expect(handle('Bravo')).toHaveFocus();
    pressOnFocused('ArrowRight');
    expect(titlesIn('Done')).toEqual(['Echo', 'Bravo']);
    expect(handle('Bravo')).toHaveFocus();
    pressOnFocused('ArrowLeft');
    pressOnFocused('ArrowLeft');
    expect(titlesIn('To do')).toEqual(['Alpha', 'Bravo', 'Charlie']);
    expect(handle('Bravo')).toHaveFocus();
    expect(handle('Bravo')).toHaveAttribute('aria-pressed', 'true');
  });

  it('arrows stop at the edges, are prevented while moving, and do nothing before pick-up', () => {
    const onChange = fn();
    render(<KanbanBoard initialBoard={makeBoard()} onChange={onChange} />);
    const alpha = handle('Alpha');
    alpha.focus();
    press(alpha, 'ArrowDown'); // not picked up yet
    expect(titlesIn('To do')).toEqual(['Alpha', 'Bravo', 'Charlie']);

    press(alpha, ' ');
    expect(pressOnFocused('ArrowUp')).toBe(false); // preventDefault: arrows must not scroll the page
    expect(pressOnFocused('ArrowLeft')).toBe(false);
    expect(titlesIn('To do')).toEqual(['Alpha', 'Bravo', 'Charlie']);
    pressOnFocused('ArrowRight');
    pressOnFocused('ArrowRight');
    pressOnFocused('ArrowRight'); // already in the last column
    expect(titlesIn('Done')).toEqual(['Alpha', 'Echo']);
    pressOnFocused('ArrowDown');
    pressOnFocused('ArrowDown'); // already last
    expect(titlesIn('Done')).toEqual(['Echo', 'Alpha']);
    expect(handle('Alpha')).toHaveFocus();
    pressOnFocused(' ');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].columns[2].cardIds).toEqual(['e', 'a']);
  });

  it('a card can be moved into an empty column; the row is clamped to the column length', () => {
    const board = makeBoard();
    board.columns[2].cardIds = [];
    delete board.cards.e;
    const onChange = fn();
    render(<KanbanBoard initialBoard={board} onChange={onChange} />);
    expect(countIn('Done')).toBe('0');
    pickUp('Charlie'); // row 3
    pressOnFocused('ArrowRight');
    expect(titlesIn('In progress')).toEqual(['Delta', 'Charlie']);
    pressOnFocused('ArrowRight');
    expect(titlesIn('Done')).toEqual(['Charlie']);
    expect(countIn('Done')).toBe('1');
    expect(status()).toHaveTextContent(/position 1 of 1 in Done/i);
    pressOnFocused(' ');
    expect(onChange.mock.calls[0][0].columns[2].cardIds).toEqual(['c']);
  });

  it('dropping a card where it started is not reported as a change', () => {
    const onChange = fn();
    render(<KanbanBoard initialBoard={makeBoard()} onChange={onChange} />);
    pickUp('Bravo');
    pressOnFocused('ArrowDown');
    pressOnFocused('ArrowUp');
    pressOnFocused(' ');
    expect(titlesIn('To do')).toEqual(['Alpha', 'Bravo', 'Charlie']);
    expect(handle('Bravo')).toHaveAttribute('aria-pressed', 'false');
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  it('handles describe the keyboard instructions, and the live region exists (empty) before anything happens', () => {
    render(<KanbanBoard initialBoard={makeBoard()} />);
    const live = status();
    expect(live).toBeInTheDocument();
    expect((live.textContent ?? '').trim()).toBe('');
    const describedBy = handle('Delta').getAttribute('aria-describedby');
    expect(typeof describedBy).toBe('string');
    const text = document.getElementById(describedBy as string)?.textContent ?? '';
    expect(text).toMatch(/space/i);
    expect(text).toMatch(/escape/i);
    expect(handle('Delta')).toHaveAttribute('tabindex', '0');
  });

  it('the Move button offers single-pointer moves (WCAG 2.5.7) and keeps focus on the card', () => {
    const onChange = fn();
    render(<KanbanBoard initialBoard={makeBoard()} onChange={onChange} />);
    const moveAlpha = screen.getByRole('button', { name: 'Move Alpha' });
    expect(moveAlpha).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(moveAlpha);
    expect(moveAlpha).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Move up' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Move to To do' })).toBeNull(); // not its own column
    fireEvent.click(screen.getByRole('button', { name: 'Move to Done' }));
    expect(titlesIn('Done')).toEqual(['Echo', 'Alpha']);
    expect(titlesIn('To do')).toEqual(['Bravo', 'Charlie']);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Move to In progress' })).toBeNull(); // menu closed
    expect(handle('Alpha')).toHaveFocus();
    expect(status()).toHaveTextContent(/Alpha/);
    expect(status()).toHaveTextContent(/Done/);

    fireEvent.click(screen.getByRole('button', { name: 'Move Alpha' }));
    expect(screen.getByRole('button', { name: 'Move down' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Move up' }));
    expect(titlesIn('Done')).toEqual(['Alpha', 'Echo']);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls[1][0].columns[2].cardIds).toEqual(['a', 'e']);
  });

  it('after a delete, focus moves to the next card, else the previous one, else the column input', () => {
    render(<KanbanBoard initialBoard={makeBoard()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Bravo' }));
    expect(handle('Charlie')).toHaveFocus();
    expect(status()).toHaveTextContent(/deleted bravo/i);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Charlie' }));
    expect(handle('Alpha')).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Delta' }));
    expect(within(column('In progress')).getByRole('textbox', { name: 'New card in In progress' })).toHaveFocus();
    expect(countIn('In progress')).toBe('0');
  });

  it('new cards get unique ids (same titles allowed) and can be moved with the keyboard', () => {
    const onChange = fn();
    const board = makeBoard();
    render(<KanbanBoard initialBoard={board} onChange={onChange} />);
    const done = column('Done');
    const input = within(done).getByRole('textbox', { name: 'New card in Done' });
    fireEvent.change(input, { target: { value: 'Retro' } });
    fireEvent.click(within(done).getByRole('button', { name: 'Add card' }));
    fireEvent.change(input, { target: { value: 'Retro' } });
    fireEvent.keyDown(input, { key: 'Enter' }); // Enter in the input adds too
    expect(titlesIn('Done')).toEqual(['Echo', 'Retro', 'Retro']);
    const last = onChange.mock.calls[1][0];
    const [, id1, id2] = last.columns[2].cardIds;
    expect(id1 === id2).toBe(false);
    expect(['a', 'b', 'c', 'd', 'e'].includes(id1) || ['a', 'b', 'c', 'd', 'e'].includes(id2)).toBe(false);
    expect(Object.keys(last.cards)).toHaveLength(7);

    const retros = within(done).getAllByRole('button', { name: 'Retro' });
    retros[1].focus();
    press(retros[1], ' ');
    pressOnFocused('ArrowUp');
    pressOnFocused('ArrowUp');
    pressOnFocused(' ');
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange.mock.calls[2][0].columns[2].cardIds).toEqual([id2, 'e', id1]);
  });
});
