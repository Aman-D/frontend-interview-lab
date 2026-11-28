import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { companyPosition } from '@/content/companies';
import type { Question } from '@/content/schema';
import { cn } from './ui';

/** Query parameter that keeps a question page inside a company prep set (for example `?set=314e`). */
export const SET_PARAM = 'set';

/** Link to a question that stays inside a company set when one is given. */
export function setHref(path: string, setId: string | null | undefined) {
  if (!setId) return path;
  const [base, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  params.set(SET_PARAM, setId);
  return `${base}?${params.toString()}`;
}

/** The company set the current question page was opened from, if the question is in it. */
export function useCompanyContext(questionId: string | null) {
  const [params] = useSearchParams();
  const setId = params.get(SET_PARAM);
  const position = questionId ? companyPosition(setId, questionId) : undefined;
  const activeSet = position ? position.set.id : null;
  const withSet = useCallback((path: string) => setHref(path, activeSet), [activeSet]);
  return { position, withSet };
}

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || !!target.closest('.monaco-editor, [contenteditable="true"]');
}

/**
 * Previous / next within a company set, shown above a question that was opened from that set.
 * `[` and `]` move between questions when focus is not in a text field or the editor.
 */
export function CompanySetBar({ questionId, view }: { questionId: string; view: 'practice' | 'problems' }) {
  const { position } = useCompanyContext(questionId);
  const navigate = useNavigate();
  const setId = position?.set.id;
  const href = useCallback((q: Question) => setHref(`/${view}/${q.id}`, setId), [view, setId]);

  const prev = position?.prev;
  const next = position?.next;
  useEffect(() => {
    if (!position) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isTyping(e.target)) return;
      const target = e.key === '[' ? prev : e.key === ']' ? next : undefined;
      if (!target) return;
      e.preventDefault();
      navigate(href(target));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [position, prev, next, href, navigate]);

  if (!position) return null;
  const { set, section, index, total } = position;
  const btn = 'inline-flex h-8 max-w-[16rem] items-center gap-1 rounded border border-border bg-bg px-2 text-[13px] transition-colors duration-150';

  return (
    <nav aria-label={`${set.name} prep set`} className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-border bg-panel px-3 py-1.5 md:px-4">
      <Link to={`/companies/${set.id}`} className="inline-flex items-center gap-1 text-[13px] text-subtle hover:text-fg hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        {set.name} set
      </Link>
      <span className="min-w-0 flex-1 truncate text-[13px] text-subtle">
        <span className="tabular-nums text-fg">{index + 1} of {total}</span>
        {section && <span> · {section.title}</span>}
      </span>
      <div className="flex items-center gap-1.5">
        {prev ? (
          <Link to={href(prev)} className={cn(btn, 'hover:bg-muted')} title={`Previous: ${prev.title} ( [ )`} aria-label={`Previous question: ${prev.title}`}>
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden truncate sm:inline">Previous</span>
          </Link>
        ) : (
          <span className={cn(btn, 'cursor-not-allowed opacity-40')} aria-disabled="true" aria-label="No previous question in this set">
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Previous</span>
          </span>
        )}
        {next ? (
          <Link to={href(next)} className={cn(btn, 'border-accent/50 hover:bg-muted')} title={`Next: ${next.title} ( ] )`} aria-label={`Next question: ${next.title}`}>
            <span className="truncate">Next<span className="hidden md:inline">: {next.title}</span></span>
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        ) : (
          <Link to={`/companies/${set.id}`} className={cn(btn, 'hover:bg-muted')} aria-label={`Last question in the set. Back to ${set.name}`}>
            <span className="truncate">Last one · back to set</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
