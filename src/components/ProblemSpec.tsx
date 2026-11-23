import type { CodingProblem, Level, RequirementCategory } from '@/content/schema';
import { Markdown } from './Markdown';
import { Badge, cn } from './ui';

const CATEGORY_LABEL: Record<RequirementCategory, string> = {
  functional: 'Functional requirements',
  technical: 'Technical requirements',
  'edge-case': 'Edge cases',
  accessibility: 'Accessibility',
  performance: 'Performance',
  testing: 'Testing',
};

const LEVEL_TONE: Record<Level, 'bad' | 'accent' | 'neutral'> = { MUST: 'bad', SHOULD: 'accent', OPTIONAL: 'neutral' };
const LEVEL_LABEL: Record<Level, string> = { MUST: 'MUST KNOW', SHOULD: 'SHOULD KNOW', OPTIONAL: 'OPTIONAL' };

export function RequirementsChecklist({ problem, done, onToggle }: { problem: CodingProblem; done?: Set<string>; onToggle?: (id: string, v: boolean) => void }) {
  const cats = Object.keys(CATEGORY_LABEL) as RequirementCategory[];
  const total = problem.spec.requirements.length;
  const doneCount = done ? problem.spec.requirements.filter((r) => done.has(r.id)).length : 0;
  return (
    <div className="space-y-4">
      {done && (
        <p className="text-xs text-subtle">
          {doneCount}/{total} checked off. Checking a requirement is your own assessment — it is recorded with the attempt and used for interview-readiness, not graded automatically.
        </p>
      )}
      {cats.map((c) => {
        const reqs = problem.spec.requirements.filter((r) => r.category === c);
        if (!reqs.length) return null;
        return (
          <section key={c}>
            <h3 className="mb-1.5 text-sm font-semibold">{CATEGORY_LABEL[c]}</h3>
            <ul className="space-y-1.5">
              {reqs.map((r) => (
                <li key={r.id} className="flex items-start gap-2 text-sm">
                  {done && onToggle ? (
                    <input
                      type="checkbox"
                      className="mt-1 h-3.5 w-3.5 accent-[rgb(var(--accent))]"
                      checked={done.has(r.id)}
                      onChange={(e) => onToggle(r.id, e.target.checked)}
                      aria-label={`Mark requirement done: ${r.text}`}
                    />
                  ) : (
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-subtle" aria-hidden />
                  )}
                  <span className={cn('flex-1', done?.has(r.id) && 'text-subtle line-through')}>
                    {r.text}
                    {r.acceptance && <span className="block text-xs text-subtle">Acceptance: {r.acceptance}</span>}
                  </span>
                  <Badge tone={LEVEL_TONE[r.level]} className="mt-0.5">{LEVEL_LABEL[r.level]}</Badge>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function ClarificationsView({ problem }: { problem: CodingProblem }) {
  return (
    <div className="space-y-3">
      <ol className="space-y-3">
        {problem.spec.clarifications.map((c, i) => (
          <li key={i} className="rounded-md border border-border p-3 text-sm">
            <p className="font-medium">Q{i + 1}. {c.question}</p>
            <p className="mt-1 text-subtle"><span className="font-medium text-fg">Why it matters:</span> {c.why}</p>
            <p className="mt-1 text-subtle"><span className="font-medium text-fg">Default assumption:</span> {c.defaultAssumption}</p>
          </li>
        ))}
      </ol>
      <div>
        <h3 className="mb-1 text-sm font-semibold">Scope decisions</h3>
        <ul className="list-disc space-y-0.5 pl-5 text-sm">{problem.spec.scopeDecisions.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </div>
    </div>
  );
}

export function DescriptionView({ problem, compact }: { problem: CodingProblem; compact?: boolean }) {
  const { spec } = problem;
  return (
    <div className="space-y-4 text-sm">
      <Markdown className={compact ? 'prose-compact' : undefined}>{spec.description}</Markdown>
      {spec.constraints.length > 0 && (
        <section>
          <h3 className="mb-1 font-semibold">Constraints</h3>
          <ul className="list-disc pl-5">{spec.constraints.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </section>
      )}
      <section>
        <h3 className="mb-1 font-semibold">Acceptance criteria</h3>
        <ul className="list-disc pl-5">{spec.acceptanceCriteria.map((c, i) => <li key={i}>{c}</li>)}</ul>
      </section>
      {spec.examples.length > 0 && (
        <section>
          <h3 className="mb-1 font-semibold">Examples</h3>
          <div className="space-y-2">
            {spec.examples.map((e, i) => (
              <div key={i} className="rounded-md border border-border p-2.5">
                <p className="font-medium">{e.title}</p>
                <p className="font-mono text-xs"><span className="text-subtle">Input:</span> {e.input}</p>
                <p className="font-mono text-xs"><span className="text-subtle">Output:</span> {e.output}</p>
                {e.explanation && <p className="mt-1 text-xs text-subtle">{e.explanation}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
      <section>
        <h3 className="mb-1 font-semibold">Learning objectives</h3>
        <ul className="list-disc pl-5">{spec.learningObjectives.map((c, i) => <li key={i}>{c}</li>)}</ul>
      </section>
    </div>
  );
}

export function TestingPlanView({ problem }: { problem: CodingProblem }) {
  const pub = problem.tests.filter((t) => t.visibility === 'public');
  const hid = problem.tests.filter((t) => t.visibility === 'hidden');
  const countCases = (src: string, kind: string) => (kind === 'type' ? (src.match(/\/\/\s*@test:/g) ?? []).length : (src.match(/\b(it|test)\(/g) ?? []).length);
  return (
    <div className="space-y-3 text-sm">
      <p>
        <span className="font-medium">Automated:</span> {pub.reduce((n, t) => n + countCases(t.source, t.kind), 0)} public and {hid.reduce((n, t) => n + countCases(t.source, t.kind), 0)} hidden test cases
        {problem.execution === 'ts-types' ? ' (type-level tests are checked by the real TypeScript compiler)' : ' run in an isolated sandbox'}.
        Hidden tests are executed but their source is not shown until you submit.
      </p>
      {problem.spec.manualTests.length > 0 && (
        <div>
          <p className="font-medium">Manual checks (self-assessed — not graded automatically):</p>
          <ul className="list-disc pl-5">{problem.spec.manualTests.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
