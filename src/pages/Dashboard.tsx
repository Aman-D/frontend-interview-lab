import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Page } from '@/components/Layout';
import { OutcomeBadge, StatusBadge } from '@/components/meta';
import { Button, Card, CardHeader, EmptyState, ProgressBar, Stat } from '@/components/ui';
import { QUESTION_BY_ID, QUESTIONS } from '@/content';
import { CONCEPT_BY_ID } from '@/content/concepts';
import { CATALOG_CANDIDATES, TRACK_LABEL } from '@/content/labels';
import type { TrackId } from '@/content/schema';
import { db } from '@/db/db';
import { useAllAttempts, useAllProgress, useConceptStates, useQuestionRows } from '@/hooks/useData';
import { computeStats, recommendNext } from '@/lib/progress';
import { formatHuman } from '@/lib/timer';

export default function Dashboard() {
  const attempts = useAllAttempts();
  const progress = useAllProgress();
  const conceptStates = useConceptStates();
  const { statusOf } = useQuestionRows();
  const notesDue = useLiveQuery(() => db.notes.where('reminderAt').belowOrEqual(Date.now() + 7 * 86_400_000).toArray(), []);

  if (!attempts || !progress || !conceptStates) return <Page title="Dashboard"><p className="text-subtle">Loading your activity…</p></Page>;

  const now = Date.now();
  const stats = computeStats(QUESTIONS, attempts, progress);
  const researched = Object.values(CATALOG_CANDIDATES).reduce((a, b) => a + b, 0);
  const recent = [...attempts].sort((a, b) => (b.endedAt ?? b.startedAt) - (a.endedAt ?? a.startedAt)).slice(0, 6);
  const upcoming = progress.filter((p) => p.needsRevision && p.nextRevisionAt).sort((a, b) => a.nextRevisionAt! - b.nextRevisionAt!).slice(0, 6);
  const weak = conceptStates.filter((c) => c.status === 'needs-revision');
  const recs = recommendNext(QUESTIONS, attempts, progress, conceptStates, now);

  return (
    <Page title="Dashboard" description="Every number here comes from your own recorded activity in this browser. Nothing is estimated or pre-filled.">
      {/* The one question this screen answers: what should I practise next? */}
      {recs[0] ? (
        <section aria-labelledby="next-up" className="mb-5 overflow-hidden rounded-lg border border-border bg-panel">
          <div className="grid gap-0 md:grid-cols-[1fr_auto]">
            <div className="p-5 md:p-6">
              <p className="text-[13px] font-medium text-subtle">Next up · {recs[0].reason}</p>
              <h2 id="next-up" className="mt-1.5 text-2xl font-medium tracking-tight">{recs[0].question.title}</h2>
              <p className="mt-1.5 max-w-xl text-[15px] text-subtle">
                {TRACK_LABEL[recs[0].question.track]} · {recs[0].question.difficulty} · about {recs[0].question.estimatedMinutes} min
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={recs[0].question.kind === 'coding' ? `/practice/${recs[0].question.id}?mode=${statusOf(recs[0].question.id) === 'needs-revision' ? 'revision' : 'study'}` : `/practice/${recs[0].question.id}`}>
                  <Button variant="primary">{statusOf(recs[0].question.id) === 'in-progress' ? 'Resume practice' : 'Start practising'}</Button>
                </Link>
                <Link to={`/problems/${recs[0].question.id}`}>
                  <Button>Read the brief</Button>
                </Link>
              </div>
            </div>
            {recs.length > 1 && (
              <div className="border-t border-border md:w-80 md:border-l md:border-t-0">
                <p className="px-4 pb-1 pt-4 text-[13px] font-medium text-subtle">Then</p>
                <ul className="pb-2">
                  {recs.slice(1).map((r) => (
                    <li key={r.question.id}>
                      <Link to={`/problems/${r.question.id}`} className="flex items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-muted/60">
                        <span className="min-w-0 truncate">{r.question.title}</span>
                        <span className="shrink-0"><StatusBadge s={statusOf(r.question.id)} /></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      ) : null}

      <section aria-label="Your numbers" className="grid grid-cols-2 divide-border rounded-lg border border-border bg-panel sm:grid-cols-4 [&>*]:border-border max-sm:[&>*:nth-child(odd)]:border-r max-sm:[&>*:nth-child(-n+6)]:border-b sm:[&>*:not(:nth-child(4n))]:border-r sm:[&>*:nth-child(-n+4)]:border-b">
        <Stat label="Completed" value={stats.completed} hint={`of ${stats.available} available`} />
        <Stat label="Solved alone" value={stats.independent} hint={`${stats.independentTested} with every test passing`} />
        <Stat label="With help" value={stats.assisted} hint="a hint or the solution viewed" />
        <Stat label="Interview-ready" value={stats.interviewReady} hint="marked by you" />
        <Stat label="Needs revision" value={stats.needsRevision} />
        <Stat label="Time practising" value={formatHuman(stats.practiceMs)} hint="workspace open and visible" />
        <Stat label="Questions to practise" value={stats.available} hint="with verified content" />
        <Stat label="Researched" value={researched} hint="candidates in the catalog" />
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent attempts" action={<Link to="/history" className="link text-[13px]">History →</Link>} />
          {recent.length ? (
            <ul className="divide-y divide-border">
              {recent.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <Link to={`/problems/${a.problemId}`} className="font-medium hover:underline">{QUESTION_BY_ID[a.problemId]?.title ?? a.problemId}</Link>
                    <div className="mt-0.5 text-[13px] text-subtle">
                      {new Date(a.startedAt).toLocaleString()} · {a.mode} mode · {a.status}
                      {a.lastRun ? ` · tests ${a.lastRun.passed}/${a.lastRun.total}` : ''}
                    </div>
                  </div>
                  <OutcomeBadge o={a.outcome} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4"><EmptyState title="No attempts yet">Open a problem from the library to start your first attempt.</EmptyState></div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
          <CardHeader title="Track progress" />
          <ul className="space-y-3 p-4">
            {(Object.keys(TRACK_LABEL) as TrackId[]).map((t) => {
              const s = stats.byTrack[t] ?? { total: 0, completed: 0, independentTested: 0 };
              return (
                <li key={t}>
                  <div className="mb-1.5 flex justify-between gap-2 text-[13px]">
                    <Link to={`/library?track=${t}`} className="hover:underline">{TRACK_LABEL[t]}</Link>
                    <span className="tabular-nums text-subtle">{s.completed}/{s.total} · {CATALOG_CANDIDATES[t]} researched</span>
                  </div>
                  <ProgressBar value={s.completed} max={s.total} label={`${TRACK_LABEL[t]} completed`} />
                </li>
              );
            })}
          </ul>
          </Card>

          <Card>
            <CardHeader title="Upcoming revisions" action={<Link to="/revision" className="link text-[13px]">Queue →</Link>} />
            {upcoming.length ? (
              <ul className="divide-y divide-border text-sm">
                {upcoming.map((p) => (
                  <li key={p.problemId} className="flex justify-between gap-2 px-4 py-2">
                    <Link to={`/problems/${p.problemId}`} className="truncate hover:underline">{QUESTION_BY_ID[p.problemId]?.title ?? p.problemId}</Link>
                    <span className={p.nextRevisionAt! <= now ? 'text-warn' : 'text-subtle'}>{new Date(p.nextRevisionAt!).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-sm text-subtle">Nothing scheduled.</p>
            )}
            {!!notesDue?.length && <p className="border-t border-border px-4 py-2 text-xs text-subtle">{notesDue.length} note reminder(s) due this week — see Notes.</p>}
          </Card>
          <Card>
            <CardHeader title="Weak concepts" action={<Link to="/revision" className="link text-[13px]">Practise →</Link>} />
            {weak.length ? (
              <ul className="flex flex-wrap gap-1.5 p-4">
                {weak.map((c) => (
                  <li key={c.conceptId}>
                    <Link to={`/concepts/${c.conceptId}`} className="rounded bg-warn/15 px-2 py-0.5 text-xs text-warn hover:underline">{CONCEPT_BY_ID[c.conceptId]?.title ?? c.conceptId}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-sm text-subtle">No concepts marked “needs revision”.</p>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}
