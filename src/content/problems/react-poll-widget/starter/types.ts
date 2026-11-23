export interface PollOption {
  id: string;
  label: string;
  /** Number of votes this option has received. A non-negative integer. */
  votes: number;
}

/** A poll as the server returns it. The total vote count is derived from the options. */
export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  /** The option the current viewer has voted for, or null if they have not voted yet. */
  viewerVote: string | null;
}

export interface PollApi {
  /** Loads a poll. Pass `signal` so a superseded request can be cancelled. */
  getPoll(pollId: string, signal: AbortSignal): Promise<PollData>;
  /**
   * Records the viewer's vote. Resolves with the authoritative poll (other people may have voted in the
   * meantime, so the counts can differ from your optimistic guess). Rejects if the vote was not recorded.
   */
  vote(pollId: string, optionId: string): Promise<PollData>;
}
