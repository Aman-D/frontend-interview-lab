import type { ConsoleEntry, SerializedError, TestCaseResult } from './types';

export type SandboxMode = 'react' | 'dom' | 'js';

export interface SandboxPayload {
  runId: string;
  mode: SandboxMode;
  action: 'preview' | 'test';
  modules: Record<string, string>;
  styles: Record<string, string>;
  html?: string;
  entry?: string;
  testFiles: { path: string; visibility: 'public' | 'hidden' }[];
}

export interface SandboxOutcome {
  timedOut: boolean;
  tests: TestCaseResult[];
  console: ConsoleEntry[];
  runtimeErrors: SerializedError[];
}

/** URL of the sandbox page. Served from /public so it works offline. */
export const SANDBOX_URL = `${import.meta.env.BASE_URL}runner/index.html`;

/**
 * Creates an isolated iframe for one run.
 *
 * Security model:
 *  - `sandbox="allow-scripts allow-forms"` WITHOUT `allow-same-origin` gives the frame an opaque origin, so
 *    candidate code cannot read the app's IndexedDB/localStorage/cookies or touch the parent DOM.
 *  - `allow-forms` is needed so `<form onSubmit>` fires (Chromium drops the submit event without it); a submit
 *    that isn't prevented can only navigate the sandbox frame itself.
 *  - No `allow-popups`, `allow-modals` or `allow-top-navigation`.
 *  - Messages are accepted only when `event.source` is this frame's window.
 *  - Every run gets a fresh frame (no state leaks between runs) and a wall-clock timeout after
 *    which the frame is destroyed.
 */
export function createSandboxFrame(container: HTMLElement, visible: boolean): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts allow-forms');
  iframe.setAttribute('title', visible ? 'Preview' : 'Test sandbox');
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  // Chromium 158+ blocks element.focus() inside a cross-origin (sandboxed, opaque-origin) frame unless the
  // frame has user activation. Focus-management tests call focus() programmatically, so allow it explicitly.
  iframe.setAttribute('allow', 'focus-without-user-activation *');
  iframe.src = SANDBOX_URL;
  if (visible) {
    iframe.className = 'h-full w-full border-0 bg-white';
  } else {
    Object.assign(iframe.style, { position: 'absolute', left: '-10000px', top: '0', width: '1024px', height: '768px', border: '0' });
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
  }
  container.appendChild(iframe);
  return iframe;
}

interface SandboxMessage {
  __fil: true;
  runId: string | null;
  type: 'ready' | 'console' | 'test-result' | 'done' | 'runtime-error';
  level?: ConsoleEntry['level'];
  text?: string;
  error?: SerializedError;
  file?: string;
  visibility?: 'public' | 'hidden';
  name?: string;
  status?: TestCaseResult['status'];
  durationMs?: number;
}

export function runInSandbox(
  iframe: HTMLIFrameElement,
  payload: SandboxPayload,
  opts: { timeoutMs: number; onConsole?: (e: ConsoleEntry) => void; keepListening?: boolean },
): { done: Promise<SandboxOutcome>; dispose: () => void } {
  const outcome: SandboxOutcome = { timedOut: false, tests: [], console: [], runtimeErrors: [] };
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let resolveDone!: (o: SandboxOutcome) => void;
  const done = new Promise<SandboxOutcome>((r) => (resolveDone = r));
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    if (timer) clearTimeout(timer);
    if (!opts.keepListening) window.removeEventListener('message', onMessage);
    resolveDone(outcome);
  };

  const onMessage = (event: MessageEvent<SandboxMessage>) => {
    if (event.source !== iframe.contentWindow) return;
    const msg = event.data;
    if (!msg || msg.__fil !== true) return;
    if (msg.type === 'ready') {
      iframe.contentWindow?.postMessage({ __filHost: true, type: 'run', payload }, '*');
      timer = setTimeout(() => {
        outcome.timedOut = true;
        finish();
      }, opts.timeoutMs);
      return;
    }
    if (msg.runId !== payload.runId) return;
    switch (msg.type) {
      case 'console': {
        const entry: ConsoleEntry = { level: msg.level ?? 'log', text: msg.text ?? '', at: Date.now() };
        outcome.console.push(entry);
        opts.onConsole?.(entry);
        break;
      }
      case 'runtime-error':
        if (msg.error) {
          outcome.runtimeErrors.push(msg.error);
          opts.onConsole?.({ level: 'error', text: `${msg.error.name}: ${msg.error.message}`, at: Date.now() });
        }
        break;
      case 'test-result':
        outcome.tests.push({
          file: msg.file ?? '',
          visibility: msg.visibility ?? 'public',
          name: msg.name ?? '',
          status: msg.status ?? 'error',
          error: msg.error ?? null,
          durationMs: msg.durationMs ?? 0,
          kind: 'runtime',
        });
        break;
      case 'done':
        finish();
        break;
    }
  };
  window.addEventListener('message', onMessage);
  return {
    done,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      window.removeEventListener('message', onMessage);
      finish();
    },
  };
}
