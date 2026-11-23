import { useMemo, useRef, useState } from 'react';
import CommandPalette from './CommandPalette';
import type { Command } from './types';
import './styles.css';

export default function App() {
  const [dark, setDark] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Stable identity: the palette re-ranks only when commands actually change.
  const commands = useMemo<Command[]>(() => {
    const record = (message: string) => () => setLog((prev) => [message, ...prev].slice(0, 5));
    return [
      { id: 'go-dashboard', title: 'Go to dashboard', section: 'Navigation', shortcut: 'G D', run: record('Opened the dashboard') },
      { id: 'go-settings', title: 'Go to settings', section: 'Navigation', shortcut: 'G S', run: record('Opened settings') },
      { id: 'go-billing', title: 'Go to billing', section: 'Navigation', run: record('Opened billing') },
      { id: 'new-doc', title: 'Create new document', section: 'Documents', shortcut: 'N', run: record('Created a document') },
      { id: 'focus-notes', title: 'Focus notes', section: 'Documents', run: () => notesRef.current?.focus() },
      { id: 'export-pdf', title: 'Export as PDF', section: 'Documents', run: record('Exported a PDF') },
      { id: 'toggle-dark', title: 'Toggle dark mode', section: 'Preferences', run: () => setDark((d) => !d) },
      { id: 'toggle-sidebar', title: 'Toggle sidebar', section: 'Preferences', run: () => setSidebar((s) => !s) },
      { id: 'reset-layout', title: 'Reset layout settings', section: 'Preferences', run: () => setSidebar(true) },
      { id: 'deploy', title: 'Deploy to production (no permission)', section: 'Project', disabled: true, run: record('Deployed') },
      { id: 'sign-out', title: 'Sign out', section: 'Account', run: record('Signed out (demo)') },
    ];
  }, []);

  return (
    <div className={'app' + (dark ? ' app-dark' : '')}>
      <header className="app-header">
        <strong>Acme Docs</strong>
        <CommandPalette commands={commands} initialRecentIds={['go-settings']} />
      </header>
      <div className="app-body">
        {sidebar && (
          <nav className="app-sidebar" aria-label="Sidebar">
            <p>Dashboard</p>
            <p>Documents</p>
            <p>Settings</p>
          </nav>
        )}
        <main>
          <p className="hint">
            Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> anywhere, or use the button. Try "set", "tgl", "pdf". The shortcut is
            ignored while you type in the notes below.
          </p>
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" ref={notesRef} rows={4} />
          <h2>Activity</h2>
          <ul>
            {log.length === 0 ? <li>No commands run yet.</li> : log.map((entry, i) => <li key={i}>{entry}</li>)}
          </ul>
        </main>
      </div>
    </div>
  );
}
