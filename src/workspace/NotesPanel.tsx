import { useLiveQuery } from 'dexie-react-hooks';
import { Download, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Markdown } from '@/components/Markdown';
import { Button, Input, Select, Textarea, cn } from '@/components/ui';
import { db } from '@/db/db';
import { repo } from '@/db/repo';
import { NOTE_CATEGORIES, type Note, type NoteCategory } from '@/db/types';
import { downloadText, notesToMarkdown } from '@/lib/notesExport';

function toDateInput(ms?: number) {
  return ms ? new Date(ms).toISOString().slice(0, 10) : '';
}

export function NoteEditor({ note, onDelete }: { note: Note; onDelete?: () => void }) {
  const [draft, setDraft] = useState(note);
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(true);
  const first = useRef(true);
  useEffect(() => {
    setDraft(note);
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Autosave (debounced)
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaved(false);
    const t = setTimeout(() => repo.saveNote(draft).then(() => setSaved(true)), 500);
    return () => clearTimeout(t);
  }, [draft]);
  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input aria-label="Note title" className="min-w-[160px] flex-1" value={draft.title} placeholder="Title" onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <Select aria-label="Note category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as NoteCategory })}>
          {NOTE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Select>
        <label className="flex items-center gap-1 text-xs text-subtle">
          Remind on
          <Input
            type="date"
            className="h-7 text-xs"
            value={toDateInput(draft.reminderAt)}
            onChange={(e) => setDraft({ ...draft, reminderAt: e.target.value ? new Date(e.target.value + 'T09:00:00').getTime() : undefined })}
          />
        </label>
        <Button size="sm" variant="ghost" aria-pressed={preview} onClick={() => setPreview((p) => !p)}>{preview ? 'Edit' : 'Preview'}</Button>
        {onDelete && (
          <Button size="sm" variant="ghost" aria-label="Delete note" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
        )}
      </div>
      {preview ? (
        <div className="min-h-[120px] rounded-md border border-border p-2.5 text-sm">{draft.body ? <Markdown>{draft.body}</Markdown> : <span className="text-subtle">Nothing to preview.</span>}</div>
      ) : (
        <Textarea
          aria-label="Note body (Markdown)"
          className="min-h-[140px] font-mono text-[13px]"
          placeholder={'Markdown supported.\n\n```js\n// code snippets too\n```'}
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        />
      )}
      <p className="text-[11px] text-subtle" aria-live="polite">{saved ? `Saved · ${new Date(draft.updatedAt).toLocaleString()}` : 'Saving…'}</p>
    </div>
  );
}

export function NotesPanel({ problemId, attemptId, title }: { problemId: string; attemptId?: string; title: string }) {
  const notes = useLiveQuery(() => db.notes.where('problemId').equals(problemId).reverse().sortBy('updatedAt'), [problemId]);
  const [filter, setFilter] = useState<NoteCategory | 'all'>('all');
  const add = async () => {
    await repo.saveNote({ problemId, attemptId, category: 'explanation', title: '', body: '' });
  };
  const visible = (notes ?? []).filter((n) => filter === 'all' || n.category === filter);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary" onClick={add}><Plus className="h-3.5 w-3.5" aria-hidden /> New note</Button>
        <Select aria-label="Filter notes by category" value={filter} onChange={(e) => setFilter(e.target.value as NoteCategory | 'all')} className="h-7 text-xs">
          <option value="all">All categories</option>
          {NOTE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Select>
        <Button size="sm" variant="ghost" disabled={!notes?.length} onClick={() => downloadText(`${problemId}-notes.md`, notesToMarkdown(notes ?? [], title))}>
          <Download className="h-3.5 w-3.5" aria-hidden /> Export .md
        </Button>
        <span className="text-xs text-subtle">Notes persist across attempts and reloads (IndexedDB).</span>
      </div>
      {visible.length === 0 && <p className="text-sm text-subtle">No notes yet.</p>}
      <div className={cn('space-y-3')}>
        {visible.map((n) => (
          <NoteEditor key={n.id} note={n} onDelete={() => repo.deleteNote(n.id)} />
        ))}
      </div>
    </div>
  );
}
