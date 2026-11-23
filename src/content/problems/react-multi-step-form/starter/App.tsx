import { useState } from 'react';
import SignupWizard from './SignupWizard';
import type { SignupData } from './types';
import './styles.css';

/** Pretend API: ~0.9 s latency; emails starting with "taken@" are rejected so you can try the retry path. */
function createAccount(data: SignupData) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      if (data.email.toLowerCase().startsWith('taken@')) reject(new Error('that email address is already registered'));
      else resolve();
    }, 900);
  });
}

export default function App() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  return (
    <main className="app">
      <h1>Sign up</h1>
      <p className="hint">
        Use an email starting with <code>taken@</code> to see a server error, then fix it from the review step. When sessionStorage is
        available your progress survives a reload — except the password, which is never stored.
      </p>
      <SignupWizard
        onSubmit={async (data) => {
          await createAccount(data);
          const { password, ...safe } = data;
          setSubmitted(JSON.stringify({ ...safe, password: password ? '(hidden)' : '' }, null, 2));
        }}
      />
      {submitted && (
        <details className="hint">
          <summary>Submitted payload</summary>
          <pre>{submitted}</pre>
        </details>
      )}
    </main>
  );
}
