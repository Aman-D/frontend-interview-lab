import { useState } from 'react';
import { useDebouncedValue, usePrevious, useSWRLite } from './hooks';
import { searchPeople } from './api';
import './styles.css';

function Results({ title, query }: { title: string; query: string }) {
  // Both panels use the same key: one shared cache entry, one request.
  const { data, error, isLoading, mutate } = useSWRLite(query ? `/people?q=${encodeURIComponent(query)}` : null, searchPeople);
  return (
    <section className="panel" aria-label={title}>
      <h2>{title}</h2>
      {!query && <p className="muted">Type to search.</p>}
      {isLoading && <p role="status">Loading…</p>}
      {error !== undefined && <p role="alert">{String((error as Error)?.message ?? error)}</p>}
      {data && (
        <ul>
          {data.map((p) => (
            <li key={p}>{p}</li>
          ))}
          {data.length === 0 && <li className="muted">No matches</li>}
        </ul>
      )}
      <div className="row">
        <button type="button" onClick={() => mutate()} disabled={!query}>
          Revalidate
        </button>
        <button type="button" onClick={() => data && mutate([...data].reverse())} disabled={!data}>
          Reverse locally
        </button>
      </div>
    </section>
  );
}

export default function App() {
  const [text, setText] = useState('');
  const query = useDebouncedValue(text.trim(), 400);
  const previousQuery = usePrevious(query);
  const [showSecond, setShowSecond] = useState(true);

  return (
    <main className="app">
      <h1>Custom hooks playground</h1>
      <label htmlFor="q">Search people</label>
      <input id="q" value={text} onChange={(e) => setText(e.target.value)} placeholder='Try "an", then "error"' />
      <p className="muted">
        Debounced query: <code>{JSON.stringify(query)}</code> · previous committed: <code>{JSON.stringify(previousQuery)}</code>
      </p>
      <label className="muted">
        <input type="checkbox" checked={showSecond} onChange={(e) => setShowSecond(e.target.checked)} /> Mount the second panel (remount
        to see cached data + background revalidation)
      </label>
      <div className="panels">
        <Results title="Panel A" query={query} />
        {showSecond && <Results title="Panel B" query={query} />}
      </div>
    </main>
  );
}
