import { Link } from 'react-router-dom';
import { Page } from '@/components/Layout';
import { OutcomeBadge } from '@/components/meta';
import { Button, Card, CardHeader, EmptyState } from '@/components/ui';
import { CONCEPT_BY_ID } from '@/content/concepts';
import { QUESTION_BY_ID, QUESTIONS } from '@/content';
import { repo } from '@/db/repo';
import { useAllAttempts, useAllProgress, useConceptStates } from '@/hooks/useData';
import { bestOutcome, groupBy, weaknessPractice } from '@/lib/progress';

export default function RevisionPage() {
  const progress = useAllProgress();
  const attempts = useAllAttempts();
  const conceptStates = useConceptStates();
  if (!progress || !attempts || !conceptStates) return <Page title="Revision Queue"><p className="text-sm text-subtle">Loading…</p></Page>;
  const now = Date.now();
  const byProblem = groupBy(attempts, (a) => a.problemId);
  const queue = progress.filter((p) => p.needsRevision && QUESTION_BY_ID[p.problemId]).sort((a, b) => (a.nextRevisionAt ?? 0) - (b.nextRevisionAt ?? 0));
  const weakness = weaknessPractice(QUESTIONS, conceptStates, attempts);

  return (
    <Page title="Revision Queue" description="Questions you flagged or that were submitted with help, failing tests or low confidence. Re-attempt them in Revision Mode with your previous mistakes visible.">
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader title={`Queue (${queue.length})`} />
          {queue.length ? (
            <ul className="divide-y divide-border">
              {queue.map((p) => {
                const q = QUESTION_BY_ID[p.problemId];
                const as = (byProblem.get(p.problemId) ?? []).filter((a) => a.status === 'submitted');
                const last = as[as.length - 1];
                const due = (p.nextRevisionAt ?? 0) <= now;
                return (
                  <li key={p.problemId} className="space-y-1.5 px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link to={`/problems/${q.id}`} className="font-medium hover:underline">{q.title}</Link>
                      <span className={due ? 'text-xs font-medium text-warn' : 'text-xs text-subtle'}>{due ? 'Due' : 'Due'} {p.nextRevisionAt ? new Date(p.nextRevisionAt).toLocaleDateString() : ''}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-subtle">
                      Best: <OutcomeBadge o={bestOutcome(as)} /> · Last: <OutcomeBadge o={last?.outcome} /> · {as.length} submitted attempt(s)
                    </div>
                    {last?.mistakes && <p className="text-xs"><span className="font-medium">Last mistakes:</span> {last.mistakes}</p>}
                    <div className="flex gap-2">
                      <Link to={q.kind === 'coding' ? `/practice/${q.id}?mode=revision` : `/practice/${q.id}`}><Button size="sm" variant="primary">Re-attempt</Button></Link>
                      <Button size="sm" variant="ghost" onClick={() => repo.setNeedsRevision(q.id, false)}>Remove from queue</Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-4"><EmptyState title="Nothing to revise">Questions land here automatically after assisted or failing submissions, or when you flag them.</EmptyState></div>
          )}
        </Card>
        <Card>
          <CardHeader title="Weakness → Practice" />
          {weakness.length ? (
            <ul className="divide-y divide-border text-sm">
              {weakness.map((w) => (
                <li key={w.conceptId} className="px-4 py-2.5">
                  <Link to={`/concepts/${w.conceptId}`} className="font-medium text-warn hover:underline">{CONCEPT_BY_ID[w.conceptId]?.title ?? w.conceptId}</Link>
                  <ul className="mt-1 space-y-0.5">
                    {w.questions.map((q) => <li key={q.id}><Link to={`/problems/${q.id}`} className="text-xs hover:underline">→ {q.title}</Link></li>)}
                    {!w.questions.length && <li className="text-xs text-subtle">No linked questions yet.</li>}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-subtle">Mark a concept as “Needs revision” on its page to get targeted practice here.</p>
          )}
        </Card>
      </div>
    </Page>
  );
}
