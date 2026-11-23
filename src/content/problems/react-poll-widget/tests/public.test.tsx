import Poll from '../Poll';
import { createFakeApi, makePoll, resultRows, shownPercentages } from './helpers';

async function loaded(votes: [number, number, number] = [1, 1, 1], viewerVote: string | null = null) {
  const fake = createFakeApi();
  render(<Poll pollId="pets" api={fake.api} />);
  fake.loads[0].resolve(makePoll(votes, viewerVote));
  await flush();
  return fake;
}

describe('Poll — public', () => {
  it('shows a loading status, then the question as a labelled radio group', async () => {
    const fake = createFakeApi();
    render(<Poll pollId="pets" api={fake.api} />);
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
    expect(fake.getPoll).toHaveBeenCalledTimes(1);
    expect(fake.getPoll.mock.calls[0][0]).toBe('pets');
    expect(fake.getPoll.mock.calls[0][1] instanceof AbortSignal).toBe(true);

    fake.loads[0].resolve(makePoll());
    await flush();
    const group = screen.getByRole('group', { name: 'Which pet is best?' });
    expect(group.tagName).toBe('FIELDSET');
    const radios = within(group).getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(within(group).getByRole('radio', { name: 'Dogs' })).toBeInTheDocument();
    expect(screen.getByRole('status')).not.toHaveTextContent(/loading/i);
  });

  it('shows an alert with a Retry button when loading fails, and Retry loads again', async () => {
    const fake = createFakeApi();
    render(<Poll pollId="pets" api={fake.api} />);
    fake.loads[0].reject(new Error('offline'));
    await flush();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(fake.getPoll).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
    fake.loads[1].resolve(makePoll());
    await flush();
    expect(screen.getByRole('group', { name: 'Which pet is best?' })).toBeInTheDocument();
  });

  it('enables Vote once an option is chosen and shows optimistic results while the vote is pending', async () => {
    const fake = await loaded([1, 1, 1]);
    const voteButton = screen.getByRole('button', { name: 'Vote' });
    expect(voteButton).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: 'Cats' }));
    expect(voteButton).not.toBeDisabled();
    fireEvent.click(voteButton);

    expect(fake.vote).toHaveBeenCalledTimes(1);
    expect(fake.vote).toHaveBeenCalledWith('pets', 'cats');
    // Not resolved yet: the results already include our vote (2 of 4 votes for Cats).
    expect(shownPercentages()).toEqual([50, 25, 25]);
    expect(resultRows()[0]).toMatch(/Cats/);
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent(/submitting/i);
  });

  it('replaces the optimistic guess with the server result and announces it politely', async () => {
    const fake = await loaded([1, 1, 1]);
    fireEvent.click(screen.getByRole('radio', { name: 'Dogs' }));
    fireEvent.click(screen.getByRole('button', { name: 'Vote' }));
    // Meanwhile, five other people voted for Birds.
    fake.votes[0].resolve(makePoll([1, 2, 6], 'dogs'));
    await flush();
    expect(shownPercentages()).toEqual([11, 22, 67]);
    expect(resultRows()[1]).toMatch(/2 votes/);
    expect(screen.getByText(/you voted for/i)).toHaveTextContent('Dogs');
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/recorded/i);
    expect(status.getAttribute('aria-live') === 'assertive').toBe(false);
  });

  it('rolls back to the form, keeps the choice and shows an error when the vote fails', async () => {
    const fake = await loaded([1, 1, 1]);
    fireEvent.click(screen.getByRole('radio', { name: 'Birds' }));
    fireEvent.click(screen.getByRole('button', { name: 'Vote' }));
    fake.votes[0].reject(new Error('500'));
    await flush();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Results' })).toBeNull();
    expect((screen.getByRole('radio', { name: 'Birds' }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole('button', { name: 'Vote' })).not.toBeDisabled();
    expect(screen.getByRole('status')).not.toHaveTextContent(/submitting/i);
  });

  it('shows results (and no form) when the server says the viewer already voted', async () => {
    const fake = await loaded([3, 1, 0], 'cats');
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Vote' })).toBeNull();
    expect(shownPercentages()).toEqual([75, 25, 0]);
    expect(screen.getByText(/you voted for/i)).toHaveTextContent('Cats');
    expect(fake.vote).toHaveBeenCalledTimes(0);
  });
});
