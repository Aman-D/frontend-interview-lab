import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Page } from '@/components/Layout';
import { OutcomeBadge, StatusBadge } from '@/components/meta';
import { Card, CardHeader, EmptyState, ProgressBar, Stat } from '@/components/ui';
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
    <Page title="Dashboard" description="Every number here is computed from your own recorded activity in this browser. Nothing is estimated or pre-filled.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Researched candidates" value={researched} hint="in the question catalog" />
        <Stat label="Available to practise" value={stats.available} hint="full content + verified" />
        <Stat label="Completed" value={stats.completed} />
        <Stat label="Independently solved" value={stats.independent} hint={`${stats.independentTested} with all tests passing`} />
        <Stat label="Completed with help" value={stats.assisted} hint="hint or solution viewed" />
        <Stat label="Needs revision" value={stats.needsRevision} />
        <Stat label="Interview-ready" value={stats.interviewReady} hint="marked by you, evidence-gated" />
        <Stat label="Time practising" value={formatHuman(stats.practiceMs)} hint="workspace open & visible" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recommended next" action={<Link to="/library" className="text-xs text-accent hover:underline">Library →</Link>} />
          <ul className="divide-y divide-border">
            {recs.map((r) => (
              <li key={r.question.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <Link to={`/problems/${r.question.id}`} className="font-medium hover:underline">{r.question.title}</Link>
                  <div className="text-xs text-subtle">{r.reason} · {TRACK_LABEL[r.question.track]}</div>
                </div>
                <StatusBadge s={statusOf(r.question.id)} />
              </li>
            ))}
            {!recs.length && <li className="px-4 py-3 text-sm text-subtle">You have attempted everything available. Check the revision queue.</li>}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Track progress" />
          <ul className="space-y-3 p-4">
            {(Object.keys(TRACK_LABEL) as TrackId[]).map((t) => {
              const s = stats.byTrack[t] ?? { total: 0, completed: 0, independentTested: 0 };
              return (
                <li key={t}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{TRACK_LABEL[t]}</span>
                    <span className="tabular-nums text-subtle">{s.completed}/{s.total} done · {CATALOG_CANDIDATES[t]} researched</span>
                  </div>
                  <ProgressBar value={s.completed} max={s.total} label={`${TRACK_LABEL[t]} completed`} />
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Recent attempts" action={<Link to="/history" className="text-xs text-accent hover:underline">History →</Link>} />
          {recent.length ? (
            <ul className="divide-y divide-border">
              {recent.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <Link to={`/problems/${a.problemId}`} className="font-medium hover:underline">{QUESTION_BY_ID[a.problemId]?.title ?? a.problemId}</Link>
                    <div className="text-xs text-subtle">
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
            <CardHeader title="Upcoming revisions" action={<Link to="/revision" className="text-xs text-accent hover:underline">Queue →</Link>} />
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
            <CardHeader title="Weak concepts" action={<Link to="/revision" className="text-xs text-accent hover:underline">Practise →</Link>} />
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
