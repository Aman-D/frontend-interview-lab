export type ExecutionType = 'react' | 'dom' | 'js' | 'ts-types' | 'output';

/** A virtual project: absolute POSIX-like paths ("/App.tsx") → file contents. */
export type FileMap = Record<string, string>;

export interface Diagnostic {
  file: string;
  line: number; // 1-based
  column: number; // 1-based
  message: string;
  code?: number;
  category: 'error' | 'warning';
}

export interface ConsoleEntry {
  level: 'log' | 'info' | 'warn' | 'error';
  text: string;
  at: number;
}

export interface SerializedError {
  name: string;
  message: string;
  stack: string;
}

export type TestStatus = 'pass' | 'fail' | 'error';

export interface TestCaseResult {
  file: string;
  visibility: 'public' | 'hidden';
  name: string;
  status: TestStatus;
  error?: SerializedError | null;
  durationMs: number;
  kind: 'runtime' | 'type';
}

export type RunStatus = 'completed' | 'compile-error' | 'timeout' | 'runtime-error' | 'internal-error';

export interface RunResult {
  status: RunStatus;
  startedAt: number;
  durationMs: number;
  tests: TestCaseResult[];
  console: ConsoleEntry[];
  diagnostics: Diagnostic[];
  runtimeErrors: SerializedError[];
  /** Human-readable reason for a non-completed status. */
  message?: string;
}

export interface TestFileSpec {
  path: string;
  visibility: 'public' | 'hidden';
  /** 'runtime' files are executed in the sandbox; 'type' files are only type-checked. */
  kind: 'runtime' | 'type';
}

export function summarize(result: RunResult) {
  const total = result.tests.length;
  const passed = result.tests.filter((t) => t.status === 'pass').length;
  const pub = result.tests.filter((t) => t.visibility === 'public');
  const hid = result.tests.filter((t) => t.visibility === 'hidden');
  return {
    total,
    passed,
    publicTotal: pub.length,
    publicPassed: pub.filter((t) => t.status === 'pass').length,
    hiddenTotal: hid.length,
    hiddenPassed: hid.filter((t) => t.status === 'pass').length,
    allPassed: result.status === 'completed' && total > 0 && passed === total,
  };
}
