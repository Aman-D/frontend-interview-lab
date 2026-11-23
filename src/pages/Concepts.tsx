import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '@/components/Layout';
import { Badge, Input, Select } from '@/components/ui';
import { CONCEPTS } from '@/content/concepts';
import { QUESTIONS } from '@/content';
import { useConceptStates } from '@/hooks/useData';
import type { ConceptStatus } from '@/db/types';

export const CONCEPT_STATUS_LABEL: Record<ConceptStatus, string> = { untested: 'Untested', understood: 'Understood', 'needs-revision': 'Needs revision' };

export default function ConceptsPage() {
  const states = useConceptStates();
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [status, setStatus] = useState('');
  const statusOf = (id: string): ConceptStatus => states?.find((s) => s.conceptId === id)?.status ?? 'untested';
  const areas = [...new Set(CONCEPTS.map((c) => c.area))];
  const visible = useMemo(() => {
    const s = search.toLowerCase().trim();
    return CONCEPTS.filter(
      (c) =>
        (!s || [c.title, c.summary, c.definition, c.id].join(' ').toLowerCase().includes(s)) &&
        (!area || c.area === area) &&
        (!status || statusOf(c.id) === status),
    );
  }, [search, area, status, states]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page title="Concepts" description="Reusable explanations linked from every problem. A concept can only be marked “Understood” once you have evidence — an independent solve, a correct MCQ or a follow-up you rated solid.">
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative min-w-[240px] flex-1">
          <span className="sr-only">Search concepts</span>
          <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-subtle" aria-hidden />
          <Input className="w-full pl-8" placeholder="Search concepts…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <Select aria-label="Area" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">All areas</option>
          {areas.map((a) => <option key={a}>{a}</option>)}
        </Select>
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          {Object.entries(CONCEPT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </div>
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((c) => {
          const st = statusOf(c.id);
          const n = QUESTIONS.filter((q) => q.conceptIds.includes(c.id)).length;
          return (
            <li key={c.id} className="rounded-lg border border-border bg-panel p-3.5">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/concepts/${c.id}`} className="font-medium hover:underline">{c.title}</Link>
                <Badge tone={st === 'understood' ? 'ok' : st === 'needs-revision' ? 'warn' : 'neutral'}>{CONCEPT_STATUS_LABEL[st]}</Badge>
              </div>
              <p className="mt-1 text-sm text-subtle">{c.summary}</p>
              <p className="mt-2 text-[11px] text-subtle">{c.area} · {n} linked question{n === 1 ? '' : 's'}</p>
            </li>
          );
        })}
      </ul>
      {!visible.length && <p className="text-sm text-subtle">No concepts match.</p>}
    </Page>
  );
}
