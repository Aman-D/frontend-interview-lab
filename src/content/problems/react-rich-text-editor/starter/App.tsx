import { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import { toHTML } from './model';
import type { Doc } from './types';
import './styles.css';

const INITIAL: Doc = [
  { text: 'Release notes: ', marks: ['bold'] },
  { text: 'select text and press ', marks: [] },
  { text: 'Ctrl/⌘+B', marks: ['italic'] },
  { text: ', or use the toolbar.', marks: [] },
];

export default function App() {
  const [doc, setDoc] = useState<Doc>(INITIAL);
  const html = toHTML(doc);
  return (
    <main className="app">
      <h1>Write an update</h1>
      <RichTextEditor label="Release notes" defaultValue={INITIAL} onChange={setDoc} placeholder="Start typing…" />
      <h2>Serialised HTML</h2>
      <pre className="html-out">{html}</pre>
      <h2>Rendered from the HTML</h2>
      {/* Safe only because toHTML escapes all text — the model never contains markup. */}
      <div className="html-preview" dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
