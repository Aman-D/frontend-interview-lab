import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import LibraryPage from './pages/Library';
import ProblemDetail from './pages/ProblemDetail';
import ConceptsPage from './pages/Concepts';
import ConceptDetail from './pages/ConceptDetail';
import RevisionPage from './pages/Revision';
import HistoryPage from './pages/History';
import NotesPage from './pages/Notes';
import SourcesPage from './pages/Sources';
import SettingsPage from './pages/Settings';
import NotFound from './pages/NotFound';
import './styles.css';

// Code-heavy routes (Monaco, TypeScript compiler) are loaded on demand.
const Workspace = lazy(() => import('./pages/Workspace'));
const VerifyPage = lazy(() => import('./pages/Verify'));

const fallback = <div className="p-6 text-sm text-subtle">Loading…</div>;

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'library', element: <LibraryPage /> },
      { path: 'problems/:id', element: <ProblemDetail /> },
      { path: 'practice/:id', element: <Suspense fallback={fallback}><Workspace /></Suspense> },
      { path: 'concepts', element: <ConceptsPage /> },
      { path: 'concepts/:id', element: <ConceptDetail /> },
      { path: 'revision', element: <RevisionPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'notes', element: <NotesPage /> },
      { path: 'sources', element: <SourcesPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '__verify', element: <Suspense fallback={fallback}><VerifyPage /></Suspense> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary label="the application">
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
);
