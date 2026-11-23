import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import reactTypes from '../../node_modules/@types/react/index.d.ts?raw';
import reactGlobal from '../../node_modules/@types/react/global.d.ts?raw';
import reactJsxRuntime from '../../node_modules/@types/react/jsx-runtime.d.ts?raw';
import reactDomClient from '../../node_modules/@types/react-dom/client.d.ts?raw';
import reactDom from '../../node_modules/@types/react-dom/index.d.ts?raw';
import csstype from '../../node_modules/csstype/index.d.ts?raw';
import propTypes from '../../node_modules/@types/prop-types/index.d.ts?raw';
import harnessGlobals from '../runtime/harness-globals.d.txt?raw';

// Bundled Monaco (no CDN) so the editor works offline.
self.MonacoEnvironment = {
  getWorker(_id: string, label: string) {
    if (label === 'typescript' || label === 'javascript') return new TsWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker();
    if (label === 'html') return new HtmlWorker();
    if (label === 'json') return new JsonWorker();
    return new EditorWorker();
  },
};

const ts = monaco.languages.typescript;
const compilerOptions = {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  jsx: ts.JsxEmit.ReactJSX,
  allowJs: true,
  checkJs: false,
  strict: true,
  esModuleInterop: true,
  allowNonTsExtensions: true,
  skipLibCheck: true,
};
ts.typescriptDefaults.setCompilerOptions(compilerOptions);
ts.javascriptDefaults.setCompilerOptions(compilerOptions);
ts.typescriptDefaults.setEagerModelSync(true);

const libs: [string, string][] = [
  ['file:///node_modules/@types/react/index.d.ts', reactTypes],
  ['file:///node_modules/@types/react/global.d.ts', reactGlobal],
  ['file:///node_modules/@types/react/jsx-runtime.d.ts', reactJsxRuntime],
  ['file:///node_modules/@types/react-dom/index.d.ts', reactDom],
  ['file:///node_modules/@types/react-dom/client.d.ts', reactDomClient],
  ['file:///node_modules/csstype/index.d.ts', csstype],
  ['file:///node_modules/@types/prop-types/index.d.ts', propTypes],
  ['file:///harness-globals.d.ts', harnessGlobals],
];
for (const [path, content] of libs) {
  ts.typescriptDefaults.addExtraLib(content, path);
  ts.javascriptDefaults.addExtraLib(content, path);
}

// Editor themes matching the app palette (graphite + orange accent used only for the cursor/selection marks).
monaco.editor.defineTheme('fil-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '8a8c91', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'ff8a66' },
    { token: 'string', foreground: 'a8d4a0' },
    { token: 'number', foreground: 'e5c07b' },
    { token: 'type', foreground: '8fc6ff' },
  ],
  colors: {
    'editor.background': '#1e1f22',
    'editor.foreground': '#e6e7e9',
    'editorLineNumber.foreground': '#5c5e63',
    'editorLineNumber.activeForeground': '#c9cacd',
    'editor.lineHighlightBackground': '#25272a',
    'editor.selectionBackground': '#ff4a1f33',
    'editor.inactiveSelectionBackground': '#ff4a1f1f',
    'editorCursor.foreground': '#ff6a45',
    'editorIndentGuide.background1': '#2c2e32',
    'editorWidget.background': '#222427',
    'editorWidget.border': '#34363a',
    'scrollbarSlider.background': '#34363a88',
  },
});
monaco.editor.defineTheme('fil-light', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '74767b', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'b8320e' },
    { token: 'string', foreground: '2f7a3a' },
    { token: 'number', foreground: '8a5a00' },
    { token: 'type', foreground: '1f5fa8' },
  ],
  colors: {
    'editor.background': '#fbfbfb',
    'editor.foreground': '#18191b',
    'editorLineNumber.foreground': '#a3a5a9',
    'editorLineNumber.activeForeground': '#3a3b3e',
    'editor.lineHighlightBackground': '#f1f1f2',
    'editor.selectionBackground': '#ff4a1f26',
    'editorCursor.foreground': '#b8320e',
    'editorIndentGuide.background1': '#e6e7e8',
  },
});

loader.config({ monaco });

export { monaco };
