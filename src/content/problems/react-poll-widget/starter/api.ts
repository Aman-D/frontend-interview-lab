// In-memory mock poll server used by the preview. Latency is artificial so that loading,
// pending and rollback states are visible. Other people "vote" in the background, so the
// counts the server returns after your vote can differ from your optimistic guess.
import type { PollApi, PollData } from './types';

const POLLS: Record<string, PollData> = {
  lunch: {
    id: 'lunch',
    question: 'Where should the team go for lunch on Friday?',
    viewerVote: null,
    options: [
      { id: 'tacos', label: 'Taco truck', votes: 12 },
      { id: 'ramen', label: 'Ramen bar', votes: 9 },
      { id: 'salad', label: 'Salad place', votes: 4 },
      { id: 'pizza', label: 'Pizza', votes: 0 },
    ],
  },
  editor: {
    id: 'editor',
    question: 'Tabs or spaces?',
    viewerVote: 'spaces',
    options: [
      { id: 'tabs', label: 'Tabs', votes: 1 },
      { id: 'spaces', label: 'Spaces', votes: 1 },
      { id: 'both', label: 'Whatever the formatter says', votes: 1 },
    ],
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('The request was aborted', 'AbortError'));
    });
  });
}

export function createMockPollApi() {
  const db = clone(POLLS);
  /** Toggled from the preview: while true, every load / vote fails. */
  const controls = { failLoads: false, failVotes: false };

  const api: PollApi = {
    async getPoll(pollId, signal) {
      await wait(400 + Math.random() * 400, signal);
      if (controls.failLoads) throw new Error('Network error');
      const poll = db[pollId];
      if (!poll) throw new Error(`Poll "${pollId}" not found`);
      return clone(poll);
    },
    async vote(pollId, optionId) {
      await wait(900 + Math.random() * 600);
      const poll = db[pollId];
      if (controls.failVotes) throw new Error('Vote rejected by server');
      if (!poll) throw new Error(`Poll "${pollId}" not found`);
      // The server enforces one vote per user.
      if (poll.viewerVote) throw new Error('Already voted');
      const option = poll.options.find((o) => o.id === optionId);
      if (!option) throw new Error('Unknown option');
      option.votes += 1;
      poll.viewerVote = optionId;
      // Someone else voted while our request was in flight.
      poll.options[Math.floor(Math.random() * poll.options.length)].votes += 1;
      return clone(poll);
    },
  };

  return { api, controls };
}
