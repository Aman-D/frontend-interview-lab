import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Page } from '@/components/Layout';
import { ConfidenceBadge, ProvenanceBadge } from '@/components/meta';
import { Badge, Card, CardHeader } from '@/components/ui';
import { QUESTIONS } from '@/content';
import { CATALOG_CANDIDATES, CONFIDENCE_HELP, PROVENANCE_HELP, PROVENANCE_LABEL, TRACK_LABEL } from '@/content/labels';
import type { Provenance, TrackId } from '@/content/schema';
import { SOURCES } from '@/content/sources';
import { VERIFICATION } from '@/content/verification';

const CATEGORY: Record<string, string> = {
  'practice-platform': 'Practice platform',
  'interview-handbook': 'Interview handbook',
  'curated-hub': 'Curated hub',
  blog: 'Blog / guide',
  'official-docs': 'Official documentation',
  'interview-report': 'Interview report',
  'tooling-docs': 'Tooling documentation',
};

export default function SourcesPage() {
  const questionSources = SOURCES.filter((s) => !['official-docs', 'tooling-docs'].includes(s.category));
  const docs = SOURCES.filter((s) => ['official-docs', 'tooling-docs'].includes(s.category));
  const usage = (id: string) => QUESTIONS.filter((q) => q.research.evidence.some((e) => e.sourceId === id)).length;
  return (
    <Page
      title="Research Sources"
      description="Where every question came from and how it was verified. Practice-platform listings show a topic is used in interview preparation — they are not evidence that any specific company asks it. No company attributions are made anywhere in this app."
    >
      <div className="grid gap-5">
        <Card>
          <CardHeader title="Classification" />
          <div className="grid gap-3 p-4 text-sm md:grid-cols-2">
            {(Object.keys(PROVENANCE_LABEL) as Provenance[]).map((p) => (
              <div key={p}>
                <p className="font-medium">{PROVENANCE_LABEL[p]} <span className="text-xs text-subtle">({QUESTIONS.filter((q) => q.research.provenance === p).length} questions)</span></p>
                <p className="text-xs text-subtle">{PROVENANCE_HELP[p]}</p>
              </div>
            ))}
            <p className="text-xs text-subtle md:col-span-2"><strong>Frequency confidence:</strong> {CONFIDENCE_HELP}</p>
            <p className="text-xs text-subtle md:col-span-2">
              No public first-person interview reports were collected yet, so no question is classified as a verified interview report. Full methodology: <code>docs/research/verification-methodology.md</code>.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Interview-question sources" />
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-subtle">
              <tr><th className="px-4 py-2 font-medium">Source</th><th className="px-4 py-2 font-medium">Category</th><th className="px-4 py-2 font-medium">Accessed</th><th className="px-4 py-2 font-medium">Used by</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {questionSources.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2">
                    <a href={s.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-accent hover:underline">{s.title} <ExternalLink className="h-3 w-3" aria-hidden /></a>
                    {s.notes && <p className="text-xs text-subtle">{s.notes}</p>}
                  </td>
                  <td className="px-4 py-2 text-xs">{CATEGORY[s.category]}</td>
                  <td className="px-4 py-2 text-xs">{s.accessible ? <Badge tone="ok">{s.accessedOn}</Badge> : <Badge tone="bad">inaccessible</Badge>}</td>
                  <td className="px-4 py-2 text-xs tabular-nums">{usage(s.id)} question(s)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader title="Question → evidence" />
          <ul className="divide-y divide-border text-sm">
            {QUESTIONS.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center gap-2 px-4 py-2">
                <Link to={`/problems/${q.id}`} className="min-w-[200px] font-medium hover:underline">{q.title}</Link>
                <ProvenanceBadge q={q} />
                <ConfidenceBadge q={q} />
                <span className="text-xs text-subtle">{q.research.evidence.map((e) => `“${e.originalTitle}”`).join(', ')}</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader title="Catalog coverage" />
            <ul className="space-y-1 p-4 text-sm">
              {(Object.keys(TRACK_LABEL) as TrackId[]).map((t) => (
                <li key={t} className="flex justify-between"><span>{TRACK_LABEL[t]}</span><span className="tabular-nums text-subtle">{QUESTIONS.filter((q) => q.track === t).length} implemented / {CATALOG_CANDIDATES[t]} researched</span></li>
              ))}
              <li className="pt-2 text-xs text-subtle">Candidate list with per-row evidence: <code>docs/research/question-catalog.md</code>. Gaps: <code>docs/research/coverage-gaps.md</code>.</li>
            </ul>
          </Card>
          <Card>
            <CardHeader title="Solution verification run" />
            <div className="p-4 text-sm">
              {VERIFICATION.generatedAt ? (
                <>
                  <p>Last run {new Date(VERIFICATION.generatedAt).toLocaleString()} in {VERIFICATION.browser}.</p>
                  <ul className="mt-2 space-y-0.5 text-xs">
                    {VERIFICATION.results.map((r) => (
                      <li key={r.problemId} className={r.ok ? 'text-ok' : 'text-bad'}>{r.ok ? '✓' : '✗'} {r.problemId}: solution {r.solution.passed}/{r.solution.total}, starter {r.starter.passed}/{r.starter.total}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-warn">No verification record in this build. Run <code>npm run verify:solutions</code>.</p>
              )}
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader title="Technical documentation used for validation" />
          <ul className="grid gap-x-6 gap-y-1 p-4 text-sm md:grid-cols-2">
            {docs.map((d) => (
              <li key={d.id}><a href={d.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline">{d.title}</a></li>
            ))}
          </ul>
        </Card>
      </div>
    </Page>
  );
}
