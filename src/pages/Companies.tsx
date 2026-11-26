import { Info } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Page } from '@/components/Layout';
import { DifficultyBadge, StatusBadge } from '@/components/meta';
import { Badge, Card, CardHeader, ProgressBar } from '@/components/ui';
import { QUESTION_BY_ID } from '@/content';
import { COMPANIES, COMPANY_BY_ID, companyQuestions, type CompanySection, type CompanySet } from '@/content/companies';
import { TRACK_LABEL } from '@/content/labels';
import { useQuestionRows } from '@/hooks/useData';
import type { QuestionStatus } from '@/lib/progress';
import NotFound from './NotFound';

const ORIGIN_LABEL: Record<CompanySection['origin'], string> = { reported: 'From the account', coverage: 'Added for coverage' };
const ORIGIN_HELP: Record<CompanySection['origin'], string> = {
  reported: 'This topic appears in the account the set is based on.',
  coverage: 'Added by the lab to round out the topic or role. Not in the account.',
};

function companyProgress(c: CompanySet, statusOf: (id: string) => QuestionStatus) {
  const qs = companyQuestions(c);
  const done = qs.filter((q) => statusOf(q.id) === 'completed').length;
  const minutes = qs.reduce((a, q) => a + q.estimatedMinutes, 0);
  return { total: qs.length, done, minutes };
}

function hours(min: number) {
  return min < 60 ? `${min} min` : `${Math.round((min / 60) * 10) / 10} h`;
}

function CompanyCard({ c, statusOf }: { c: CompanySet; statusOf: (id: string) => QuestionStatus }) {
  const { total, done, minutes } = companyProgress(c, statusOf);
  return (
    <li className="card-link relative rounded-lg border border-border bg-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/companies/${c.id}`} className="text-[17px] font-medium after:absolute after:inset-0 after:content-['']">{c.name}</Link>
          <p className="text-[13px] text-subtle">{c.role}</p>
        </div>
        <Badge>{total} questions</Badge>
      </div>
      <p className="mt-2 text-sm text-subtle">{c.summary}</p>
      <div className="mt-3 space-y-1.5">
        <ProgressBar value={done} max={total} label={`${c.name} questions completed`} />
        <p className="text-[12px] text-subtle tabular-nums">{done} of {total} completed · about {hours(minutes)} of practice · {c.sections.length} topics</p>
      </div>
    </li>
  );
}

export default function CompaniesPage() {
  const { statusOf } = useQuestionRows();
  return (
    <Page
      title="Companies"
      description="Questions from the bank grouped by the company you are preparing for. Each set links to the same questions as the library, so progress is shared."
    >
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {COMPANIES.map((c) => <CompanyCard key={c.id} c={c} statusOf={statusOf} />)}
      </ul>
      <p className="mt-6 max-w-3xl text-[13px] text-subtle">
        A company set says what you are preparing for, not what that company asks. Each set states where its grouping came from. To add a company, add an entry to{' '}
        <code className="font-mono">src/content/companies.ts</code> that references existing question ids.
      </p>
    </Page>
  );
}

export function CompanyDetailPage() {
  const { id = '' } = useParams();
  const c = COMPANY_BY_ID[id];
  const { statusOf } = useQuestionRows();
  const stats = companyProgress(c ?? COMPANIES[0], statusOf);
  if (!c) return <NotFound />;

  return (
    <Page
      title={c.name}
      description={
        <span className="flex flex-wrap items-center gap-1.5">
          <span>{c.role}</span>
          <Badge>{stats.total} questions</Badge>
          <Badge>{stats.done} completed</Badge>
          <Badge>about {hours(stats.minutes)}</Badge>
        </span>
      }
      actions={<Link to="/companies" className="text-sm text-accent-text hover:underline">All companies</Link>}
    >
      <div role="note" className="mb-5 flex gap-2.5 rounded-lg border border-border bg-panel p-3.5 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-subtle" aria-hidden />
        <div className="space-y-1">
          <p><span className="font-medium">Where this set comes from.</span> {c.basis}</p>
          {c.guide && (
            <p className="text-subtle">
              Theory answers and a 7-day plan are in <code className="font-mono text-[13px]">{c.guide}</code>.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {c.sections.map((s) => (
          <Card key={s.title}>
            <CardHeader
              title={s.title}
              action={
                <span className="flex items-center gap-1.5">
                  <Badge className={s.priority === 'P0' ? 'font-semibold text-fg' : undefined} title="Priority within this set">{s.priority}</Badge>
                  <Badge tone={s.origin === 'reported' ? 'accent' : 'neutral'} title={ORIGIN_HELP[s.origin]}>{ORIGIN_LABEL[s.origin]}</Badge>
                </span>
              }
            />
            <ul className="divide-y divide-border">
              {s.questionIds.map((qid) => {
                const q = QUESTION_BY_ID[qid];
                if (!q) return null;
                return (
                  <li key={qid} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-muted/50">
                    <div className="min-w-[14rem] flex-1">
                      <Link to={`/problems/${q.id}`} className="font-medium hover:underline">{q.title}</Link>
                      <div className="text-[13px] text-subtle">{TRACK_LABEL[q.track]}</div>
                    </div>
                    <DifficultyBadge d={q.difficulty} />
                    <span className="w-14 text-right text-xs tabular-nums text-subtle">{q.estimatedMinutes} min</span>
                    <StatusBadge s={statusOf(q.id)} />
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
    </Page>
  );
}
