import { useMemo, useRef, useState } from 'react';
import VirtualList from './VirtualList';
import type { ScrollAlign, VirtualListHandle } from './types';
import './styles.css';

interface Row {
  id: string;
  name: string;
  amount: number;
}

export default function App() {
  const [count, setCount] = useState(10000);
  const [target, setTarget] = useState('5000');
  const [align, setAlign] = useState<ScrollAlign>('center');
  const listRef = useRef<VirtualListHandle>(null);
  const rows = useMemo<Row[]>(
    () => Array.from({ length: count }, (_, i) => ({ id: `row-${i}`, name: `Row ${i + 1}`, amount: ((i * 7919) % 10000) / 100 })),
    [count],
  );
  const jump = () => listRef.current?.scrollToIndex(Number(target) - 1, align);

  return (
    <main className="app">
      <h1>Virtualized list</h1>
      <p className="hint">
        {count.toLocaleString()} rows, 40 px each — only the visible window (+3 overscan rows each side) is in the DOM.
        Click the list, then use ↑ ↓ Home End.
      </p>
      {/* No <form>: the preview runs in a sandboxed iframe where form submission is blocked. */}
      <div className="controls">
        <label>
          Row{' '}
          <input
            type="number"
            min={1}
            max={count}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && jump()}
          />
        </label>
        <select aria-label="Alignment" value={align} onChange={(e) => setAlign(e.target.value as ScrollAlign)}>
          <option value="start">start</option>
          <option value="center">center</option>
          <option value="end">end</option>
          <option value="auto">auto</option>
        </select>
        <button type="button" onClick={jump}>Scroll to row</button>
        <button type="button" onClick={() => setCount((c) => (c === 10000 ? 25 : 10000))}>
          {count === 10000 ? 'Shrink to 25 rows' : 'Back to 10,000 rows'}
        </button>
      </div>
      <VirtualList
        ref={listRef}
        label="Transactions"
        items={rows}
        itemHeight={40}
        height={400}
        overscan={3}
        getKey={(row) => row.id}
        renderItem={(row) => (
          <span className="row">
            <span>{row.name}</span>
            <span className="row__amount">${row.amount.toFixed(2)}</span>
          </span>
        )}
      />
    </main>
  );
}
