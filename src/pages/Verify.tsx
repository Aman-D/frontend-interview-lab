import { useEffect, useRef, useState } from 'react';
import { Page } from '@/components/Layout';
import { verifyAll, type VerificationEntry } from '@/verify/verify';

/** Internal page driven by scripts/verify-solutions.mjs (Playwright). Runs every reference solution through the real runner. */
export default function VerifyPage() {
  const host = useRef<HTMLDivElement>(null);
  const [log, setLog] = useState<string[]>([]);
  const [results, setResults] = useState<VerificationEntry[] | null>(null);
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !host.current) return;
    started.current = true;
    verifyAll(host.current, (m) => setLog((l) => [...l, m])).then((r) => {
      setResults(r);
      (window as unknown as { __VERIFY__: VerificationEntry[] }).__VERIFY__ = r;
    });
  }, []);
  return (
    <Page title="Solution verification" description="Runs every reference solution and starter through the in-app runner.">
      <div ref={host} />
      <ul className="font-mono text-xs">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
      {results && (
        <table className="mt-4 text-sm">
          <tbody>
            {results.map((r) => (
              <tr key={r.problemId} className={r.ok ? 'text-ok' : 'text-bad'}>
                <td className="pr-4">{r.problemId}</td>
                <td className="pr-4">solution {r.solution.passed}/{r.solution.total}</td>
                <td>starter {r.starter.passed}/{r.starter.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Page>
  );
}
