import type * as TS from 'typescript';
import { createLoopGuardTransformer } from './loopGuard';
import type { Diagnostic, FileMap, TestCaseResult } from './types';

/**
 * Pure compiler helpers shared by the browser worker and the Node/Vitest test-suite.
 * Candidate code is only *parsed and type-checked* here — never executed.
 */

const CODE_EXT = /\.(tsx?|jsx?|mjs|cjs)$/;

export interface TranspileOutput {
  modules: FileMap; // path -> CommonJS JS
  styles: FileMap; // path -> CSS
  diagnostics: Diagnostic[]; // syntax errors only
}

export function transpileProject(ts: typeof TS, files: FileMap): TranspileOutput {
  const modules: FileMap = {};
  const styles: FileMap = {};
  const diagnostics: Diagnostic[] = [];
  const guard = createLoopGuardTransformer(ts);
  for (const [path, source] of Object.entries(files)) {
    if (path.endsWith('.css')) {
      styles[path] = source;
      continue;
    }
    if (!CODE_EXT.test(path) || path.endsWith('.d.ts')) continue;
    const out = ts.transpileModule(source, {
      fileName: path,
      reportDiagnostics: true,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        allowJs: true,
        sourceMap: false,
        inlineSourceMap: false,
      },
      transformers: { before: [guard] },
    });
    modules[path] = out.outputText;
    for (const d of out.diagnostics ?? []) diagnostics.push(toDiagnostic(ts, d, path));
  }
  return { modules, styles, diagnostics };
}

export function toDiagnostic(ts: typeof TS, d: TS.Diagnostic, fallbackFile = ''): Diagnostic {
  let line = 1;
  let column = 1;
  if (d.file && d.start !== undefined) {
    const lc = d.file.getLineAndCharacterOfPosition(d.start);
    line = lc.line + 1;
    column = lc.character + 1;
  }
  return {
    file: d.file?.fileName ?? fallbackFile,
    line,
    column,
    message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
    code: d.code,
    category: d.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
  };
}

export const TYPECHECK_LIBS = ['lib.es2022.d.ts', 'lib.dom.d.ts'];

/** Returns lib file names (e.g. "lib.es2015.core.d.ts") referenced by `/// <reference lib>` in a lib file. */
export function referencedLibs(libSource: string): string[] {
  const out: string[] = [];
  const re = /\/\/\/\s*<reference\s+lib="([^"]+)"\s*\/>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(libSource))) out.push(`lib.${m[1].toLowerCase()}.d.ts`);
  return out;
}

export function typecheckProject(ts: typeof TS, files: FileMap, libs: Record<string, string>, rootFiles: string[]): Diagnostic[] {
  const options: TS.CompilerOptions = {
    strict: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    jsx: ts.JsxEmit.ReactJSX,
    lib: TYPECHECK_LIBS,
    skipLibCheck: true,
    noUnusedLocals: false,
    types: [],
  };
  const libPath = (name: string) => `/__lib/${name}`;
  const getText = (fileName: string): string | undefined => {
    if (fileName.startsWith('/__lib/')) return libs[fileName.slice('/__lib/'.length)];
    return files[fileName];
  };
  const sfCache = new Map<string, TS.SourceFile>();
  const host: TS.CompilerHost = {
    getSourceFile: (fileName, languageVersion) => {
      const text = getText(fileName);
      if (text === undefined) return undefined;
      let sf = sfCache.get(fileName);
      if (!sf) {
        sf = ts.createSourceFile(fileName, text, languageVersion, true);
        sfCache.set(fileName, sf);
      }
      return sf;
    },
    getDefaultLibFileName: () => libPath('lib.d.ts'),
    getDefaultLibLocation: () => '/__lib',
    writeFile: () => {},
    getCurrentDirectory: () => '/',
    getDirectories: () => [],
    getCanonicalFileName: (f) => f,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    fileExists: (f) => getText(f) !== undefined,
    readFile: (f) => getText(f),
    directoryExists: (d) => d === '/' || Object.keys(files).some((f) => f.startsWith(d.endsWith('/') ? d : d + '/')),
  };
  const program = ts.createProgram({ rootNames: rootFiles, options, host });
  const diags = [...program.getSyntacticDiagnostics(), ...program.getSemanticDiagnostics(), ...program.getOptionsDiagnostics()];
  return diags
    .filter((d) => !d.file || !d.file.fileName.startsWith('/__lib/'))
    .map((d) => toDiagnostic(ts, d));
}

export interface TypeTestSegment {
  name: string;
  startLine: number; // 1-based, inclusive
  endLine: number; // inclusive
}

/** Splits a type-test file into named cases delimited by `// @test: <name>` comments. */
export function parseTypeTestSegments(source: string): TypeTestSegment[] {
  const lines = source.split('\n');
  const segs: TypeTestSegment[] = [];
  lines.forEach((line, i) => {
    const m = /^\s*\/\/\s*@test:\s*(.+?)\s*$/.exec(line);
    if (m) {
      if (segs.length) segs[segs.length - 1].endLine = i;
      segs.push({ name: m[1], startLine: i + 1, endLine: lines.length });
    }
  });
  return segs;
}

/**
 * Maps compiler diagnostics onto type-test cases. A case passes when the compiler reports no
 * error inside its line range. Unused `@ts-expect-error` directives are compiler errors (TS2578),
 * so "this must NOT compile" cases fail automatically when the candidate's type is too loose.
 */
export function evaluateTypeTests(
  diagnostics: Diagnostic[],
  testFiles: { path: string; source: string; visibility: 'public' | 'hidden' }[],
  solutionFiles: string[],
): TestCaseResult[] {
  const results: TestCaseResult[] = [];
  const solutionErrors = diagnostics.filter((d) => d.category === 'error' && solutionFiles.includes(d.file));
  results.push({
    file: solutionFiles[0] ?? '/solution.ts',
    visibility: 'public',
    name: 'Solution compiles without type errors',
    kind: 'type',
    durationMs: 0,
    status: solutionErrors.length ? 'fail' : 'pass',
    error: solutionErrors.length
      ? { name: 'TypeError', message: solutionErrors.map((d) => `${d.file}:${d.line}:${d.column} TS${d.code}: ${d.message}`).join('\n'), stack: '' }
      : null,
  });
  for (const tf of testFiles) {
    const segs = parseTypeTestSegments(tf.source);
    const fileDiags = diagnostics.filter((d) => d.file === tf.path && d.category === 'error');
    const firstSegLine = segs.length ? segs[0].startLine : Infinity;
    const preamble = fileDiags.filter((d) => d.line < firstSegLine);
    if (preamble.length) {
      results.push({
        file: tf.path,
        visibility: tf.visibility,
        name: '(type test file setup)',
        kind: 'type',
        durationMs: 0,
        status: 'error',
        error: { name: 'TypeError', message: preamble.map((d) => `line ${d.line}: ${d.message}`).join('\n'), stack: '' },
      });
    }
    for (const seg of segs) {
      const inSeg = fileDiags.filter((d) => d.line >= seg.startLine && d.line <= seg.endLine);
      results.push({
        file: tf.path,
        visibility: tf.visibility,
        name: seg.name,
        kind: 'type',
        durationMs: 0,
        status: inSeg.length ? 'fail' : 'pass',
        error: inSeg.length
          ? { name: 'AssertionError', message: inSeg.map((d) => `line ${d.line}: ${d.code === 2578 ? 'Expected a compile error here, but the code compiled (unused @ts-expect-error).' : d.message}`).join('\n'), stack: '' }
          : null,
      });
    }
  }
  return results;
}
