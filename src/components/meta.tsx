import { ExternalLink, ShieldCheck, ShieldAlert } from 'lucide-react';
import { CONFIDENCE_HELP, CONFIDENCE_LABEL, PROVENANCE_HELP, PROVENANCE_LABEL } from '@/content/labels';
import type { Question } from '@/content/schema';
import { SOURCE_BY_ID } from '@/content/sources';
import { VERIFICATION, verificationFor } from '@/content/verification';
import { OUTCOME_LABEL, STATUS_LABEL, type QuestionStatus } from '@/lib/progress';
import type { Outcome } from '@/db/types';
import { Badge } from './ui';

export function DifficultyBadge({ d }: { d: Question['difficulty'] }) {
  // Neutral by design: colour is reserved for status. Bars show the level.
  const n = d === 'easy' ? 1 : d === 'medium' ? 2 : 3;
  return (
    <Badge title={`Difficulty: ${d}`}>
      <span aria-hidden className="mr-1 inline-flex gap-[2px]">
        {[1, 2, 3].map((i) => <span key={i} className={`h-2 w-[3px] rounded-sm ${i <= n ? 'bg-fg/70' : 'bg-fg/15'}`} />)}
      </span>
      {d}
    </Badge>
  );
}

export function PriorityBadge({ p }: { p: Question['priority'] }) {
  return <Badge className={p === 'P0' ? 'font-semibold text-fg' : undefined} title="Study priority (P0 = highest)">{p}</Badge>;
}

export function StatusBadge({ s }: { s: QuestionStatus }) {
  const tone = s === 'completed' ? 'ok' : s === 'needs-revision' ? 'warn' : s === 'in-progress' ? 'accent' : 'neutral';
  return <Badge tone={tone}>{STATUS_LABEL[s]}</Badge>;
}

export function OutcomeBadge({ o }: { o?: Outcome }) {
  if (!o) return null;
  const tone = o === 'independent-tested' ? 'ok' : o === 'independent' ? 'accent' : o === 'assisted' ? 'warn' : 'bad';
  return <Badge tone={tone}>{OUTCOME_LABEL[o]}</Badge>;
}

const PROVENANCE_SHORT = { VERIFIED_INTERVIEW_REPORT: 'Interview report', PUBLISHED_PRACTICE_PROBLEM: 'Practice problem', DOCUMENTED_TECHNICAL_EXERCISE: 'Docs exercise', ORIGINAL_VARIATION: 'Original variation' } as const;

export function ProvenanceBadge({ q, short }: { q: Question; short?: boolean }) {
  const p = q.research.provenance;
  return (
    <Badge title={`${PROVENANCE_LABEL[p]}. ${PROVENANCE_HELP[p]}`}>
      {short ? PROVENANCE_SHORT[p] : PROVENANCE_LABEL[p]}
    </Badge>
  );
}

export function ConfidenceBadge({ q }: { q: Question }) {
  const c = q.research.frequencyConfidence;
  return (
    <span title={CONFIDENCE_HELP} className="inline-flex items-center whitespace-nowrap text-[12px] font-medium text-subtle">
      <span aria-hidden className={`mr-1.5 h-1.5 w-1.5 rounded-full ${c === 'HIGH_CONFIDENCE' ? 'bg-fg/80' : c === 'MEDIUM_CONFIDENCE' ? 'bg-fg/45' : 'bg-fg/20'}`} />
      {CONFIDENCE_LABEL[c]}
    </span>
  );
}

/** Research evidence + verification status, shown on every question. */
export function SourcesPanel({ q }: { q: Question }) {
  const v = q.kind === 'coding' ? verificationFor(q.id) : undefined;
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-1.5">
        <ProvenanceBadge q={q} />
        <ConfidenceBadge q={q} />
        <Badge>{q.research.verificationStatus.replace(/_/g, ' ').toLowerCase()}</Badge>
        <Badge>last verified {q.research.lastVerified}</Badge>
      </div>
      <p className="text-xs text-subtle">{PROVENANCE_HELP[q.research.provenance]} {CONFIDENCE_HELP}</p>
      <div>
        <h3 className="mb-1.5 font-medium">Evidence</h3>
        <ul className="space-y-2">
          {q.research.evidence.map((e, i) => {
            const s = SOURCE_BY_ID[e.sourceId];
            return (
              <li key={i} className="rounded-md border border-border p-2.5">
                <a href={e.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-medium text-accent-text hover:underline">
                  “{e.originalTitle}” <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
                <div className="text-xs text-subtle">
                  {s ? `${s.title} · accessed ${s.accessedOn}${s.accessible ? '' : ' · INACCESSIBLE'}` : `Unknown source "${e.sourceId}"`}
                </div>
                {e.note && <div className="mt-1 text-xs">{e.note}</div>}
              </li>
            );
          })}
        </ul>
      </div>
      {q.research.variationOf && (
        <p>
          <span className="font-medium">Variation of:</span> {q.research.variationOf}
        </p>
      )}
      <div>
        <h3 className="mb-1 font-medium">Research notes</h3>
        <p className="text-subtle">{q.research.researchNotes}</p>
      </div>
      {q.kind === 'coding' && (
        <div>
          <h3 className="mb-1 font-medium">Reference solution verification</h3>
          {v ? (
            <p className={v.ok ? 'text-ok' : 'text-bad'}>
              {v.ok ? <ShieldCheck className="mr-1 inline h-4 w-4" aria-hidden /> : <ShieldAlert className="mr-1 inline h-4 w-4" aria-hidden />}
              Reference solution passed {v.solution.passed}/{v.solution.total} tests; starter passed {v.starter.passed}/{v.starter.total} (proves the tests can fail). Executed by{' '}
              <code>npm run verify:solutions</code> in {VERIFICATION.browser ?? 'Chromium'} on {VERIFICATION.generatedAt?.slice(0, 10)}.
            </p>
          ) : (
            <p className="text-warn">
              <ShieldAlert className="mr-1 inline h-4 w-4" aria-hidden />
              Not verified in this build. Run <code>npm run verify:solutions</code> to execute the reference solution.
            </p>
          )}
        </div>
      )}
      {q.kind === 'output' && (
        <div>
          <h3 className="mb-1 font-medium">Answer verification</h3>
          <p className="text-subtle">
            The expected output was produced by executing the snippet ({q.environment === 'node' ? 'Node.js vm' : q.environment === 'jsdom' ? 'jsdom' : 'React 18.3.1 in jsdom'}) in the automated test-suite (<code>npm test</code>).
          </p>
        </div>
      )}
      {q.kind === 'output' && q.docSourceIds.length > 0 && <DocLinks ids={q.docSourceIds} />}
    </div>
  );
}

export function DocLinks({ ids, title = 'Documentation' }: { ids: string[]; title?: string }) {
  const docs = ids.map((id) => SOURCE_BY_ID[id]).filter(Boolean);
  if (!docs.length) return null;
  return (
    <div>
      <h3 className="mb-1 text-sm font-medium">{title}</h3>
      <ul className="space-y-1 text-sm">
        {docs.map((d) => (
          <li key={d.id}>
            <a href={d.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-accent-text hover:underline">
              {d.title} <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
