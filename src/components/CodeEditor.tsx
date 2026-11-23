import Editor, { DiffEditor } from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import { monaco } from './monacoSetup';

export function languageFor(path: string): string {
  if (/\.tsx?$/.test(path)) return 'typescript';
  if (/\.jsx?$/.test(path)) return 'javascript';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.md')) return 'markdown';
  return 'plaintext';
}

function useIsDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export interface CodeEditorProps {
  /** Unique model path, e.g. "file:///react-autocomplete/Autocomplete.tsx". Keeps per-file undo history. */
  modelPath: string;
  path: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  height?: string | number;
  fontSize?: number;
  /** Other files of the project (model path → content) so imports between files type-check in the editor. */
  siblingModels?: Record<string, string>;
}

export default function CodeEditor({ modelPath, path, value, onChange, readOnly, height = '100%', fontSize = 13, siblingModels }: CodeEditorProps) {
  const dark = useIsDark();
  useEffect(() => {
    if (!siblingModels) return;
    for (const [uri, content] of Object.entries(siblingModels)) {
      if (uri === modelPath) continue;
      const u = monaco.Uri.parse(uri);
      const existing = monaco.editor.getModel(u);
      if (!existing) monaco.editor.createModel(content, languageFor(uri), u);
      else if (existing.getValue() !== content) existing.setValue(content);
    }
  }, [siblingModels, modelPath]);
  return (
    <Editor
      path={modelPath}
      language={languageFor(path)}
      value={value}
      onChange={(v) => onChange?.(v ?? '')}
      theme={dark ? 'fil-dark' : 'fil-light'}
      height={height}
      loading={<div className="p-4 text-sm text-subtle">Loading editor…</div>}
      options={{
        readOnly,
        fontSize,
        fontFamily: "'JetBrains Mono Variable', ui-monospace, Menlo, monospace",
        fontLigatures: false,
        lineHeight: 1.6,
        padding: { top: 10 },
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        tabSize: 2,
        automaticLayout: true,
        wordWrap: 'on',
        renderWhitespace: 'selection',
        fixedOverflowWidgets: true,
        domReadOnly: readOnly,
      }}
    />
  );
}

export function CodeDiff({ original, modified, path, height = 420 }: { original: string; modified: string; path: string; height?: number }) {
  const dark = useIsDark();
  return (
    <DiffEditor
      original={original}
      modified={modified}
      language={languageFor(path)}
      theme={dark ? 'fil-dark' : 'fil-light'}
      height={height}
      options={{ readOnly: true, renderSideBySide: true, minimap: { enabled: false }, automaticLayout: true }}
    />
  );
}
