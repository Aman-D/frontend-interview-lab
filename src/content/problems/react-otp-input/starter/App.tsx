import { useEffect, useRef, useState } from 'react';
import OtpInput from './OtpInput';
import './styles.css';

const CORRECT = '123456';

export default function App() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'ok' | 'error'>('idle');
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const verify = (full: string) => {
    setStatus('verifying');
    window.clearTimeout(timer.current);
    // Pretend to call the server.
    timer.current = window.setTimeout(() => setStatus(full === CORRECT ? 'ok' : 'error'), 600);
  };

  return (
    <main className="app">
      <h1>Check your phone</h1>
      <p className="hint">
        We sent a 6-digit code to •••• 4821. Try typing, pasting <code>123456</code> or <code>98-76-54</code>, Backspace and the arrow keys. The correct code is {CORRECT}.
      </p>
      <OtpInput
        value={code}
        onChange={(v) => {
          setCode(v);
          if (status === 'error') setStatus('idle');
        }}
        onComplete={verify}
        disabled={status === 'verifying' || status === 'ok'}
        error={status === 'error' ? 'That code is not right. Check the SMS and try again.' : undefined}
        autoFocus
      />
      <p role="status" className="status">
        {status === 'verifying' ? 'Verifying…' : status === 'ok' ? 'Verified — welcome back!' : ''}
      </p>
      <p className="debug">
        value: <code>{JSON.stringify(code)}</code>
      </p>
      <button type="button" onClick={() => { setCode(''); setStatus('idle'); }}>
        Start over
      </button>
    </main>
  );
}
