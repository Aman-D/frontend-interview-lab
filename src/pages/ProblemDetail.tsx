import { Play } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Page } from '@/components/Layout';
import { Markdown } from '@/components/Markdown';
import { DifficultyBadge, OutcomeBadge, PriorityBadge, SourcesPanel, StatusBadge } from '@/components/meta';
import { ClarificationsView, DescriptionView, RequirementsChecklist, TestingPlanView } from '@/components/ProblemSpec';
import { Badge, Button, Card, CardHeader, Tabs } from '@/components/ui';
import { QUESTION_BY_ID } from '@/content';
import { companiesForQuestion } from '@/content/companies';
import { CONCEPT_BY_ID } from '@/content/concepts';
import { EXECUTION_LABEL, TRACK_LABEL } from '@/content/labels';
import { repo } from '@/db/repo';
import { useAttempts, useProgress } from '@/hooks/useData';
import { deriveStatus, interviewReadyEligibility } from '@/lib/progress';
import { formatHuman } from '@/lib/timer';
import NotFound from './NotFound';

type Tab = 'overview' | 'clarify' | 'requirements' | 'testing' | 'sources';

export default function ProblemDetail() {
  const { id = '' } = useParams();
  const q = QUESTION_BY_ID[id];
  const attempts = useAttempts(id);
  const progress = useProgress(id);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [readyError, setReadyError] = useState<string | null>(null);
  if (!q) return <NotFound />;

  const status = deriveStatus(attempts ?? [], progress);
  const readiness = interviewReadyEligibility(q, attempts ?? []);
  const active = attempts?.find((a) => a.status === 'active');

  return (
    <Page
      title={q.title}
      description={
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge>{TRACK_LABEL[q.track]}</Badge>
          <DifficultyBadge d={q.difficulty} />
          <PriorityBadge p={q.priority} />
          <Badge>{q.estimatedMinutes} min</Badge>
          <Badge>{EXECUTION_LABEL[q.execution]}</Badge>
          <Badge>{q.seniority.join(' · ')}</Badge>
          <StatusBadge s={status} />
        </span>
      }
      actions={
        <div className="flex flex-wrap gap-2">
          {active ? (
            <Button variant="primary" onClick={() => navigate(`/practice/${q.id}`)}>
              <Play className="h-4 w-4" aria-hidden /> Resume {active.mode} attempt
            </Button>
          ) : (
            <>
              <Button variant="primary" onClick={() => navigate(`/practice/${q.id}?mode=study`)}><Play className="h-4 w-4" aria-hidden /> Study mode</Button>
              <Button onClick={() => navigate(`/practice/${q.id}?mode=interview`)}>Interview mode</Button>
              {status !== 'not-started' && <Button onClick={() => navigate(`/practice/${q.id}?mode=revision`)}>Revision mode</Button>}
            </>
          )}
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <Card>
          <div className="border-b border-border px-3 py-2">
            <Tabs
              label="Problem sections"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'overview', label: 'Overview' },
                { id: 'clarify', label: 'Clarifications & scope', hidden: q.kind !== 'coding' },
                { id: 'requirements', label: 'Requirement roadmap', hidden: q.kind !== 'coding' },
                { id: 'testing', label: 'Testing', hidden: q.kind !== 'coding' },
                { id: 'sources', label: 'Sources & verification' },
              ]}
            />
          </div>
          <div className="p-4">
            {tab === 'overview' &&
              (q.kind === 'coding' ? (
                <DescriptionView problem={q} />
              ) : q.kind === 'design' ? (
                <div className="space-y-3 text-sm">
                  <Markdown>{q.scenario}</Markdown>
                  {q.constraints.length > 0 && (
                    <ul className="list-disc pl-5">{q.constraints.map((c) => <li key={c}><Markdown inline>{c}</Markdown></li>)}</ul>
                  )}
                  <p className="text-subtle">Answer the MCQs, write your answer as you would say it in the interview, then compare it with the outline and model answer. {q.versionNotes}</p>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <Markdown>{q.prompt}</Markdown>
                  <p className="text-subtle">Predict the exact console output, then reveal the executed result and the step-by-step explanation in the practice view.</p>
                </div>
              ))}
            {tab === 'clarify' && q.kind === 'coding' && <ClarificationsView problem={q} />}
            {tab === 'requirements' && q.kind === 'coding' && <RequirementsChecklist problem={q} />}
            {tab === 'testing' && q.kind === 'coding' && <TestingPlanView problem={q} />}
            {tab === 'sources' && <SourcesPanel q={q} />}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Your progress" />
            <div className="space-y-3 p-4 text-sm">
              <div>
                <p className="font-medium">Interview-ready</p>
                {progress?.interviewReady ? (
                  <div className="mt-1 flex items-center justify-between">
                    <Badge tone="ok">Marked ready {progress.interviewReadyAt ? new Date(progress.interviewReadyAt).toLocaleDateString() : ''}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => repo.setInterviewReady(q, false)}>Unmark</Button>
                  </div>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="mt-1"
                      disabled={!readiness.eligible}
                      onClick={() => repo.setInterviewReady(q, true).catch((e: Error) => setReadyError(e.message))}
                    >
                      Mark interview-ready
                    </Button>
                    {!readiness.eligible && (
                      <ul className="mt-1.5 list-disc pl-4 text-xs text-subtle">{readiness.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                    )}
                    {readyError && <p role="alert" className="mt-1 text-xs text-bad">{readyError}</p>}
                  </>
                )}
              </div>
              {status !== 'not-started' && (
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={!!progress?.needsRevision} onChange={(e) => repo.setNeedsRevision(q.id, e.target.checked)} />
                  Needs revision
                </label>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader title={`Attempts (${attempts?.length ?? 0})`} />
            <ul className="divide-y divide-border text-sm">
              {(attempts ?? []).slice().reverse().map((a) => (
                <li key={a.id} className="space-y-1 px-4 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-subtle">{new Date(a.startedAt).toLocaleString()}</span>
                    <OutcomeBadge o={a.outcome} />
                  </div>
                  <div className="text-xs text-subtle">
                    {a.mode} · {a.status} · {formatHuman(a.activeMs)}
                    {a.lastRun ? ` · tests ${a.lastRun.passed}/${a.lastRun.total}` : ''}
                    {a.hintsRevealed ? ` · ${a.hintsRevealed} hint(s)` : ''}
                    {a.solutionRevealed ? ' · solution viewed' : ''}
                  </div>
                </li>
              ))}
              {!attempts?.length && <li className="px-4 py-3 text-xs text-subtle">No attempts yet.</li>}
            </ul>
          </Card>
          {companiesForQuestion(q.id).length > 0 && (
            <Card>
              <CardHeader title="Company prep sets" />
              <ul className="flex flex-wrap gap-1.5 p-4">
                {companiesForQuestion(q.id).map((c) => (
                  <li key={c.id}>
                    <Link to={`/companies/${c.id}`} className="rounded bg-muted px-2 py-0.5 text-xs hover:underline">{c.name}</Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card>
            <CardHeader title="Concepts" />
            <ul className="flex flex-wrap gap-1.5 p-4">
              {q.conceptIds.map((c) => (
                <li key={c}>
                  <Link to={`/concepts/${c}`} className="rounded bg-muted px-2 py-0.5 text-xs hover:underline">{CONCEPT_BY_ID[c]?.title ?? c}</Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </Page>
  );
}
