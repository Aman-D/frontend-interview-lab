import { useState } from 'react';
import StarRating from '../StarRating';

const star = (n: number) => screen.getByRole('radio', { name: n === 1 ? '1 star' : `${n} stars` });
const checkedValue = () => {
  const r = screen.getAllByRole('radio').filter((el: HTMLElement) => el.getAttribute('aria-checked') === 'true');
  return r.length === 0 ? 0 : screen.getAllByRole('radio').indexOf(r[0]) + 1;
};
const tabStops = () => screen.getAllByRole('radio').filter((el: HTMLElement) => el.tabIndex === 0);

describe('StarRating — hidden', () => {
  it('roving tabindex: only the checked star is tabbable, or the first star when nothing is checked', () => {
    const view = render(<StarRating />);
    expect(tabStops()).toEqual([star(1)]);
    expect(screen.getAllByRole('radio').filter((el: HTMLElement) => el.tabIndex === -1)).toHaveLength(4);
    view.unmount();
    render(<StarRating value={4} />);
    expect(tabStops()).toEqual([star(4)]);
  });

  it('arrow keys wrap at both ends (APG radio group) and Up/Down mirror Left/Right', () => {
    render(<StarRating defaultValue={5} />);
    fireEvent.keyDown(star(5), { key: 'ArrowRight' });
    expect(checkedValue()).toBe(1);
    expect(star(1)).toHaveFocus();
    fireEvent.keyDown(star(1), { key: 'ArrowUp' });
    expect(checkedValue()).toBe(5);
    fireEvent.keyDown(star(5), { key: 'ArrowDown' });
    expect(checkedValue()).toBe(1);
  });

  it('Space checks the focused star when nothing is rated yet', () => {
    const onChange = fn();
    render(<StarRating onChange={onChange} />);
    fireEvent.keyDown(star(1), { key: ' ' });
    expect(checkedValue()).toBe(1);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('clamps and validates value, defaultValue and max', () => {
    const view = render(<StarRating value={9} max={5} />);
    expect(checkedValue()).toBe(5);
    view.rerender(<StarRating value={-2} max={5} />);
    expect(checkedValue()).toBe(0);
    view.rerender(<StarRating value={3.6} max={5} />);
    expect(checkedValue()).toBe(4);
    view.rerender(<StarRating value={Number.NaN} max={5} />);
    expect(checkedValue()).toBe(0);
    view.rerender(<StarRating value={9} max={5} readOnly />);
    expect(screen.getByRole('img', { name: '5 out of 5 stars' })).toBeInTheDocument();
    view.unmount();
    const v2 = render(<StarRating defaultValue={42} max={0} />);
    expect(screen.getAllByRole('radio')).toHaveLength(1);
    expect(checkedValue()).toBe(1);
    v2.unmount();
  });

  it('allowClear: clicking the current value clears it; without allowClear it is a no-op', () => {
    const onChange = fn();
    const view = render(<StarRating defaultValue={3} onChange={onChange} allowClear />);
    fireEvent.mouseEnter(star(3));
    fireEvent.click(star(3));
    expect(onChange).toHaveBeenCalledWith(0);
    expect(checkedValue()).toBe(0);
    expect(screen.getAllByRole('radio').every((el: HTMLElement) => el.getAttribute('data-filled') === 'false')).toBe(true);
    view.unmount();
    const onChange2 = fn();
    render(<StarRating defaultValue={3} onChange={onChange2} />);
    fireEvent.click(star(3));
    expect(onChange2).toHaveBeenCalledTimes(0);
    expect(checkedValue()).toBe(3);
  });

  it('works with a parent that owns the state (click and keyboard)', () => {
    function Parent() {
      const [v, setV] = useState(1);
      return (
        <>
          <StarRating label="Score" value={v} onChange={setV} />
          <output data-testid="out">{v}</output>
        </>
      );
    }
    render(<Parent />);
    fireEvent.click(star(4));
    expect(screen.getByTestId('out')).toHaveTextContent('4');
    expect(checkedValue()).toBe(4);
    fireEvent.keyDown(star(4), { key: 'ArrowRight' });
    expect(screen.getByTestId('out')).toHaveTextContent('5');
    expect(star(5)).toHaveFocus();
  });

  it('mode is decided by value !== undefined: value={0} is controlled; defaultValue only initialises', () => {
    const onChange = fn();
    const view = render(<StarRating value={0} defaultValue={2} onChange={onChange} />);
    expect(checkedValue()).toBe(0);
    fireEvent.click(star(3));
    expect(onChange).toHaveBeenCalledWith(3);
    expect(checkedValue()).toBe(0);
    view.unmount();
    const v2 = render(<StarRating defaultValue={2} />);
    fireEvent.click(star(4));
    v2.rerender(<StarRating defaultValue={1} />);
    expect(checkedValue()).toBe(4);
  });

  it('hover preview never commits, and a hover on another star replaces the previous preview', () => {
    const onChange = fn();
    render(<StarRating value={1} onChange={onChange} />);
    const filled = () => screen.getAllByRole('radio').filter((el: HTMLElement) => el.getAttribute('data-filled') === 'true').length;
    fireEvent.mouseEnter(star(5));
    expect(filled()).toBe(5);
    fireEvent.mouseEnter(star(2));
    expect(filled()).toBe(2);
    expect(checkedValue()).toBe(1);
    fireEvent.mouseLeave(screen.getByRole('radiogroup'));
    expect(filled()).toBe(1);
    expect(onChange).toHaveBeenCalledTimes(0);
  });
});
