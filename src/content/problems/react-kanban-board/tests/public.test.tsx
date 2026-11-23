import KanbanBoard from '../KanbanBoard';
import { column, countIn, handle, makeBoard, pickUp, pressOnFocused, status, titlesIn } from './helpers';

describe('KanbanBoard — public', () => {
  it('renders each column as a labelled region with its cards in order and a count', () => {
    render(<KanbanBoard initialBoard={makeBoard()} />);
    expect(column('To do')).toBeInTheDocument();
    expect(within(column('To do')).getByRole('heading', { name: 'To do' })).toBeInTheDocument();
    expect(titlesIn('To do')).toEqual(['Alpha', 'Bravo', 'Charlie']);
    expect(titlesIn('In progress')).toEqual(['Delta']);
    expect(titlesIn('Done')).toEqual(['Echo']);
    expect(countIn('To do')).toBe('3');
    expect(countIn('Done')).toBe('1');
  });

  it('adds a trimmed card to the end of a column and ignores blank titles', () => {
    const onChange = fn();
    render(<KanbanBoard initialBoard={makeBoard()} onChange={onChange} />);
    const input = within(column('In progress')).getByRole('textbox', { name: 'New card in In progress' });
    const add = within(column('In progress')).getByRole('button', { name: 'Add card' });

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(add);
    expect(titlesIn('In progress')).toEqual(['Delta']);
    expect(onChange).toHaveBeenCalledTimes(0);

    fireEvent.change(input, { target: { value: '  Write tests  ' } });
    fireEvent.click(add);
    expect(titlesIn('In progress')).toEqual(['Delta', 'Write tests']);
    expect(countIn('In progress')).toBe('2');
    expect(input).toHaveValue('');
    expect(onChange).toHaveBeenCalledTimes(1);
    const board = onChange.mock.calls[0][0];
    const newId = board.columns[1].cardIds[1];
    expect(board.cards[newId].title).toBe('Write tests');
  });

  it('deletes a card from its column and from the board data', () => {
    const onChange = fn();
    render(<KanbanBoard initialBoard={makeBoard()} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Bravo' }));
    expect(titlesIn('To do')).toEqual(['Alpha', 'Charlie']);
    expect(countIn('To do')).toBe('2');
    expect(onChange).toHaveBeenCalledTimes(1);
    const board = onChange.mock.calls[0][0];
    expect(board.columns[0].cardIds).toEqual(['a', 'c']);
    expect('b' in board.cards).toBe(false);
  });

  it('keyboard: Space picks a card up, ArrowDown moves it, Space drops it (with announcements)', () => {
    const onChange = fn();
    render(<KanbanBoard initialBoard={makeBoard()} onChange={onChange} />);
    expect(handle('Alpha')).toHaveAttribute('aria-pressed', 'false');
    pickUp('Alpha');
    expect(handle('Alpha')).toHaveAttribute('aria-pressed', 'true');
    expect(status()).toHaveTextContent(/picked up alpha/i);

    pressOnFocused('ArrowDown');
    expect(titlesIn('To do')).toEqual(['Bravo', 'Alpha', 'Charlie']);
    expect(handle('Alpha')).toHaveFocus();
    expect(status()).toHaveTextContent(/position 2 of 3 in To do/i);
    expect(onChange).toHaveBeenCalledTimes(0); // nothing is committed until the drop

    pressOnFocused(' ');
    expect(handle('Alpha')).toHaveAttribute('aria-pressed', 'false');
    expect(status()).toHaveTextContent(/dropped/i);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].columns[0].cardIds).toEqual(['b', 'a', 'c']);
  });

  it('keyboard: ArrowRight moves the card to the next column, keeping its row; Enter drops', () => {
    const onChange = fn();
    render(<KanbanBoard initialBoard={makeBoard()} onChange={onChange} />);
    pickUp('Alpha');
    pressOnFocused('ArrowRight');
    expect(titlesIn('To do')).toEqual(['Bravo', 'Charlie']);
    expect(titlesIn('In progress')).toEqual(['Alpha', 'Delta']);
    expect(countIn('To do')).toBe('2');
    expect(countIn('In progress')).toBe('2');
    expect(status()).toHaveTextContent(/position 1 of 2 in In progress/i);
    pressOnFocused('Enter');
    expect(onChange).toHaveBeenCalledTimes(1);
    const board = onChange.mock.calls[0][0];
    expect(board.columns[0].cardIds).toEqual(['b', 'c']);
    expect(board.columns[1].cardIds).toEqual(['a', 'd']);
  });

  it('keyboard: Escape cancels the move and puts the card back where it started', () => {
    const onChange = fn();
    render(<KanbanBoard initialBoard={makeBoard()} onChange={onChange} />);
    pickUp('Alpha');
    pressOnFocused('ArrowDown');
    pressOnFocused('ArrowRight');
    expect(titlesIn('In progress')).toEqual(['Delta', 'Alpha']);
    pressOnFocused('Escape');
    expect(titlesIn('To do')).toEqual(['Alpha', 'Bravo', 'Charlie']);
    expect(titlesIn('In progress')).toEqual(['Delta']);
    expect(handle('Alpha')).toHaveAttribute('aria-pressed', 'false');
    expect(status()).toHaveTextContent(/cancel/i);
    expect(onChange).toHaveBeenCalledTimes(0);
  });
});
