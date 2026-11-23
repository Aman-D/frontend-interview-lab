import StarRating from '../StarRating';

const star = (n: number) => screen.getByRole('radio', { name: n === 1 ? '1 star' : `${n} stars` });
const checked = () => screen.getAllByRole('radio').filter((r: HTMLElement) => r.getAttribute('aria-checked') === 'true');
const filled = () => screen.getAllByRole('radio').map((r: HTMLElement) => r.getAttribute('data-filled') === 'true');

describe('StarRating — public', () => {
  it('renders a labelled radiogroup with one named radio per star', () => {
    render(<StarRating label="Rate this recipe" />);
    const group = screen.getByRole('radiogroup', { name: 'Rate this recipe' });
    const radios = within(group).getAllByRole('radio');
    expect(radios).toHaveLength(5);
    expect(star(1)).toBeInTheDocument();
    expect(star(5)).toBeInTheDocument();
    expect(checked()).toHaveLength(0);
  });

  it('max is configurable', () => {
    render(<StarRating max={8} />);
    expect(screen.getAllByRole('radio')).toHaveLength(8);
    expect(star(8)).toBeInTheDocument();
  });

  it('uncontrolled: starts from defaultValue and updates on click', () => {
    const onChange = fn();
    render(<StarRating defaultValue={3} onChange={onChange} />);
    expect(star(3)).toHaveAttribute('aria-checked', 'true');
    expect(filled()).toEqual([true, true, true, false, false]);
    fireEvent.click(star(5));
    expect(onChange).toHaveBeenCalledWith(5);
    expect(star(5)).toHaveAttribute('aria-checked', 'true');
    expect(checked()).toHaveLength(1);
  });

  it('controlled: reports changes but renders only what the parent passes', () => {
    const onChange = fn();
    const view = render(<StarRating value={2} onChange={onChange} />);
    fireEvent.click(star(4));
    expect(onChange).toHaveBeenCalledWith(4);
    expect(star(2)).toHaveAttribute('aria-checked', 'true');
    expect(star(4)).toHaveAttribute('aria-checked', 'false');
    view.rerender(<StarRating value={4} onChange={onChange} />);
    expect(star(4)).toHaveAttribute('aria-checked', 'true');
  });

  it('hover previews up to the hovered star; leaving restores the value', () => {
    const onChange = fn();
    render(<StarRating defaultValue={2} onChange={onChange} />);
    fireEvent.mouseEnter(star(4));
    expect(filled()).toEqual([true, true, true, true, false]);
    fireEvent.mouseLeave(screen.getByRole('radiogroup'));
    expect(filled()).toEqual([true, true, false, false, false]);
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  it('ArrowRight / ArrowLeft select the next / previous star and move focus to it', () => {
    const onChange = fn();
    render(<StarRating defaultValue={2} onChange={onChange} />);
    fireEvent.keyDown(star(2), { key: 'ArrowRight' });
    expect(star(3)).toHaveAttribute('aria-checked', 'true');
    expect(star(3)).toHaveFocus();
    expect(onChange).toHaveBeenLastCalledWith(3);
    fireEvent.keyDown(star(3), { key: 'ArrowLeft' });
    fireEvent.keyDown(star(2), { key: 'ArrowLeft' });
    expect(star(1)).toHaveAttribute('aria-checked', 'true');
    expect(star(1)).toHaveFocus();
  });

  it('readOnly renders one accessible image and no radios', () => {
    render(<StarRating value={3} readOnly />);
    expect(screen.getByRole('img', { name: '3 out of 5 stars' })).toBeInTheDocument();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });
});
