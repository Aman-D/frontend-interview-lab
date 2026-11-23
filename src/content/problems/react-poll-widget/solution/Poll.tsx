import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { applyVote, toPercentages, totalVotes } from './pollUtils';
import type { PollApi, PollData } from './types';

export interface PollProps {
  pollId: string;
  api: PollApi;
}

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; poll: PollData };

const plural = (n: number) => `${n} ${n === 1 ? 'vote' : 'votes'}`;

export default function Poll({ pollId, api }: PollProps) {
  // `load.poll` is the last state the SERVER confirmed. The optimistic guess lives separately, so a rollback
  // is just "throw the guess away" and can never corrupt the confirmed counts.
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [optimistic, setOptimistic] = useState<PollData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [attempt, setAttempt] = useState(0);

  const id = useId();
  const groupName = `${id}-choice`;
  const errorId = `${id}-error`;
  const headingId = `${id}-heading`;

  // Read the latest api without restarting the load when a parent passes a new object each render.
  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  });

  // A synchronous guard: two submits in the same tick must not both reach the server.
  const pendingRef = useRef(false);
  // Bumped whenever a new poll is loaded, so a vote that settles for an old poll (or after unmount) is ignored.
  const generation = useRef(0);

  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusNext = useRef<'results' | 'choice' | null>(null);

  useEffect(() => {
    const gen = ++generation.current;
    const controller = new AbortController();
    pendingRef.current = false;
    setLoad({ status: 'loading' });
    setOptimistic(null);
    setSelected(null);
    setVoteError(null);
    setAnnouncement('Loading poll…');
    apiRef.current.getPoll(pollId, controller.signal).then(
      (poll) => {
        if (controller.signal.aborted) return; // superseded by a newer pollId / retry, or unmounted
        setLoad({ status: 'ready', poll });
        setAnnouncement('');
      },
      () => {
        if (controller.signal.aborted) return;
        setLoad({ status: 'error' });
        setAnnouncement('');
      },
    );
    return () => {
      controller.abort();
      if (generation.current === gen) generation.current++; // invalidate in-flight votes on unmount too
    };
  }, [pollId, attempt]);

  // Move focus only as a consequence of the user's own submit: the form they were in disappears.
  useEffect(() => {
    if (focusNext.current === 'results') headingRef.current?.focus();
    if (focusNext.current === 'choice') formRef.current?.querySelector<HTMLInputElement>('input[type="radio"]:checked')?.focus();
    focusNext.current = null;
  });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pendingRef.current || load.status !== 'ready' || selected === null) return;
    const base = load.poll;
    if (base.viewerVote !== null) return; // already voted (the server enforces this too)
    const guess = applyVote(base, selected);
    if (guess === base) return; // unknown option

    pendingRef.current = true;
    const gen = generation.current;
    const choice = selected;
    setOptimistic(guess);
    setVoteError(null);
    setAnnouncement('Submitting your vote…');
    focusNext.current = 'results';

    try {
      const confirmed = await apiRef.current.vote(pollId, choice);
      if (gen !== generation.current) return;
      setLoad({ status: 'ready', poll: confirmed });
      const voted = confirmed.options.find((o) => o.id === (confirmed.viewerVote ?? choice));
      const pct = toPercentages(confirmed.options.map((o) => o.votes));
      const index = voted ? confirmed.options.indexOf(voted) : -1;
      setAnnouncement(
        voted ? `Vote recorded. ${voted.label} has ${pct[index]}% of ${plural(totalVotes(confirmed))}.` : 'Vote recorded.',
      );
    } catch {
      if (gen !== generation.current) return;
      // Rollback: the confirmed poll was never touched; we only drop the optimistic guess (finally).
      setVoteError('Your vote could not be submitted. Please try again.');
      setAnnouncement('');
      focusNext.current = 'choice';
    } finally {
      if (gen === generation.current) {
        setOptimistic(null);
        pendingRef.current = false;
      }
    }
  }

  return (
    <div className="poll">
      {renderBody()}
      {/* Always mounted at the same position, so assistive tech is already watching it when the text changes. */}
      <p className="poll-status" role="status">
        {announcement}
      </p>
    </div>
  );

  function renderBody() {
    if (load.status === 'loading') return null;

    if (load.status === 'error') {
      return (
        <div className="poll-load-error">
          <p className="poll-error" role="alert">
            The poll could not be loaded.
          </p>
          <button type="button" onClick={() => setAttempt((a) => a + 1)}>
            Retry
          </button>
        </div>
      );
    }

    const shown = optimistic ?? load.poll;
    const pending = optimistic !== null;

    if (shown.viewerVote === null) {
      return (
        <form ref={formRef} onSubmit={onSubmit} noValidate>
          <fieldset aria-describedby={voteError ? errorId : undefined}>
            <legend>{shown.question}</legend>
            {shown.options.map((option) => {
              const inputId = `${id}-${option.id}`;
              return (
                <div className="poll-choice" key={option.id}>
                  <input
                    type="radio"
                    id={inputId}
                    name={groupName}
                    value={option.id}
                    checked={selected === option.id}
                    onChange={() => setSelected(option.id)}
                  />
                  <label htmlFor={inputId}>{option.label}</label>
                </div>
              );
            })}
          </fieldset>
          {voteError && (
            <p className="poll-error" role="alert" id={errorId}>
              {voteError}
            </p>
          )}
          <button type="submit" disabled={selected === null}>
            Vote
          </button>
        </form>
      );
    }

    const percentages = toPercentages(shown.options.map((o) => o.votes));
    const total = totalVotes(shown);
    const votedFor = shown.options.find((o) => o.id === shown.viewerVote);

    return (
      <section className="poll-results" aria-labelledby={headingId} aria-busy={pending}>
        <h2 className="poll-question" id={headingId} ref={headingRef} tabIndex={-1}>
          {shown.question}
        </h2>
        <ul aria-label="Results">
          {shown.options.map((option, i) => {
            const mine = option.id === shown.viewerVote;
            return (
              <li key={option.id} className={mine ? 'poll-result mine' : 'poll-result'}>
                <div className="poll-row">
                  <span className="poll-label">
                    {option.label}
                    {mine && <span className="poll-mine"> (your vote)</span>}
                  </span>
                  <span className="poll-value">
                    {percentages[i]}% <span className="poll-count">({plural(option.votes)})</span>
                  </span>
                </div>
                {/* Decorative: the same information is in the text above, so screen readers skip the bar. */}
                <div className="poll-bar" aria-hidden="true">
                  <div className="poll-fill" style={{ width: `${percentages[i]}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="poll-total">{total === 0 ? 'No votes yet' : `${plural(total)} in total`}</p>
        {votedFor && (
          <p className="poll-voted">
            You voted for <strong>{votedFor.label}</strong>.
          </p>
        )}
      </section>
    );
  }
}
