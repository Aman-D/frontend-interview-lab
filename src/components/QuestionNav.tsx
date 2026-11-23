import { ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QUESTIONS } from '@/content';
import { TRACK_LABEL } from '@/content/labels';
import type { Question, TrackId } from '@/content/schema';
import { useQuestionRows } from '@/hooks/useData';
import { STATUS_LABEL, type QuestionStatus } from '@/lib/progress';
import { cn } from './ui';

const TRACKS = Object.keys(TRACK_LABEL) as TrackId[];
const ORDERED: Question[] = TRACKS.flatMap((t) => QUESTIONS.filter((q) => q.track === t));

const DOT: Record<QuestionStatus, string> = {
  'not-started': 'border border-subtle/60',
  'in-progress': 'bg-accent',
  completed: 'bg-ok',
  'needs-revision': 'bg-warn',
};

/** Where links point: stay in the practice workspace when you are practising, otherwise the detail page. */
export function questionHref(id: string, view: 'practice' | 'problems') {
  return `/${view}/${id}`;
}

/** Previous / next question in sidebar order. */
export function useAdjacentQuestions(currentId: string) {
  const i = ORDERED.findIndex((q) => q.id === currentId);
  return { prev: i > 0 ? ORDERED[i - 1] : undefined, next: i >= 0 && i < ORDERED.length - 1 ? ORDERED[i + 1] : undefined, index: i, total: ORDERED.length };
}

export function QuestionNav({ currentId, view, collapsed }: { currentId: string; view: 'practice' | 'problems'; collapsed: boolean }) {
  const { statusOf } = useQuestionRows();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const currentTrack = ORDERED.find((q) => q.id === currentId)?.track;
  const [open, setOpen] = useState<Set<TrackId>>(() => new Set(currentTrack ? [currentTrack] : []));
  const activeRef = useRef<HTMLAnchorElement>(null);
  const { prev, next, index, total } = useAdjacentQuestions(currentId);

  // Open the current question's track when navigating to it, and keep it in view.
  useEffect(() => {
    if (currentTrack) setOpen((s) => (s.has(currentTrack) ? s : new Set(s).add(currentTrack)));
  }, [currentTrack]);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [currentId, collapsed]);

  const f = filter.trim().toLowerCase();
  const groups = useMemo(
    () =>
      TRACKS.map((t) => ({
        track: t,
        items: ORDERED.filter((q) => q.track === t && (!f || `${q.title} ${q.topics.join(' ')}`.toLowerCase().includes(f))),
      })).filter((g) => g.items.length),
    [f],
  );

  const go = (q?: Question) => q && navigate(questionHref(q.id, view));

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 border-t border-border p-1.5">
        <button className="rounded p-1.5 text-subtle hover:bg-muted disabled:opacity-40" disabled={!prev} onClick={() => go(prev)} aria-label={prev ? `Previous question: ${prev.title}` : 'No previous question'} title={prev?.title}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-[10px] tabular-nums text-subtle" aria-label={`Question ${index + 1} of ${total}`}>{index + 1}/{total}</span>
        <button className="rounded p-1.5 text-subtle hover:bg-muted disabled:opacity-40" disabled={!next} onClick={() => go(next)} aria-label={next ? `Next question: ${next.title}` : 'No next question'} title={next?.title}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <nav aria-label="Questions" className="flex min-h-0 flex-1 flex-col border-t border-border">
      <div className="flex items-center justify-between gap-1 px-3 pb-1 pt-2.5">
        <span className="text-[13px] font-medium text-subtle">Questions</span>
        <div className="flex items-center">
          <button className="rounded p-1 text-subtle hover:bg-muted disabled:opacity-40" disabled={!prev} onClick={() => go(prev)} aria-label={prev ? `Previous question: ${prev.title}` : 'No previous question'} title={prev?.title}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] tabular-nums text-subtle">{index + 1}/{total}</span>
          <button className="rounded p-1 text-subtle hover:bg-muted disabled:opacity-40" disabled={!next} onClick={() => go(next)} aria-label={next ? `Next question: ${next.title}` : 'No next question'} title={next?.title}>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <label className="relative mx-2 mb-1.5 block">
        <span className="sr-only">Filter questions</span>
        <Search className="pointer-events-none absolute left-2 top-1.5 h-3.5 w-3.5 text-subtle" aria-hidden />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter…"
          className="h-8 w-full rounded border border-border bg-bg pl-7 pr-2 text-[13px] placeholder:text-subtle/80"
        />
      </label>
      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
        {groups.map(({ track, items }) => {
          const isOpen = !!f || open.has(track);
          const done = items.filter((q) => statusOf(q.id) === 'completed').length;
          return (
            <section key={track} className="mb-0.5">
              <button
                className="flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-xs font-medium text-subtle hover:bg-muted hover:text-fg"
                aria-expanded={isOpen}
                onClick={() => setOpen((s) => {
                  const n = new Set(s);
                  if (n.has(track)) n.delete(track);
                  else n.add(track);
                  return n;
                })}
              >
                <ChevronDown className={cn('h-3 w-3 shrink-0 transition-transform', !isOpen && '-rotate-90')} aria-hidden />
                <span className="flex-1 truncate">{TRACK_LABEL[track]}</span>
                <span className="tabular-nums text-[10px]">{done}/{items.length}</span>
              </button>
              {isOpen && (
                <ul>
                  {items.map((q) => {
                    const st = statusOf(q.id);
                    const current = q.id === currentId;
                    return (
                      <li key={q.id}>
                        <Link
                          ref={current ? activeRef : undefined}
                          to={questionHref(q.id, view)}
                          aria-current={current ? 'page' : undefined}
                          title={`${q.title} — ${STATUS_LABEL[st]}`}
                          className={cn(
                            'flex items-center gap-2 rounded py-1.5 pl-5 pr-1.5 text-[13px] transition-colors duration-150',
                            current ? 'bg-muted font-medium text-fg' : 'text-fg/75 hover:bg-muted/70 hover:text-fg',
                          )}
                        >
                          <span className={cn('h-2 w-2 shrink-0 rounded-full', DOT[st])} aria-hidden />
                          <span className="truncate">{q.title}</span>
                          <span className="sr-only">({STATUS_LABEL[st]})</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
        {!groups.length && <p className="px-2 py-1 text-xs text-subtle">No matches.</p>}
      </div>
    </nav>
  );
}
