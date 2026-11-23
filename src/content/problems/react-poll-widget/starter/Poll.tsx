import { useEffect, useState } from 'react';
import type { PollApi, PollData } from './types';
// import { applyVote, toPercentages, totalVotes } from './pollUtils';

export interface PollProps {
  pollId: string;
  api: PollApi;
}

export default function Poll({ pollId, api }: PollProps) {
  const [poll, setPoll] = useState<PollData | null>(null);

  useEffect(() => {
    // TODO: loading / error + Retry states, cancel or ignore superseded loads (pollId can change).
    api.getPoll(pollId, new AbortController().signal).then(setPoll);
  }, [pollId, api]);

  // TODO:
  // - a <form> with a <fieldset>/<legend> radio group (one radio per option); "Vote" submits
  // - optimistic results while the vote is pending; roll back + show an error if it fails
  // - never send two votes; show "You voted for …" once the viewer has voted (also when the server says so)
  // - results: label, percentage (always summing to 100) and vote count per option, with a bar
  // - announce loading / submitting / recorded through a polite live region
  if (!poll) return <div className="poll">Loading…</div>;
  return (
    <div className="poll">
      <p>{poll.question}</p>
    </div>
  );
}
