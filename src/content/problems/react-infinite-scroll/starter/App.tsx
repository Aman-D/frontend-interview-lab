import { useMemo, useState } from 'react';
import InfiniteFeed from './InfiniteFeed';
import { createMockFeed } from './api';
import './styles.css';

export default function App() {
  const [log, setLog] = useState<string[]>([]);
  const [run, setRun] = useState(0);
  // A new mock API (and a fresh feed via `key`) per run; fetchPage keeps its identity otherwise.
  const api = useMemo(
    () => createMockFeed({ onRequest: (cursor) => setLog((l) => [...l.slice(-7), `GET page cursor=${cursor ?? 'null'}`]) }),
    [run],
  );

  return (
    <main className="app">
      <header className="app__header">
        <h1>Infinite feed</h1>
        <p className="hint">64 posts, 8 per page, 700 ms latency. Every page repeats one post from the previous page — it should appear only once.</p>
        <div className="actions">
          <button type="button" onClick={() => api.failNextRequest()}>Fail next request</button>
          <button type="button" onClick={() => { setLog([]); setRun((r) => r + 1); }}>Reset feed</button>
        </div>
        <ol className="log" aria-label="Request log">
          {log.map((line, i) => <li key={i}>{line}</li>)}
        </ol>
      </header>
      <InfiniteFeed key={run} fetchPage={api.fetchPage} label="Latest posts" />
    </main>
  );
}
