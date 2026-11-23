import { useLiveQuery } from 'dexie-react-hooks';
import { Download, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '@/components/Layout';
import { Button, EmptyState, Input, Select } from '@/components/ui';
import { QUESTION_BY_ID } from '@/content';
import { db } from '@/db/db';
import { repo } from '@/db/repo';
import { NOTE_CATEGORIES, type NoteCategory } from '@/db/types';
import { downloadText, notesToMarkdown } from '@/lib/notesExport';
import { NoteEditor } from '@/workspace/NotesPanel';

export default function NotesPage() {
  const notes = useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray(), []);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<NoteCategory | ''>('');
  const [onlyReminders, setOnlyReminders] = useState(false);
  const s = search.toLowerCase().trim();
  const visible = (notes ?? []).filter(
    (n) =>
      (!s || `${n.title} ${n.body} ${n.problemId ?? ''}`.toLowerCase().includes(s)) &&
      (!cat || n.category === cat) &&
      (!onlyReminders || n.reminderAt !== undefined),
  );
  const due = (notes ?? []).filter((n) => n.reminderAt && n.reminderAt <= Date.now());
  const titleFor = (id?: string) => (id ? QUESTION_BY_ID[id]?.title ?? id : 'General');

  return (
    <Page
      title="Notes"
      description="All your notes across problems and attempts. Markdown with code snippets; saved automatically in this browser."
      actions={
        <Button disabled={!notes?.length} onClick={() => downloadText('frontend-interview-lab-notes.md', notesToMarkdown(visible, 'Frontend Interview Lab — notes', (n) => titleFor(n.problemId)))}>
          <Download className="h-4 w-4" aria-hidden /> Export shown notes (.md)
        </Button>
      }
    >
      {due.length > 0 && <p className="mb-3 rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">{due.length} revision reminder(s) are due.</p>}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[240px] flex-1">
          <span className="sr-only">Search notes</span>
          <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-subtle" aria-hidden />
          <Input className="w-full pl-8" placeholder="Search notes…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <Select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value as NoteCategory | '')}>
          <option value="">All categories</option>
          {NOTE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Select>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={onlyReminders} onChange={(e) => setOnlyReminders(e.target.checked)} /> With reminders</label>
        <Button variant="primary" onClick={() => repo.saveNote({ category: 'insight', title: 'New note', body: '' })}>New general note</Button>
      </div>
      {!visible.length ? (
        <EmptyState title={notes?.length ? 'No notes match' : 'No notes yet'}>Add notes from the Notes tab in any practice workspace.</EmptyState>
      ) : (
        <ul className="space-y-4">
          {visible.map((n) => (
            <li key={n.id}>
              <p className="mb-1 text-xs text-subtle">
                {n.problemId ? <Link className="text-accent hover:underline" to={`/problems/${n.problemId}`}>{titleFor(n.problemId)}</Link> : 'General'}
                {n.reminderAt ? ` · reminder ${new Date(n.reminderAt).toLocaleDateString()}` : ''}
              </p>
              <NoteEditor note={n} onDelete={() => repo.deleteNote(n.id)} />
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
