import Autocomplete from '../Autocomplete';
import { createFakeApi, type } from './helpers';

describe('Autocomplete — public', () => {
  beforeEach(() => timers.useFake());

  it('renders a labelled, collapsed combobox', () => {
    const { api } = createFakeApi();
    render(<Autocomplete label="Search fruits" fetchSuggestions={api} />);
    const input = screen.getByRole('combobox', { name: 'Search fruits' });
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
  });

  it('debounces: one request for the latest query after the delay', () => {
    const { api } = createFakeApi();
    render(<Autocomplete fetchSuggestions={api} debounceMs={300} />);
    const input = screen.getByRole('combobox');
    type(input, 'a');
    timers.advance(100);
    type(input, 'ap');
    timers.advance(100);
    type(input, 'app');
    timers.advance(299);
    expect(api).toHaveBeenCalledTimes(0);
    timers.advance(1);
    expect(api).toHaveBeenCalledTimes(1);
    expect(api.mock.calls[0][0]).toBe('app');
    expect(api.mock.calls[0][1] instanceof AbortSignal).toBe(true);
  });

  it('shows a loading state, then the suggestions', async () => {
    const { api, calls } = createFakeApi();
    render(<Autocomplete fetchSuggestions={api} />);
    const input = screen.getByRole('combobox');
    type(input, 'ap');
    timers.advance(300);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    calls[0].resolve(['apple', 'apricot']);
    await flush();
    const options = screen.getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['apple', 'apricot']);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('status')).not.toHaveTextContent('Loading');
  });

  it('shows an empty state when there are no matches', async () => {
    const { api, calls } = createFakeApi();
    render(<Autocomplete fetchSuggestions={api} />);
    type(screen.getByRole('combobox'), 'zzz');
    timers.advance(300);
    calls[0].resolve([]);
    await flush();
    expect(screen.getByRole('status')).toHaveTextContent('No results');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('ArrowDown + Enter selects a suggestion', async () => {
    const { api, calls } = createFakeApi();
    const onSelect = fn();
    render(<Autocomplete fetchSuggestions={api} onSelect={onSelect} />);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    type(input, 'ap');
    timers.advance(300);
    calls[0].resolve(['apple', 'apricot']);
    await flush();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('apricot');
    expect(input.value).toBe('apricot');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });
});
