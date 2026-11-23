import { Download, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Page, useTheme } from '@/components/Layout';
import { Button, Card, CardHeader, Dialog } from '@/components/ui';
import { validateContent } from '@/content';
import { CONTENT_SCHEMA_VERSION } from '@/content/schema';
import { db, DB_VERSION } from '@/db/db';
import { repo } from '@/db/repo';
import { downloadText } from '@/lib/notesExport';

const SHORTCUTS: [string, string][] = [
  ['Ctrl/⌘ + Enter', 'Run all tests (workspace)'],
  ['Ctrl/⌘ + Shift + Enter', 'Run code / refresh preview'],
  ['Ctrl/⌘ + S', 'Save now (autosave is always on)'],
  ['Ctrl/⌘ + Shift + M', 'Maximise / restore the editor'],
  ['← → Home End', 'Move between tabs in any tab list'],
];

export default function SettingsPage() {
  const [dark, setDark] = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const validation = validateContent();

  return (
    <Page title="Settings">
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader title="Appearance" />
          <div className="p-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Dark mode</label>
          </div>
        </Card>
        <Card>
          <CardHeader title="Keyboard shortcuts" />
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 p-4 text-sm">
            {SHORTCUTS.map(([k, v]) => (
              <div key={k} className="contents"><dt className="font-mono text-xs">{k}</dt><dd className="text-subtle">{v}</dd></div>
            ))}
          </dl>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader title="Your data" />
          <div className="space-y-3 p-4 text-sm">
            <p className="text-subtle">Everything (attempts, code drafts, notes, progress, answers) is stored locally in this browser's IndexedDB. Nothing is sent to a server. Export regularly if you switch browsers or clear site data.</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={async () => {
                  const data = await repo.exportAll();
                  downloadText(`frontend-interview-lab-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
                }}
              >
                <Download className="h-4 w-4" aria-hidden /> Export all data (JSON)
              </Button>
              <label className="flex items-center gap-1.5">
                Import mode
                <select className="h-8 rounded-md border border-border bg-panel px-2" value={importMode} onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}>
                  <option value="merge">Merge (keep existing, overwrite same ids)</option>
                  <option value="replace">Replace everything</option>
                </select>
              </label>
              <Button onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" aria-hidden /> Import…</Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  try {
                    const { counts } = await repo.importAll(JSON.parse(await file.text()), importMode);
                    setMsg({ ok: true, text: `Imported: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}.` });
                  } catch (err) {
                    setMsg({ ok: false, text: (err as Error).message });
                  }
                }}
              />
              <Button variant="danger" onClick={() => setConfirmReset(true)}>Delete all data…</Button>
            </div>
            {msg && <p role="status" className={msg.ok ? 'text-ok' : 'text-bad'}>{msg.text}</p>}
          </div>
        </Card>
        <Card>
          <CardHeader title="Coding sandbox" />
          <div className="space-y-2 p-4 text-sm text-subtle">
            <p>Your code runs in a fresh <code>&lt;iframe sandbox="allow-scripts allow-forms"&gt;</code> without <code>allow-same-origin</code>: it gets an opaque origin and cannot read this app's storage, cookies or DOM. It communicates only via <code>postMessage</code>.</p>
            <p>TypeScript/JSX is compiled by the bundled TypeScript compiler in a Web Worker. Loops are instrumented with a guard that aborts code blocking the thread for more than 3 s; each run has a 20 s wall-clock limit after which the sandbox is destroyed.</p>
            <p>Everything (editor, compiler, React runtime) is bundled locally, so practice works offline.</p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Versions & content checks" />
          <div className="space-y-1 p-4 text-sm">
            <p>Content schema v{CONTENT_SCHEMA_VERSION} · database v{DB_VERSION}</p>
            <p className={validation.ok ? 'text-ok' : 'text-bad'}>{validation.ok ? 'All bundled content passes schema validation.' : `${validation.errors.length} content error(s):`}</p>
            {!validation.ok && <ul className="list-disc pl-5 text-xs text-bad">{validation.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
          </div>
        </Card>
      </div>
      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Delete all local data?"
        footer={
          <>
            <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={async () => {
                await Promise.all(db.tables.map((t) => t.clear()));
                setConfirmReset(false);
                setMsg({ ok: true, text: 'All local data deleted.' });
              }}
            >
              Delete everything
            </Button>
          </>
        }
      >
        <p className="text-sm">This permanently removes all attempts, code drafts, notes and progress from this browser. Export first if you might want them back.</p>
      </Dialog>
    </Page>
  );
}
