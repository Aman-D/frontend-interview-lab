import { compiler } from './compilerClient';
import { evaluateTypeTests } from './compilerCore';
import { createSandboxFrame, runInSandbox, type SandboxMode } from './sandbox';
import type { ConsoleEntry, ExecutionType, FileMap, RunResult, TestCaseResult } from './types';

export interface ProjectTestFile {
  path: string;
  source: string;
  visibility: 'public' | 'hidden';
  kind: 'runtime' | 'type';
}

export interface RunnableProject {
  execution: Exclude<ExecutionType, 'output'>;
  files: FileMap; // candidate's editable + read-only files
  entry: string; // e.g. /App.tsx, /script.js, /solution.ts
  testFiles: ProjectTestFile[];
  /** Extra read-only support files available to tests (e.g. /type-utils.ts). */
  supportFiles?: FileMap;
}

const RUN_TIMEOUT_MS = 20000;

function sandboxMode(execution: RunnableProject['execution']): SandboxMode {
  if (execution === 'react') return 'react';
  if (execution === 'dom') return 'dom';
  return 'js';
}

function newRunId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Runs the project's automated tests. Every result reported here was actually executed. */
export async function runTests(project: RunnableProject, host: HTMLElement, onConsole?: (e: ConsoleEntry) => void): Promise<RunResult> {
  const startedAt = Date.now();
  const t0 = performance.now();
  const result: RunResult = { status: 'completed', startedAt, durationMs: 0, tests: [], console: [], diagnostics: [], runtimeErrors: [] };
  const allFiles: FileMap = { ...(project.supportFiles ?? {}), ...project.files };
  try {
    // 1) Type-level tests (TypeScript track): real compiler, no execution.
    const typeTests = project.testFiles.filter((t) => t.kind === 'type');
    if (project.execution === 'ts-types') {
      const tcFiles: FileMap = { ...allFiles };
      for (const t of typeTests) tcFiles[t.path] = t.source;
      const roots = Object.keys(tcFiles).filter((p) => /\.tsx?$/.test(p));
      const { diagnostics } = await compiler.typecheck(tcFiles, roots);
      result.diagnostics.push(...diagnostics);
      const solutionFiles = Object.keys(project.files).filter((p) => /\.tsx?$/.test(p));
      result.tests.push(...evaluateTypeTests(diagnostics, typeTests, solutionFiles));
    }

    // 2) Runtime tests: transpile, then execute in a fresh sandboxed iframe.
    const runtimeTests = project.testFiles.filter((t) => t.kind === 'runtime');
    if (runtimeTests.length) {
      const toCompile: FileMap = { ...allFiles };
      for (const t of runtimeTests) toCompile[t.path] = t.source;
      const out = await compiler.transpile(toCompile);
      if (out.diagnostics.length) {
        result.diagnostics.push(...out.diagnostics);
        result.status = 'compile-error';
        result.message = 'The code has syntax errors, so runtime tests were not executed.';
      } else {
        const iframe = createSandboxFrame(host, false);
        try {
          const run = runInSandbox(
            iframe,
            {
              runId: newRunId(),
              mode: sandboxMode(project.execution),
              action: 'test',
              modules: out.modules,
              styles: out.styles,
              html: allFiles['/index.html'],
              entry: project.entry,
              testFiles: runtimeTests.map((t) => ({ path: t.path, visibility: t.visibility })),
            },
            { timeoutMs: RUN_TIMEOUT_MS, onConsole },
          );
          const o = await run.done;
          result.console.push(...o.console);
          result.runtimeErrors.push(...o.runtimeErrors);
          result.tests.push(...o.tests);
          if (o.timedOut) {
            result.status = 'timeout';
            result.message = `Test run exceeded ${RUN_TIMEOUT_MS / 1000}s and the sandbox was destroyed. Results above (if any) are partial.`;
          }
        } finally {
          iframe.remove();
        }
      }
    }
  } catch (e) {
    result.status = 'internal-error';
    result.message = `The runner failed: ${(e as Error).message}`;
  }
  result.durationMs = Math.round(performance.now() - t0);
  return result;
}

export interface PreviewHandle {
  iframe: HTMLIFrameElement;
  dispose: () => void;
  diagnostics: RunResult['diagnostics'];
}

/** Renders the candidate's project in a visible sandboxed iframe (React / DOM) or runs it for console output (JS). */
export async function startPreview(project: RunnableProject, container: HTMLElement, onConsole: (e: ConsoleEntry) => void): Promise<PreviewHandle> {
  const allFiles: FileMap = { ...(project.supportFiles ?? {}), ...project.files };
  const out = await compiler.transpile(allFiles);
  container.innerHTML = '';
  const iframe = createSandboxFrame(container, project.execution !== 'js' && project.execution !== 'ts-types');
  if (out.diagnostics.length) {
    return { iframe, dispose: () => iframe.remove(), diagnostics: out.diagnostics };
  }
  const run = runInSandbox(
    iframe,
    {
      runId: newRunId(),
      mode: sandboxMode(project.execution),
      action: 'preview',
      modules: out.modules,
      styles: out.styles,
      html: allFiles['/index.html'],
      entry: project.entry,
      testFiles: [],
    },
    { timeoutMs: RUN_TIMEOUT_MS, onConsole, keepListening: true },
  );
  return {
    iframe,
    diagnostics: [],
    dispose: () => {
      run.dispose();
      iframe.remove();
    },
  };
}

export function countByStatus(tests: TestCaseResult[]) {
  return {
    pass: tests.filter((t) => t.status === 'pass').length,
    fail: tests.filter((t) => t.status === 'fail').length,
    error: tests.filter((t) => t.status === 'error').length,
  };
}
