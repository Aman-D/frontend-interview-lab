import { lazy, Suspense, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '@/components/Layout';
import { OutcomeBadge } from '@/components/meta';
import { Card, CardHeader, EmptyState, Select } from '@/components/ui';
import { QUESTION_BY_ID } from '@/content';
import type { Attempt } from '@/db/types';
import { useAllAttempts } from '@/hooks/useData';
import { formatHuman } from '@/lib/timer';

const CodeDiff = lazy(() => import('@/components/CodeEditor').then((m) => ({ default: m.CodeDiff })));

export default function HistoryPage() {
  const attempts = useAllAttempts();
  const [problem, setProblem] = useState('');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [file, setFile] = useState('');
  const sorted = useMemo(() => (attempts ?? []).slice().sort((x, y) => y.startedAt - x.startedAt), [attempts]);
  if (!attempts) return <Page title="Attempt History"><p className="text-sm text-subtle">Loading…</p></Page>;
  const problemsWithCode = [...new Set(attempts.filter((x) => x.files).map((x) => x.problemId))];
  const forProblem = attempts.filter((x) => x.problemId === problem && x.files).sort((x, y) => x.startedAt - y.startedAt);
  const A = forProblem.find((x) => x.id === a);
  const B = forProblem.find((x) => x.id === b);
  const files = [...new Set([...Object.keys(A?.files ?? {}), ...Object.keys(B?.files ?? {})])].filter((p) => !(QUESTION_BY_ID[problem]?.kind === 'coding' && (QUESTION_BY_ID[problem] as { files: { readonly: string[] } }).files.readonly.includes(p)));
  const f = file && files.includes(file) ? file : files[0];
  const label = (x: Attempt) => `${new Date(x.startedAt).toLocaleString()} · ${x.mode} · ${x.outcome ?? x.status}${x.lastRun ? ` · ${x.lastRun.passed}/${x.lastRun.total}` : ''}`;

  return (
    <Page wide title="Attempt History" description="Every attempt you started, with what actually happened: mode, time, test results, hints and solution views.">
      <Card className="mb-5">
        <CardHeader title="Compare attempts" />
        <div className="space-y-3 p-4 text-sm">
          {problemsWithCode.length === 0 ? (
            <p className="text-subtle">Code snapshots are saved when you submit or abandon an attempt. Submit at least one to compare.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Select aria-label="Problem" value={problem} onChange={(e) => { setProblem(e.target.value); setA(''); setB(''); }}>
                  <option value="">Choose a problem…</option>
                  {problemsWithCode.map((p) => <option key={p} value={p}>{QUESTION_BY_ID[p]?.title ?? p}</option>)}
                </Select>
                {problem && (
                  <>
                    <Select aria-label="Older attempt" value={a} onChange={(e) => setA(e.target.value)}>
                      <option value="">Attempt A…</option>
                      {forProblem.map((x) => <option key={x.id} value={x.id}>{label(x)}</option>)}
                    </Select>
                    <Select aria-label="Newer attempt" value={b} onChange={(e) => setB(e.target.value)}>
                      <option value="">Attempt B…</option>
                      {forProblem.map((x) => <option key={x.id} value={x.id}>{label(x)}</option>)}
                    </Select>
                    {files.length > 1 && (
                      <Select aria-label="File" value={f} onChange={(e) => setFile(e.target.value)}>
                        {files.map((p) => <option key={p}>{p}</option>)}
                      </Select>
                    )}
                  </>
                )}
              </div>
              {A && B && f && (
                <Suspense fallback={<p className="text-subtle">Loading diff…</p>}>
                  <div className="overflow-hidden rounded-md border border-border">
                    <CodeDiff original={A.files?.[f] ?? ''} modified={B.files?.[f] ?? ''} path={f} />
                  </div>
                </Suspense>
              )}
            </>
          )}
        </div>
      </Card>

      {sorted.length === 0 ? (
        <EmptyState title="No attempts yet" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-panel">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-subtle">
              <tr>
                <th className="px-3 py-2 font-medium">Question</th>
                <th className="px-3 py-2 font-medium">Started</th>
                <th className="px-3 py-2 font-medium">Mode</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Active time</th>
                <th className="px-3 py-2 font-medium">Tests</th>
                <th className="px-3 py-2 font-medium">Help</th>
                <th className="px-3 py-2 font-medium">Confidence</th>
                <th className="px-3 py-2 font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((x) => (
                <tr key={x.id}>
                  <td className="px-3 py-2"><Link to={`/problems/${x.problemId}`} className="hover:underline">{QUESTION_BY_ID[x.problemId]?.title ?? x.problemId}</Link></td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs">{new Date(x.startedAt).toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs">{x.mode}</td>
                  <td className="px-3 py-2 text-xs">{x.status}</td>
                  <td className="px-3 py-2 text-xs tabular-nums">{formatHuman(x.activeMs)}</td>
                  <td className="px-3 py-2 text-xs tabular-nums">{x.lastRun ? `${x.lastRun.passed}/${x.lastRun.total} (${x.runCount} runs)` : x.answer !== undefined ? (x.correct ? 'correct' : 'wrong') : '—'}</td>
                  <td className="px-3 py-2 text-xs">{[x.hintsRevealed ? `${x.hintsRevealed} hint(s)` : '', x.solutionRevealed ? 'solution' : ''].filter(Boolean).join(', ') || 'none'}</td>
                  <td className="px-3 py-2 text-xs">{x.confidence ?? '—'}</td>
                  <td className="px-3 py-2"><OutcomeBadge o={x.outcome} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
