import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';
import { Page } from '@/components/Layout';
import { Markdown } from '@/components/Markdown';
import { DocLinks, StatusBadge } from '@/components/meta';
import { Badge, Button, Card, CardHeader } from '@/components/ui';
import { CONCEPT_BY_ID } from '@/content/concepts';
import { QUESTIONS } from '@/content';
import { db } from '@/db/db';
import { repo } from '@/db/repo';
import { useAllAttempts, useConceptStates, useQuestionRows } from '@/hooks/useData';
import { conceptEvidence } from '@/lib/progress';
import { CONCEPT_STATUS_LABEL } from './Concepts';
import NotFound from './NotFound';

export default function ConceptDetail() {
  const { id = '' } = useParams();
  const c = CONCEPT_BY_ID[id];
  const states = useConceptStates();
  const attempts = useAllAttempts();
  const { statusOf } = useQuestionRows();
  const mcq = useLiveQuery(() => db.mcqAnswers.filter((a) => a.correct).toArray(), []);
  const fus = useLiveQuery(() => db.followUps.filter((f) => f.selfRating === 'solid').toArray(), []);
  if (!c) return <NotFound />;
  const status = states?.find((s) => s.conceptId === id)?.status ?? 'untested';
  const linked = QUESTIONS.filter((q) => q.conceptIds.includes(id));
  const evidence = conceptEvidence(id, QUESTIONS, attempts ?? [], new Set((mcq ?? []).map((m) => m.problemId)), new Set((fus ?? []).map((f) => f.problemId)));

  const sections: [string, string][] = [
    ['Definition', c.definition],
    ['Why it exists', c.whyItExists],
    ['Internal mechanism', c.mechanism],
    ['Practical example', c.example],
    ['Code walkthrough', c.codeWalkthrough],
  ];

  return (
    <Page title={c.title} description={<span className="flex items-center gap-2"><Badge>{c.area}</Badge> {c.summary}</span>}>
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <article className="space-y-5 rounded-lg border border-border bg-panel p-5 text-sm">
          {sections.map(([h, body]) => (
            <section key={h}>
              <h2 className="mb-1 text-base font-semibold">{h}</h2>
              <Markdown>{body}</Markdown>
            </section>
          ))}
          <section>
            <h2 className="mb-1 text-base font-semibold">Common misconceptions</h2>
            <ul className="list-disc space-y-1 pl-5">{c.misconceptions.map((m, i) => <li key={i}><Markdown>{m}</Markdown></li>)}</ul>
          </section>
          <section>
            <h2 className="mb-1 text-base font-semibold">Failure cases</h2>
            <ul className="list-disc space-y-1 pl-5">{c.failureCases.map((m, i) => <li key={i}><Markdown>{m}</Markdown></li>)}</ul>
          </section>
          <section>
            <h2 className="mb-1 text-base font-semibold">Production implications</h2>
            <Markdown>{c.productionImplications}</Markdown>
          </section>
          <section>
            <h2 className="mb-1 text-base font-semibold">Related interview questions</h2>
            <ul className="list-disc space-y-1 pl-5">{c.interviewQuestions.map((m, i) => <li key={i}>{m}</li>)}</ul>
          </section>
          <DocLinks ids={c.docSourceIds} title="Documentation" />
        </article>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Your status" />
            <div className="space-y-2 p-4 text-sm">
              <p>Current: <strong>{CONCEPT_STATUS_LABEL[status]}</strong></p>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" disabled={!evidence.length || status === 'understood'} onClick={() => repo.setConceptStatus(id, 'understood')}>Understood</Button>
                <Button size="sm" disabled={status === 'needs-revision'} onClick={() => repo.setConceptStatus(id, 'needs-revision')}>Needs revision</Button>
                <Button size="sm" variant="ghost" disabled={status === 'untested'} onClick={() => repo.setConceptStatus(id, 'untested')}>Reset</Button>
              </div>
              {evidence.length ? (
                <p className="text-xs text-subtle">Evidence: {evidence.join('; ')}.</p>
              ) : (
                <p className="text-xs text-subtle">“Understood” unlocks after you solve a linked question independently, answer one of its MCQs correctly, or rate a follow-up “solid”. Reading this page is not enough.</p>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader title="Practise this concept" />
            <ul className="divide-y divide-border text-sm">
              {linked.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-2 px-4 py-2">
                  <Link to={`/problems/${q.id}`} className="hover:underline">{q.title}</Link>
                  <StatusBadge s={statusOf(q.id)} />
                </li>
              ))}
              {!linked.length && <li className="px-4 py-2 text-xs text-subtle">No linked questions yet.</li>}
            </ul>
          </Card>
          {c.related.length > 0 && (
            <Card>
              <CardHeader title="Related concepts" />
              <ul className="flex flex-wrap gap-1.5 p-4">
                {c.related.map((r) => (
                  <li key={r}><Link to={`/concepts/${r}`} className="rounded bg-muted px-2 py-0.5 text-xs hover:underline">{CONCEPT_BY_ID[r]?.title ?? r}</Link></li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
}
