import Poll from '../Poll';
import { createFakeApi, makePoll, resultRows, shownPercentages } from './helpers';

async function loaded(votes: [number, number, number] = [1, 1, 1]) {
  const fake = createFakeApi();
  const view = render(<Poll pollId="pets" api={fake.api} />);
  fake.loads[0].resolve(makePoll(votes));
  await flush();
  return { ...fake, view };
}

function choose(label: string) {
  fireEvent.click(screen.getByRole('radio', { name: label }));
}

describe('Poll — hidden', () => {
  it('never sends a second vote: repeated clicks and submits while pending are ignored', async () => {
    const fake = await loaded();
    choose('Cats');
    const button = screen.getByRole('button', { name: 'Vote' });
    const form = button.closest('form') as HTMLFormElement;
    // Two submits before React re-renders (a fast double click / Enter + click): a state-based
    // "pending" flag is still false for the second one; only a synchronous guard stops it.
    act(() => {
      button.click();
      form.requestSubmit();
    });
    fireEvent.click(button);
    fireEvent.submit(form);
    expect(fake.vote).toHaveBeenCalledTimes(1);
    fake.votes[0].resolve(makePoll([2, 1, 1], 'cats'));
    await flush();
    // Voted: no way to vote again.
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Vote' })).toBeNull();
    expect(fake.vote).toHaveBeenCalledTimes(1);
  });

  it('rolls back exactly: a retry after a failure counts the vote once, and the error clears', async () => {
    const fake = await loaded([1, 1, 2]);
    choose('Cats');
    fireEvent.click(screen.getByRole('button', { name: 'Vote' }));
    expect(shownPercentages()).toEqual([40, 20, 40]);
    fake.votes[0].reject(new Error('timeout'));
    await flush();
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Vote' }));
    expect(fake.vote).toHaveBeenCalledTimes(2);
    // Based on the confirmed counts (1,1,2) + 1, not on the failed guess (2,1,2) + 1.
    expect(shownPercentages()).toEqual([40, 20, 40]);
    expect(resultRows()[0]).toMatch(/2 votes/);
    expect(screen.queryByRole('alert')).toBeNull();
    fake.votes[1].resolve(makePoll([2, 1, 2], 'cats'));
    await flush();
    expect(screen.getByRole('status')).toHaveTextContent(/recorded/i);
  });

  it('handles the first vote on an empty poll: 100% / 0%, singular "1 vote"', async () => {
    await loaded([0, 0, 0]);
    choose('Birds');
    fireEvent.click(screen.getByRole('button', { name: 'Vote' }));
    expect(shownPercentages()).toEqual([0, 0, 100]);
    const rows = resultRows();
    expect(rows[2]).toMatch(/\b1 vote\b/);
    expect(rows[2]).not.toMatch(/1 votes/);
    expect(rows[0]).toMatch(/\b0 votes\b/);
  });

  it('shows tied results that still add up to 100%', async () => {
    const fake = await loaded([0, 1, 1]);
    choose('Cats');
    fireEvent.click(screen.getByRole('button', { name: 'Vote' }));
    expect(shownPercentages()).toEqual([34, 33, 33]);
    fake.votes[0].resolve(makePoll([2, 2, 2], 'cats'));
    await flush();
    const shown = shownPercentages();
    expect(shown.reduce((a, b) => a + b, 0)).toBe(100);
    expect(shown).toEqual([34, 33, 33]);
  });

  it('ignores a superseded load when pollId changes, and aborts it', async () => {
    const fake = createFakeApi();
    const view = render(<Poll pollId="pets" api={fake.api} />);
    view.rerender(<Poll pollId="food" api={fake.api} />);
    expect(fake.getPoll).toHaveBeenCalledTimes(2);
    expect(fake.loads[1].pollId).toBe('food');
    expect(fake.loads[0].signal.aborted).toBe(true);
    fake.loads[1].resolve({ ...makePoll(), id: 'food', question: 'Pizza or pasta?' });
    await flush();
    fake.loads[0].resolve(makePoll());
    await flush();
    expect(screen.getByRole('group', { name: 'Pizza or pasta?' })).toBeInTheDocument();
    expect(screen.queryByText('Which pet is best?')).toBeNull();
  });

  it('does not reload when the parent passes a new api object with the same pollId', async () => {
    const fake = createFakeApi();
    const view = render(<Poll pollId="pets" api={{ getPoll: fake.getPoll, vote: fake.vote }} />);
    view.rerender(<Poll pollId="pets" api={{ getPoll: fake.getPoll, vote: fake.vote }} />);
    expect(fake.getPoll).toHaveBeenCalledTimes(1);
    fake.loads[0].resolve(makePoll());
    await flush();
    choose('Dogs');
    view.rerender(<Poll pollId="pets" api={{ getPoll: fake.getPoll, vote: fake.vote }} />);
    expect(fake.getPoll).toHaveBeenCalledTimes(1);
    expect((screen.getByRole('radio', { name: 'Dogs' }) as HTMLInputElement).checked).toBe(true);
  });

  it('keeps focus inside the widget: results after voting, the chosen radio after a failure', async () => {
    const fake = await loaded();
    choose('Dogs');
    const button = screen.getByRole('button', { name: 'Vote' });
    button.focus();
    fireEvent.click(button);
    const active = document.activeElement as HTMLElement;
    expect(active === document.body || active === null).toBe(false);
    expect(fake.view.container.contains(active)).toBe(true);
    fake.votes[0].reject(new Error('nope'));
    await flush();
    expect(screen.getByRole('radio', { name: 'Dogs' })).toHaveFocus();
  });

  it('uses one persistent polite live region and decorative bars', async () => {
    const fake = createFakeApi();
    render(<Poll pollId="pets" api={fake.api} />);
    const status = screen.getByRole('status');
    fake.loads[0].resolve(makePoll([1, 0, 0]));
    await flush();
    choose('Cats');
    fireEvent.click(screen.getByRole('button', { name: 'Vote' }));
    expect(screen.getByRole('status')).toBe(status);
    fake.votes[0].resolve(makePoll([2, 0, 0], 'cats'));
    await flush();
    // The same node, still mounted: screen readers only announce changes to regions they already track.
    expect(screen.getByRole('status')).toBe(status);
    expect(status.isConnected).toBe(true);
    expect(status).toHaveTextContent(/recorded/i);
    expect(resultRows()[0]).toMatch(/your vote/i);
    // Every bar-like element in the results is hidden from assistive tech (the text carries the data).
    const list: HTMLElement = screen.getByRole('list', { name: 'Results' });
    const items = Array.from(list.querySelectorAll('li'));
    items.forEach((li) => {
      const styled = Array.from(li.querySelectorAll<HTMLElement>('[style*="width"]'));
      styled.forEach((el) => expect(el.closest('[aria-hidden="true"], [role="meter"], [role="progressbar"]')).toBeTruthy());
    });
  });
});
