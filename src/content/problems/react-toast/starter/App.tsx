import { useRef } from 'react';
import { ToastProvider, useToast } from './ToastProvider';
import './styles.css';

function Demo() {
  const toast = useToast();
  const count = useRef(0);
  const lastId = useRef<string | null>(null);
  const next = () => ++count.current;
  return (
    <div className="actions">
      <button onClick={() => (lastId.current = toast.show(`Saved draft #${next()}`, { type: 'success' }))}>Success</button>
      <button onClick={() => (lastId.current = toast.show(`Heads up #${next()}`))}>Info</button>
      <button onClick={() => (lastId.current = toast.show(`Storage almost full #${next()}`, { type: 'warning', duration: 8000 }))}>Warning (8 s)</button>
      <button onClick={() => (lastId.current = toast.show(`Upload failed #${next()}`, { type: 'error', duration: Infinity }))}>Error (sticky)</button>
      <button onClick={() => lastId.current && toast.dismiss(lastId.current)}>Dismiss last</button>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider max={3} defaultDuration={4000}>
      <main className="app">
        <h1>Toast notifications</h1>
        <p className="hint">
          Fire several toasts: at most three are visible, the rest queue. Hover or focus a toast to pause its timer; it resumes with the time that was left.
        </p>
        <Demo />
      </main>
    </ToastProvider>
  );
}
