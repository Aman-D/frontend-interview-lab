import { CheckCircle2, XCircle } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompanyContext } from '@/components/CompanySetNav';
import { Markdown } from '@/components/Markdown';
import { DocLinks, OutcomeBadge, SourcesPanel } from '@/components/meta';
import { Badge, Button, Card, CardHeader, Dialog, Tabs, Textarea, cn } from '@/components/ui';
import type { OutputQuestion } from '@/content/schema';
import { repo } from '@/db/repo';
import { useAttempts } from '@/hooks/useData';
import { isOutputAnswerCorrect } from '@/lib/progress';
import { ConceptsPanel } from './LearningPanels';
import { NotesPanel } from './NotesPanel';

const CodeEditor = lazy(() => import('@/components/CodeEditor'));

export default function OutputWorkspace({ question: q }: { question: OutputQuestion }) {
  const { withSet } = useCompanyContext(q.id);
  const attempts = useAttempts(q.id);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<{ correct: boolean; assisted: boolean } | null>(null);
  const [confirmReveal, setConfirmReveal] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [tab, setTab] = useState<'explain' | 'concepts' | 'notes' | 'sources'>('explain');

  const submit = async (reveal: boolean) => {
    const correct = !reveal && isOutputAnswerCorrect(answer, q.expectedOutput);
    await repo.submitOutputAttempt(q.id, 'study', reveal ? answer || '(revealed without answering)' : answer, correct, reveal, startedAt);
    setResult({ correct, assisted: reveal });
  };

  const prev = (attempts ?? []).filter((a) => a.status === 'submitted');

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto grid max-w-6xl gap-4 px-6 py-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Link to={withSet(`/problems/${q.id}`)} className="text-xl font-semibold hover:underline">{q.title}</Link>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge>Output prediction</Badge>
              <Badge>{q.environment === 'node' ? 'Node.js' : q.environment === 'jsdom' ? 'DOM (jsdom)' : q.environment === 'react-ssr' ? 'React 18 server rendering' : 'React 18'}</Badge>
              {q.topics.map((t) => <Badge key={t}>{t}</Badge>)}
            </div>
          </div>
          <Markdown className="text-sm">{q.prompt}</Markdown>
          <Card className="h-[360px] overflow-hidden">
            <Suspense fallback={<pre className="p-3 font-mono text-xs">{q.code}</pre>}>
              <CodeEditor modelPath={`file:///output/${q.id}.js`} path={`${q.id}.js`} value={q.code} readOnly />
            </Suspense>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Your prediction" />
            <div className="space-y-3 p-4">
              <label className="block text-sm">
                <span className="mb-1 block text-subtle">One console line per line, in order.</span>
                <Textarea
                  aria-label="Predicted output"
                  className="min-h-[140px] font-mono"
                  value={answer}
                  disabled={!!result}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={'first line\nsecond line'}
                />
              </label>
              {!result ? (
                <div className="flex gap-2">
                  <Button variant="primary" disabled={!answer.trim()} onClick={() => submit(false)}>Check answer</Button>
                  <Button variant="ghost" onClick={() => setConfirmReveal(true)}>Reveal without answering</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p role="status" className={cn('flex items-center gap-1.5 font-medium', result.correct ? 'text-ok' : 'text-bad')}>
                    {result.correct ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <XCircle className="h-4 w-4" aria-hidden />}
                    {result.assisted ? 'Revealed (recorded as assisted)' : result.correct ? 'Correct' : 'Not quite'}
                  </p>
                  <div>
                    <p className="mb-1 text-xs text-subtle">Verified output (produced by executing the snippet in the test-suite):</p>
                    <pre className="rounded-md border border-border bg-muted p-2.5 font-mono text-sm">{q.expectedOutput.join('\n')}</pre>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setResult(null);
                      setAnswer('');
                      setStartedAt(Date.now());
                      setShowFollowUp(false);
                    }}
                  >
                    Try again
                  </Button>
                </div>
              )}
              <p className="text-[11px] text-subtle">Comparison ignores surrounding whitespace, blank lines and quotes around a whole line; everything else must match exactly.</p>
            </div>
          </Card>

          {result && (
            <Card>
              <div className="border-b border-border px-3 py-2">
                <Tabs label="Explanation" value={tab} onChange={setTab} tabs={[{ id: 'explain', label: 'Step by step' }, { id: 'concepts', label: 'Concepts' }, { id: 'notes', label: 'Notes' }, { id: 'sources', label: 'Sources' }]} />
              </div>
              <div className="space-y-4 p-4 text-sm">
                {tab === 'explain' && (
                  <>
                    <ol className="list-decimal space-y-1.5 pl-5">{q.steps.map((s, i) => <li key={i}><Markdown>{s}</Markdown></li>)}</ol>
                    <div>
                      <h3 className="mb-1 font-semibold">Common misconceptions</h3>
                      <ul className="list-disc space-y-1 pl-5">{q.misconceptions.map((m, i) => <li key={i}><Markdown>{m}</Markdown></li>)}</ul>
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold">Related follow-up</h3>
                      <Markdown>{q.followUp.question}</Markdown>
                      {showFollowUp ? <div className="mt-1 rounded-md bg-muted p-2.5"><Markdown>{q.followUp.answer}</Markdown></div> : <Button size="sm" className="mt-1" onClick={() => setShowFollowUp(true)}>Show answer</Button>}
                    </div>
                    <DocLinks ids={q.docSourceIds} />
                  </>
                )}
                {tab === 'concepts' && <ConceptsPanel conceptIds={q.conceptIds} />}
                {tab === 'notes' && <NotesPanel problemId={q.id} title={q.title} />}
                {tab === 'sources' && <SourcesPanel q={q} />}
              </div>
            </Card>
          )}

          {prev.length > 0 && (
            <Card>
              <CardHeader title="Previous answers" />
              <ul className="divide-y divide-border text-sm">
                {prev.slice().reverse().slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center justify-between px-4 py-2">
                    <span className="text-xs text-subtle">{new Date(a.startedAt).toLocaleString()}</span>
                    <OutcomeBadge o={a.outcome} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
      <Dialog
        open={confirmReveal}
        onClose={() => setConfirmReveal(false)}
        title="Reveal the answer?"
        footer={
          <>
            <Button onClick={() => setConfirmReveal(false)}>Keep thinking</Button>
            <Button variant="danger" onClick={() => { setConfirmReveal(false); submit(true); }}>Reveal</Button>
          </>
        }
      >
        <p className="text-sm">Revealing without answering is recorded as an assisted attempt and adds the question to your revision queue.</p>
      </Dialog>
    </div>
  );
}
