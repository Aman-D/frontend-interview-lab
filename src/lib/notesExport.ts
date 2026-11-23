import { NOTE_CATEGORIES, type Note } from '@/db/types';

const label = (c: Note['category']) => NOTE_CATEGORIES.find((x) => x.id === c)?.label ?? c;

export function notesToMarkdown(notes: Note[], heading: string, titleFor?: (n: Note) => string): string {
  const lines = [`# ${heading}`, '', `_Exported ${new Date().toISOString()} from Frontend Interview Lab_`, ''];
  for (const n of notes) {
    lines.push(`## ${n.title || 'Untitled note'}`);
    const meta = [label(n.category), titleFor?.(n), `updated ${new Date(n.updatedAt).toISOString().slice(0, 10)}`, n.reminderAt ? `reminder ${new Date(n.reminderAt).toISOString().slice(0, 10)}` : null].filter(Boolean);
    lines.push(`_${meta.join(' · ')}_`, '', n.body.trim(), '');
  }
  return lines.join('\n');
}

export function downloadText(filename: string, text: string, type = 'text/markdown') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
