import Autocomplete from '../Autocomplete';
import { createFakeApi, type } from './helpers';

describe('Autocomplete — hidden', () => {
  beforeEach(() => timers.useFake());

  it('ignores a stale response that arrives after a newer one (and aborts it)', async () => {
    const { api, calls } = createFakeApi();
    render(<Autocomplete fetchSuggestions={api} />);
    const input = screen.getByRole('combobox');
    type(input, 'a');
    timers.advance(300);
    type(input, 'ap');
    timers.advance(300);
    expect(calls).toHaveLength(2);
    expect(calls[0].signal.aborted).toBe(true);
    calls[1].resolve(['apple']);
    await flush();
    calls[0].resolve(['avocado', 'banana']);
    await flush();
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['apple']);
  });

  it('shows an error alert on failure, but not for its own aborted requests', async () => {
    const { api, calls } = createFakeApi({ rejectOnAbort: true });
    render(<Autocomplete fetchSuggestions={api} />);
    const input = screen.getByRole('combobox');
    type(input, 'a');
    timers.advance(300);
    type(input, 'ab'); // aborts request #1 → AbortError rejection must be ignored
    await flush();
    expect(screen.queryByRole('alert')).toBeNull();
    timers.advance(300);
    calls[1].reject(new Error('boom'));
    await flush();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('exposes the highlighted option via aria-activedescendant / aria-selected; Escape closes', async () => {
    const { api, calls } = createFakeApi();
    render(<Autocomplete fetchSuggestions={api} />);
    const input = screen.getByRole('combobox');
    type(input, 'b');
    timers.advance(300);
    calls[0].resolve(['banana', 'blueberry']);
    await flush();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const activeId = input.getAttribute('aria-activedescendant');
    expect(activeId).toBeTruthy();
    const activeEl = document.getElementById(activeId as string) as HTMLElement;
    expect(activeEl).toHaveTextContent('banana');
    expect(activeEl).toHaveAttribute('aria-selected', 'true');
    expect(input.getAttribute('aria-controls')).toBe(screen.getByRole('listbox').id);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('wraps keyboard navigation at both ends', async () => {
    const { api, calls } = createFakeApi();
    render(<Autocomplete fetchSuggestions={api} />);
    const input = screen.getByRole('combobox');
    type(input, 'c');
    timers.advance(300);
    calls[0].resolve(['cherry', 'coconut', 'cranberry']);
    await flush();
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(document.getElementById(input.getAttribute('aria-activedescendant') as string)).toHaveTextContent('cranberry');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(document.getElementById(input.getAttribute('aria-activedescendant') as string)).toHaveTextContent('cherry');
  });

  it('does not search below minChars and closes the list when cleared', async () => {
    const { api, calls } = createFakeApi();
    render(<Autocomplete fetchSuggestions={api} minChars={2} />);
    const input = screen.getByRole('combobox');
    type(input, 'a');
    timers.advance(1000);
    expect(api).toHaveBeenCalledTimes(0);
    type(input, 'ap');
    timers.advance(300);
    calls[0].resolve(['apple']);
    await flush();
    expect(screen.getAllByRole('option')).toHaveLength(1);
    type(input, '');
    timers.advance(300);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(api).toHaveBeenCalledTimes(1);
  });

  it('selects with a mouse click and does not search for the selected value', async () => {
    const { api, calls } = createFakeApi();
    const onSelect = fn();
    render(<Autocomplete fetchSuggestions={api} onSelect={onSelect} />);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    type(input, 'pe');
    timers.advance(300);
    calls[0].resolve(['peach', 'pear']);
    await flush();
    fireEvent.click(screen.getByRole('option', { name: 'pear' }));
    expect(onSelect).toHaveBeenCalledWith('pear');
    expect(input.value).toBe('pear');
    timers.advance(1000);
    expect(api).toHaveBeenCalledTimes(1);
  });

  it('aborts the in-flight request on unmount', () => {
    const { api, calls } = createFakeApi();
    const view = render(<Autocomplete fetchSuggestions={api} />);
    type(screen.getByRole('combobox'), 'k');
    timers.advance(300);
    expect(calls[0].signal.aborted).toBe(false);
    view.unmount();
    expect(calls[0].signal.aborted).toBe(true);
  });
});
