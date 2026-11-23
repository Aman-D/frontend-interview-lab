import { useState } from 'react';
import Poll from './Poll';
import { createMockPollApi } from './api';
import './styles.css';

// One mock server for the whole preview, so votes persist while you play.
const { api, controls } = createMockPollApi();

export default function App() {
  const [failVotes, setFailVotes] = useState(false);
  const [failLoads, setFailLoads] = useState(false);
  const [mountKey, setMountKey] = useState(0);

  return (
    <main className="app">
      <h1>Poll widget</h1>
      <div className="controls">
        <label>
          <input
            type="checkbox"
            checked={failVotes}
            onChange={(e) => {
              setFailVotes(e.target.checked);
              controls.failVotes = e.target.checked;
            }}
          />{' '}
          Votes fail (test rollback)
        </label>
        <label>
          <input
            type="checkbox"
            checked={failLoads}
            onChange={(e) => {
              setFailLoads(e.target.checked);
              controls.failLoads = e.target.checked;
            }}
          />{' '}
          Loads fail (test retry)
        </label>
        <button type="button" onClick={() => setMountKey((k) => k + 1)}>
          Remount polls
        </button>
      </div>
      <div className="polls" key={mountKey}>
        <Poll pollId="lunch" api={api} />
        <Poll pollId="editor" api={api} />
      </div>
    </main>
  );
}
