import { BookOpen, FileSearch, History, LayoutDashboard, Library, Moon, NotebookPen, PanelLeftClose, PanelLeftOpen, RotateCcw, Settings, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, matchPath, NavLink, Outlet, useLocation } from 'react-router-dom';
import { QUESTION_BY_ID } from '@/content';
import { ErrorBoundary } from './ErrorBoundary';
import { QuestionNav } from './QuestionNav';
import { cn } from './ui';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/library', label: 'Problem Library', icon: Library },
  { to: '/concepts', label: 'Concepts', icon: BookOpen },
  { to: '/revision', label: 'Revision Queue', icon: RotateCcw },
  { to: '/history', label: 'Attempt History', icon: History },
  { to: '/notes', label: 'Notes', icon: NotebookPen },
  { to: '/sources', label: 'Research Sources', icon: FileSearch },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('fil-theme', dark ? 'dark' : 'light');
    } catch {
      /* storage unavailable */
    }
  }, [dark]);
  return [dark, setDark] as const;
}

export function Layout() {
  const location = useLocation();
  const inWorkspace = location.pathname.startsWith('/practice/');
  const questionMatch = matchPath('/practice/:id', location.pathname) ?? matchPath('/problems/:id', location.pathname);
  const questionId = questionMatch?.params.id && QUESTION_BY_ID[questionMatch.params.id] ? questionMatch.params.id : null;
  // The collapse choice is remembered (per browser) instead of being forced by the route.
  const [collapsed, setCollapsedState] = useState(() => {
    try {
      return localStorage.getItem('fil-sidebar-collapsed') === '1';
    } catch {
      return false;
    }
  });
  const setCollapsed = (fn: (c: boolean) => boolean) =>
    setCollapsedState((c) => {
      const next = fn(c);
      try {
        localStorage.setItem('fil-sidebar-collapsed', next ? '1' : '0');
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  const [dark, setDark] = useTheme();
  // On narrow screens the sidebar is an icon rail that opens as an overlay, so content keeps the width.
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const [overlayOpen, setOverlayOpen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  useEffect(() => {
    setOverlayOpen(false);
  }, [location.pathname]);
  const isCollapsed = narrow ? !overlayOpen : collapsed;
  const toggle = () => (narrow ? setOverlayOpen((o) => !o) : setCollapsed((c) => !c));

  return (
    <div className="flex h-full">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-panel focus:p-2">
        Skip to content
      </a>
      {narrow && overlayOpen && <button aria-label="Close menu" className="fixed inset-0 z-30 bg-black/50" onClick={() => setOverlayOpen(false)} />}
      {narrow && <div className="w-12 shrink-0" aria-hidden />}
      <aside
        className={cn(
          'flex shrink-0 flex-col border-r border-border bg-panel transition-[width] duration-200',
          isCollapsed ? 'w-12' : 'w-60',
          narrow && 'fixed inset-y-0 left-0 z-40 shadow-2xl',
        )}
      >
        <div className={cn('flex h-14 items-center border-b border-border', isCollapsed ? 'justify-center' : 'justify-between px-3.5')}>
          {!isCollapsed && (
            <Link to="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              <span aria-hidden className="grid h-6 w-6 place-items-center rounded bg-accent font-mono text-[13px] font-bold text-accent-ink">F</span>
              Interview Lab
            </Link>
          )}
          <button className="rounded p-1 text-subtle hover:bg-muted" onClick={toggle} aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        <nav aria-label="Main" className={cn(!questionId && 'flex-1')}>
        <ul className={cn('space-y-0.5 p-1.5', questionId && !isCollapsed && 'grid grid-cols-1')}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                title={isCollapsed ? label : undefined}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors duration-150',
                    isActive ? 'bg-muted font-medium text-fg before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded before:bg-accent' : 'text-subtle hover:bg-muted/70 hover:text-fg',
                    isCollapsed && 'justify-center',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className={cn(isCollapsed && 'sr-only')}>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        </nav>
        {questionId && <QuestionNav currentId={questionId} view={inWorkspace ? 'practice' : 'problems'} collapsed={isCollapsed} />}
        {questionId && isCollapsed && <div className="flex-1" />}
        <div className="border-t border-border p-1.5">
          <button
            onClick={() => setDark((d) => !d)}
            className={cn('flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-sm text-subtle transition-colors hover:bg-muted hover:text-fg', isCollapsed && 'justify-center')}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
            {!isCollapsed && <span>{dark ? 'Light mode' : 'Dark mode'}</span>}
          </button>
        </div>
      </aside>
      <main id="main" className={cn('min-w-0 flex-1', inWorkspace ? 'overflow-hidden' : 'overflow-y-auto')}>
        <ErrorBoundary label="this page" key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}

export function Page({ title, description, actions, children, wide }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    document.title = `${title} · Frontend Interview Lab`;
  }, [title]);
  return (
    <div className={cn('mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-10', wide ? 'max-w-[1400px]' : 'max-w-6xl')}>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[26px] font-medium leading-tight tracking-tight">{title}</h1>
          {description && <div className="mt-1.5 max-w-3xl text-[15px] text-subtle">{description}</div>}
        </div>
        {actions}
      </header>
      {children}
    </div>
  );
}
