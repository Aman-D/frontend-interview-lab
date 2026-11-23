import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Page } from '@/components/Layout';
import { ConfidenceBadge, DifficultyBadge, PriorityBadge, ProvenanceBadge, StatusBadge } from '@/components/meta';
import { Button, EmptyState, Input, Select } from '@/components/ui';
import { CONCEPT_BY_ID } from '@/content/concepts';
import { QUESTIONS } from '@/content';
import { TRACK_LABEL } from '@/content/labels';
import { useQuestionRows } from '@/hooks/useData';
import { EMPTY_FILTERS, filterAndSort, type LibraryFilters, type SortKey } from '@/lib/filters';
import { STATUS_LABEL, type QuestionStatus } from '@/lib/progress';

const allConcepts = [...new Set(QUESTIONS.flatMap((q) => q.conceptIds))].sort();

function MultiFilter({ label, options, value, onChange }: { label: string; options: { id: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-xs font-medium text-subtle">{label}</legend>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => {
          const on = value.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((v) => v !== o.id) : [...value, o.id])}
              className={`rounded border px-2 py-0.5 text-xs ${on ? 'border-accent bg-accent/10 text-accent' : 'border-border text-subtle hover:text-fg'}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function LibraryPage() {
  const { rows, loading } = useQuestionRows();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<LibraryFilters>(() => ({ ...EMPTY_FILTERS, tracks: params.getAll('track'), concepts: params.getAll('concept') }));
  const [sort, setSort] = useState<SortKey>('default');
  const visible = useMemo(() => filterAndSort(rows, filters, sort), [rows, filters, sort]);
  const set = (patch: Partial<LibraryFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    const p = new URLSearchParams();
    next.tracks.forEach((t) => p.append('track', t));
    next.concepts.forEach((c) => p.append('concept', c));
    setParams(p, { replace: true });
  };

  return (
    <Page title="Problem Library" description={`${QUESTIONS.length} questions with full content. Every question links to the sources it was researched from.`}>
      <div className="mb-4 space-y-3 rounded-lg border border-border bg-panel p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[240px] flex-1">
            <span className="sr-only">Search questions</span>
            <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-subtle" aria-hidden />
            <Input className="w-full pl-8" placeholder="Search title, topic, concept, source title…" value={filters.search} onChange={(e) => set({ search: e.target.value })} />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-subtle">
            Sort
            <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="default">Default</option>
              <option value="title">Title</option>
              <option value="difficulty">Difficulty</option>
              <option value="priority">Priority</option>
              <option value="duration">Estimated time</option>
              <option value="last-attempted">Last attempted</option>
            </Select>
          </label>
          <Button size="sm" variant="ghost" onClick={() => set(EMPTY_FILTERS)}>Clear filters</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <MultiFilter label="Category" options={Object.entries(TRACK_LABEL).map(([id, label]) => ({ id, label }))} value={filters.tracks} onChange={(tracks) => set({ tracks })} />
          <MultiFilter label="Difficulty" options={['easy', 'medium', 'hard'].map((id) => ({ id, label: id }))} value={filters.difficulties} onChange={(difficulties) => set({ difficulties })} />
          <MultiFilter label="Status" options={(Object.keys(STATUS_LABEL) as QuestionStatus[]).map((id) => ({ id, label: STATUS_LABEL[id] }))} value={filters.statuses} onChange={(s) => set({ statuses: s as QuestionStatus[] })} />
          <MultiFilter label="Priority" options={['P0', 'P1', 'P2'].map((id) => ({ id, label: id }))} value={filters.priorities} onChange={(priorities) => set({ priorities })} />
        </div>
        <label className="flex items-center gap-2 text-xs text-subtle">
          Concept
          <Select value={filters.concepts[0] ?? ''} onChange={(e) => set({ concepts: e.target.value ? [e.target.value] : [] })}>
            <option value="">Any concept</option>
            {allConcepts.map((c) => (
              <option key={c} value={c}>{CONCEPT_BY_ID[c]?.title ?? c}</option>
            ))}
          </Select>
        </label>
      </div>

      <p className="mb-2 text-xs text-subtle" aria-live="polite">{loading ? 'Loading progress…' : `${visible.length} of ${rows.length} questions`}</p>
      {visible.length === 0 ? (
        <EmptyState title="No questions match these filters" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-panel">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-subtle">
              <tr>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Difficulty</th>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Source evidence</th>
                <th className="px-3 py-2 font-medium">Est.</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Last attempted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map(({ question: q, status, lastAttemptAt }) => (
                <tr key={q.id} className="hover:bg-muted/50">
                  <td className="px-3 py-2">
                    <Link to={`/problems/${q.id}`} className="font-medium hover:underline">{q.title}</Link>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {q.conceptIds.slice(0, 4).map((c) => (
                        <span key={c} className="text-[11px] text-subtle">#{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs">{TRACK_LABEL[q.track]}</td>
                  <td className="px-3 py-2"><DifficultyBadge d={q.difficulty} /></td>
                  <td className="px-3 py-2"><PriorityBadge p={q.priority} /></td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col items-start gap-1">
                      <ProvenanceBadge q={q} />
                      <ConfidenceBadge q={q} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs tabular-nums">{q.estimatedMinutes} min</td>
                  <td className="px-3 py-2"><StatusBadge s={status} /></td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-subtle">{lastAttemptAt ? new Date(lastAttemptAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
