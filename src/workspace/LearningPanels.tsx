import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Markdown } from '@/components/Markdown';
import { DocLinks } from '@/components/meta';
import { Badge, Button, Textarea, cn } from '@/components/ui';
import { CONCEPT_BY_ID } from '@/content/concepts';
import type { FollowUp, Mcq } from '@/content/schema';

type WithMcqs = { id: string; mcqs: Mcq[] };
type WithFollowUps = { id: string; followUps: FollowUp[] };
import { db } from '@/db/db';
import { repo } from '@/db/repo';

export function ConceptsPanel({ conceptIds }: { conceptIds: string[] }) {
  return (
    <ul className="grid gap-2 md:grid-cols-2">
      {conceptIds.map((id) => {
        const c = CONCEPT_BY_ID[id];
        return (
          <li key={id} className="card-link relative rounded-lg border border-border bg-panel p-3.5 text-sm">
            <Link to={`/concepts/${id}`} className="font-medium after:absolute after:inset-0 after:content-['']">{c?.title ?? id}</Link>
            {c && <p className="mt-1 text-subtle">{c.summary}</p>}
          </li>
        );
      })}
    </ul>
  );
}

function McqItem({ problemId, mcq }: { problemId: string; mcq: Mcq }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const history = useLiveQuery(() => db.mcqAnswers.where('problemId').equals(problemId).filter((a) => a.mcqId === mcq.id).toArray(), [problemId, mcq.id]);
  const correct = selected === mcq.correctOptionId;
  return (
    <fieldset className="rounded-md border border-border p-3 text-sm">
      <legend className="px-1 font-medium">{mcq.question}</legend>
      {mcq.code && <pre className="my-2 overflow-x-auto rounded bg-muted p-2 font-mono text-xs">{mcq.code}</pre>}
      <div className="mt-1 space-y-1.5">
        {mcq.options.map((o) => {
          const isCorrect = o.id === mcq.correctOptionId;
          return (
            <label key={o.id} className={cn('flex cursor-pointer items-start gap-2 rounded p-1.5', submitted && isCorrect && 'bg-ok/10', submitted && selected === o.id && !isCorrect && 'bg-bad/10')}>
              <input type="radio" name={`${problemId}-${mcq.id}`} className="mt-1" disabled={submitted} checked={selected === o.id} onChange={() => setSelected(o.id)} />
              <span>
                {o.text}
                {submitted && <span className="block text-xs text-subtle">{isCorrect ? '✓ ' : '✗ '}{o.explanation}</span>}
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-2">
        {!submitted ? (
          <Button
            size="sm"
            variant="primary"
            disabled={!selected}
            onClick={async () => {
              setSubmitted(true);
              await repo.answerMcq(problemId, mcq.id, selected!, selected === mcq.correctOptionId);
            }}
          >
            Check answer
          </Button>
        ) : (
          <>
            <span className={cn('inline-flex items-center gap-1 font-medium', correct ? 'text-ok' : 'text-bad')} role="status">
              {correct ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <XCircle className="h-4 w-4" aria-hidden />} {correct ? 'Correct' : 'Incorrect'}
            </span>
            <Button size="sm" variant="ghost" onClick={() => { setSubmitted(false); setSelected(null); }}>Try again</Button>
          </>
        )}
        {!!history?.length && <span className="text-xs text-subtle">History: {history.filter((h) => h.correct).length}/{history.length} correct</span>}
      </div>
      {submitted && (
        <div className="mt-2 space-y-2 border-t border-border pt-2">
          <p>{mcq.explanation}</p>
          <DocLinks ids={mcq.sourceIds} title="Source" />
        </div>
      )}
    </fieldset>
  );
}

export function McqPanel({ problem }: { problem: WithMcqs }) {
  if (!problem.mcqs.length) return <p className="text-sm text-subtle">No MCQs for this problem.</p>;
  return (
    <div className="space-y-3">
      {problem.mcqs.map((m) => <McqItem key={m.id} problemId={problem.id} mcq={m} />)}
    </div>
  );
}

const LEVEL_LABEL: Record<FollowUp['level'], string> = {
  definition: '1 · Definition',
  mechanism: '2 · Mechanism',
  application: '3 · Application',
  'edge-cases': '4 · Edge cases',
  production: '5 · Production',
  architecture: '6 · Architecture & trade-offs',
};

function FollowUpItem({ problemId, f }: { problemId: string; f: FollowUp }) {
  const saved = useLiveQuery(() => db.followUps.get(`${problemId}:${f.id}`), [problemId, f.id]);
  const [answer, setAnswer] = useState('');
  useEffect(() => {
    if (saved) setAnswer(saved.answer);
  }, [saved?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (saved && answer === saved.answer) return;
    if (!saved && !answer) return;
    const t = setTimeout(() => repo.saveFollowUp(problemId, f.id, { answer }), 500);
    return () => clearTimeout(t);
  }, [answer]); // eslint-disable-line react-hooks/exhaustive-deps
  const revealed = saved?.revealed ?? false;
  return (
    <li className="rounded-md border border-border p-3 text-sm">
      <div className="mb-1 flex items-center gap-2">
        <Badge>{LEVEL_LABEL[f.level]}</Badge>
      </div>
      <p className="font-medium">{f.question}</p>
      <Textarea aria-label={`Your answer: ${f.question}`} className="mt-2 min-h-[80px]" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Write your answer as you would say it in the interview…" />
      {!revealed ? (
        <Button size="sm" className="mt-2" disabled={!answer.trim()} onClick={() => repo.saveFollowUp(problemId, f.id, { answer, revealed: true })}>
          Submit & show expected concepts
        </Button>
      ) : (
        <div className="mt-2 space-y-2 border-t border-border pt-2">
          <p className="text-xs font-medium text-subtle">A strong answer usually covers:</p>
          <ul className="list-disc pl-5">{f.expectedConcepts.map((c) => <li key={c}>{c}</li>)}</ul>
          <DocLinks ids={f.sourceIds} title="Read more" />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-subtle">Self-assessment (not graded automatically):</span>
            {(['missed', 'partial', 'solid'] as const).map((r) => (
              <Button key={r} size="sm" variant={saved?.selfRating === r ? 'primary' : 'secondary'} aria-pressed={saved?.selfRating === r} onClick={() => repo.saveFollowUp(problemId, f.id, { selfRating: r })}>
                {r}
              </Button>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

export function FollowUpsPanel({ problem }: { problem: WithFollowUps }) {
  return (
    <ul className="space-y-3">
      {problem.followUps.map((f) => <FollowUpItem key={f.id} problemId={problem.id} f={f} />)}
    </ul>
  );
}

export function HintsPanel({ hints, revealed, onReveal, locked }: { hints: string[]; revealed: number; onReveal: (i: number) => void; locked?: string }) {
  if (locked) return <p className="text-sm text-subtle">{locked}</p>;
  return (
    <div className="space-y-2">
      <p className="text-xs text-subtle">Hints are progressive. Revealing any hint marks this attempt as <strong>assisted</strong> (it will not count as independently solved).</p>
      <ol className="space-y-2">
        {hints.map((h, i) => (
          <li key={i} className="rounded-md border border-border p-3 text-sm">
            {i < revealed ? (
              <Markdown>{`**Hint ${i + 1}.** ${h}`}</Markdown>
            ) : i === revealed ? (
              <Button size="sm" onClick={() => onReveal(i)}>Reveal hint {i + 1}</Button>
            ) : (
              <span className="text-subtle">Hint {i + 1} (reveal the previous hint first)</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
