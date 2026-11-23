import { BookOpen, ClipboardList, FileSearch, History, LayoutDashboard, Library, Moon, NotebookPen, PanelLeftClose, PanelLeftOpen, RotateCcw, Settings, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { matchPath, NavLink, Outlet, useLocation } from 'react-router-dom';
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

  return (
    <div className="flex h-full">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-panel focus:p-2">
        Skip to content
      </a>
      <aside className={cn('flex shrink-0 flex-col border-r border-border bg-panel transition-[width]', collapsed ? 'w-12' : 'w-56')}>
        <div className={cn('flex h-12 items-center border-b border-border', collapsed ? 'justify-center' : 'justify-between px-3')}>
          {!collapsed && (
            <span className="flex items-center gap-2 text-sm font-semibold">
              <ClipboardList className="h-4 w-4 text-accent" aria-hidden /> Interview Lab
            </span>
          )}
          <button className="rounded p-1 text-subtle hover:bg-muted" onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        <nav aria-label="Main" className={cn(!questionId && 'flex-1')}>
        <ul className={cn('space-y-0.5 p-1.5', questionId && !collapsed && 'grid grid-cols-1')}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  cn('flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm', isActive ? 'bg-accent/10 font-medium text-accent' : 'text-subtle hover:bg-muted hover:text-fg', collapsed && 'justify-center')
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className={cn(collapsed && 'sr-only')}>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        </nav>
        {questionId && <QuestionNav currentId={questionId} view={inWorkspace ? 'practice' : 'problems'} collapsed={collapsed} />}
        {questionId && collapsed && <div className="flex-1" />}
        <div className="border-t border-border p-1.5">
          <button
            onClick={() => setDark((d) => !d)}
            className={cn('flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-subtle hover:bg-muted', collapsed && 'justify-center')}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
            {!collapsed && <span>{dark ? 'Light mode' : 'Dark mode'}</span>}
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

export function Page({ title, description, actions, children }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode }) {
  useEffect(() => {
    document.title = `${title} · Frontend Interview Lab`;
  }, [title]);
  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-subtle">{description}</p>}
        </div>
        {actions}
      </header>
      {children}
    </div>
  );
}
