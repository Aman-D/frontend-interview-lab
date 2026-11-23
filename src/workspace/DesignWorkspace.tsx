import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Markdown } from '@/components/Markdown';
import { DocLinks, OutcomeBadge, SourcesPanel } from '@/components/meta';
import { Badge, Button, Card, CardHeader, Dialog, Tabs, Textarea, cn } from '@/components/ui';
import { EXECUTION_LABEL, TRACK_LABEL } from '@/content/labels';
import type { DesignQuestion, Mcq } from '@/content/schema';
import { db } from '@/db/db';
import { repo } from '@/db/repo';
import { useAttempts } from '@/hooks/useData';
import { OUTCOME_LABEL } from '@/lib/progress';
import { ConceptsPanel, FollowUpsPanel } from './LearningPanels';
import { NotesPanel } from './NotesPanel';

type Phase = 'answering' | 'comparing' | 'done';
const ANSWER_FILE = '/answer.md';
const MIN_ANSWER = 60;

/** One graded MCQ: the first submitted choice is what counts for the attempt. */
function QuizMcq({ q, mcq, index, locked, onFirstAnswer }: { q: DesignQuestion; mcq: Mcq; index: number; locked: boolean; onFirstAnswer: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = selected === mcq.correctOptionId;
  return (
    <fieldset className="rounded-lg border border-border bg-panel p-4 text-sm">
      <legend className="px-1 text-[13px] font-medium text-subtle">Question {index + 1}</legend>
      <p className="font-medium">{mcq.question}</p>
      {mcq.code && <pre className="my-2 overflow-x-auto rounded bg-muted p-2 font-mono text-xs">{mcq.code}</pre>}
      <div className="mt-2 space-y-1">
        {mcq.options.map((o) => {
          const isCorrect = o.id === mcq.correctOptionId;
          return (
            <label key={o.id} className={cn('flex cursor-pointer items-start gap-2 rounded p-1.5', checked && isCorrect && 'bg-ok/10', checked && selected === o.id && !isCorrect && 'bg-bad/10')}>
              <input type="radio" name={`${q.id}-${mcq.id}`} className="mt-1" disabled={checked || locked} checked={selected === o.id} onChange={() => setSelected(o.id)} />
              <span>
                {o.text}
                {checked && <span className="mt-0.5 block text-[13px] text-subtle">{isCorrect ? '✓ ' : '✗ '}{o.explanation}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {!checked ? (
        <Button
          size="sm"
          className="mt-2"
          disabled={!selected || locked}
          onClick={async () => {
            setChecked(true);
            onFirstAnswer(selected === mcq.correctOptionId);
            await repo.answerMcq(q.id, mcq.id, selected!, selected === mcq.correctOptionId);
          }}
        >
          Check answer
        </Button>
      ) : (
        <div className="mt-2 space-y-2 border-t border-border pt-2">
          <p className={cn('flex items-center gap-1 font-medium', correct ? 'text-ok' : 'text-bad')} role="status">
            {correct ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <XCircle className="h-4 w-4" aria-hidden />} {correct ? 'Correct' : 'Incorrect'}
          </p>
          <p>{mcq.explanation}</p>
          <DocLinks ids={mcq.sourceIds} title="Source" />
        </div>
      )}
    </fieldset>
  );
}

export default function DesignWorkspace({ question: q }: { question: DesignQuestion }) {
  const attempts = useAttempts(q.id);
  const [startedAt] = useState(() => Date.now());
  const [answer, setAnswer] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [phase, setPhase] = useState<Phase>('answering');
  const [mcqResults, setMcqResults] = useState<Record<string, boolean>>({});
  const [covered, setCovered] = useState<Set<number>>(new Set());
  const [revealedEarly, setRevealedEarly] = useState(false);
  const [confirmReveal, setConfirmReveal] = useState(false);
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [result, setResult] = useState<{ outcome: string } | null>(null);
  const [tab, setTab] = useState<'model' | 'followups' | 'concepts' | 'notes' | 'sources'>('concepts');

  // Draft answer persists across reloads (same drafts table as coding problems).
  useEffect(() => {
    db.drafts.get(q.id).then((d) => {
      setAnswer(d?.files[ANSWER_FILE] ?? '');
      setLoaded(true);
    });
  }, [q.id]);
  const first = useRef(true);
  useEffect(() => {
    if (!loaded) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => repo.saveDraft(q.id, { [ANSWER_FILE]: answer }), 500);
    return () => clearTimeout(t);
  }, [answer, loaded, q.id]);

  const mcqDone = Object.keys(mcqResults).length === q.mcqs.length;
  const mcqCorrect = Object.values(mcqResults).filter(Boolean).length;
  const canCompare = mcqDone && answer.trim().length >= MIN_ANSWER;
  const showReference = phase !== 'answering' || revealedEarly;
  const prev = useMemo(() => (attempts ?? []).filter((a) => a.status === 'submitted').slice().reverse(), [attempts]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-10">
        <header className="mb-5">
          <Link to={`/problems/${q.id}`} className="text-[26px] font-medium leading-tight tracking-tight hover:underline">{q.title}</Link>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge>{TRACK_LABEL[q.track]}</Badge>
            <Badge>{EXECUTION_LABEL[q.execution]}</Badge>
            <Badge>{q.estimatedMinutes} min</Badge>
            {q.topics.slice(0, 4).map((t) => <Badge key={t}>{t}</Badge>)}
          </div>
          <p className="mt-2 text-[13px] text-subtle">{q.versionNotes}</p>
        </header>

        <section aria-labelledby="scenario" className="mb-6 rounded-lg border border-border bg-panel p-5">
          <h2 id="scenario" className="mb-2 text-[15px] font-semibold">The scenario</h2>
          <Markdown>{q.scenario}</Markdown>
          {q.constraints.length > 0 && (
            <>
              <h3 className="mb-1 mt-3 text-sm font-semibold">Constraints</h3>
              <ul className="list-disc pl-5 text-[15px]">{q.constraints.map((c) => <li key={c}><Markdown inline>{c}</Markdown></li>)}</ul>
            </>
          )}
        </section>

        <section aria-labelledby="step-mcq" className="mb-6">
          <h2 id="step-mcq" className="mb-1 text-[15px] font-semibold">1. Check your knowledge <span className="font-normal text-subtle">({Object.keys(mcqResults).length}/{q.mcqs.length} answered)</span></h2>
          <p className="mb-3 text-[13px] text-subtle">Graded. Your first answer to each question is what counts.</p>
          <div className="space-y-3">
            {q.mcqs.map((m, i) => (
              <QuizMcq key={m.id} q={q} mcq={m} index={i} locked={phase === 'done'} onFirstAnswer={(c) => setMcqResults((r) => (m.id in r ? r : { ...r, [m.id]: c }))} />
            ))}
          </div>
        </section>

        <section aria-labelledby="step-answer" className="mb-6">
          <h2 id="step-answer" className="mb-1 text-[15px] font-semibold">2. Your answer</h2>
          <p className="mb-2 text-[13px] text-subtle">Write it as you would say it in the interview. Saved automatically. Not auto-graded — you compare it with the outline next.</p>
          <Textarea
            aria-label="Your answer"
            className="min-h-[220px] text-[15px]"
            value={answer}
            disabled={phase !== 'answering'}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Structure: clarify → approach → trade-offs → failure modes → how you'd measure it"
          />
          {phase === 'answering' && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button variant="primary" disabled={!canCompare} onClick={() => setPhase('comparing')}>Compare with the outline</Button>
              {!revealedEarly && <Button variant="ghost" onClick={() => setConfirmReveal(true)}>Show the model answer now</Button>}
              {!canCompare && (
                <span className="text-[13px] text-subtle">
                  {!mcqDone ? 'Answer every MCQ first. ' : ''}
                  {answer.trim().length < MIN_ANSWER ? `Write at least ${MIN_ANSWER} characters.` : ''}
                </span>
              )}
            </div>
          )}
        </section>

        {phase !== 'answering' && (
          <section aria-labelledby="step-compare" className="mb-6 rounded-lg border border-border bg-panel p-5">
            <h2 id="step-compare" className="mb-1 text-[15px] font-semibold">3. Compare and record</h2>
            <p className="mb-3 text-[13px] text-subtle">Tick each point your answer actually covered. This is your own assessment and is recorded as self-assessed.</p>
            <ul className="space-y-1.5">
              {q.answerOutline.map((pt, i) => (
                <li key={i}>
                  <label className="flex items-start gap-2 text-[15px]">
                    <input
                      type="checkbox"
                      className="mt-1.5"
                      disabled={phase === 'done'}
                      checked={covered.has(i)}
                      onChange={(e) => setCovered((s) => { const n = new Set(s); if (e.target.checked) n.add(i); else n.delete(i); return n; })}
                    />
                    <Markdown inline>{pt}</Markdown>
                  </label>
                </li>
              ))}
            </ul>
            {phase === 'comparing' ? (
              <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4">
                <fieldset>
                  <legend className="mb-1 text-[13px] font-medium text-subtle">Confidence you could answer this in an interview</legend>
                  <div className="flex gap-1">
                    {([1, 2, 3, 4, 5] as const).map((n) => (
                      <label key={n} className={cn('flex cursor-pointer items-center rounded border px-2.5 py-1 text-sm', confidence === n ? 'border-fg bg-fg text-bg' : 'border-border')}>
                        <input type="radio" name="confidence" className="sr-only" checked={confidence === n} onChange={() => setConfidence(n)} />
                        {n}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <Button
                  variant="primary"
                  onClick={async () => {
                    const a = await repo.submitQuizAttempt(q.id, {
                      answer,
                      mcqCorrect,
                      mcqTotal: q.mcqs.length,
                      outlineCovered: covered.size,
                      outlineTotal: q.answerOutline.length,
                      revealedBeforeSubmit: revealedEarly,
                      confidence,
                      startedAt,
                    });
                    setResult({ outcome: a.outcome! });
                    setPhase('done');
                    setTab('model');
                  }}
                >
                  Record attempt
                </Button>
              </div>
            ) : (
              result && (
                <p className="mt-4 border-t border-border pt-4 text-[15px]" role="status">
                  Recorded as <strong>{OUTCOME_LABEL[result.outcome as keyof typeof OUTCOME_LABEL]}</strong>: MCQs {mcqCorrect}/{q.mcqs.length} on the first try, outline {covered.size}/{q.answerOutline.length} covered (self-assessed).
                </p>
              )
            )}
          </section>
        )}

        <Card>
          <div className="border-b border-border px-3 py-2">
            <Tabs
              label="Reference"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'model', label: 'Model answer', hidden: !showReference },
                { id: 'followups', label: 'Follow-ups', hidden: !showReference },
                { id: 'concepts', label: 'Concepts' },
                { id: 'notes', label: 'Notes' },
                { id: 'sources', label: 'Sources' },
              ]}
            />
          </div>
          <div className="space-y-4 p-4 text-sm">
            {tab === 'model' && showReference && (
              <>
                <Markdown>{q.modelAnswer}</Markdown>
                <div>
                  <h3 className="mb-1 font-semibold">Pitfalls</h3>
                  <ul className="list-disc space-y-1 pl-5">{q.pitfalls.map((p) => <li key={p}><Markdown inline>{p}</Markdown></li>)}</ul>
                </div>
                <DocLinks ids={q.docSourceIds} />
              </>
            )}
            {tab === 'followups' && showReference && <FollowUpsPanel problem={q} />}
            {tab === 'concepts' && <ConceptsPanel conceptIds={q.conceptIds} />}
            {tab === 'notes' && <NotesPanel problemId={q.id} title={q.title} />}
            {tab === 'sources' && <SourcesPanel q={q} />}
          </div>
        </Card>

        {prev.length > 0 && (
          <Card className="mt-6">
            <CardHeader title="Previous attempts" />
            <ul className="divide-y divide-border text-sm">
              {prev.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-[13px] text-subtle">{new Date(a.startedAt).toLocaleString()} · {a.mistakes}</span>
                  <OutcomeBadge o={a.outcome} />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Dialog
        open={confirmReveal}
        onClose={() => setConfirmReveal(false)}
        title="Show the model answer now?"
        footer={
          <>
            <Button onClick={() => setConfirmReveal(false)}>Keep working</Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmReveal(false);
                setRevealedEarly(true);
                setTab('model');
              }}
            >
              Show it
            </Button>
          </>
        }
      >
        <p className="text-sm">Seeing the model answer before you submit means this attempt will be recorded as “{OUTCOME_LABEL.assisted}”.</p>
      </Dialog>
    </div>
  );
}
