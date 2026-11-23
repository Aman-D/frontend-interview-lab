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

loader.config({ monaco });

export { monaco };
