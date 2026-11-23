import type { Diagnostic, FileMap } from './types';
import type { TranspileOutput } from './compilerCore';

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./compiler.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; ok: boolean; result?: unknown; error?: string }>) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      if (e.data.ok) p.resolve(e.data.result);
      else p.reject(new Error(e.data.error));
    };
    worker.onerror = (e) => {
      for (const p of pending.values()) p.reject(new Error(`Compiler worker failed: ${e.message}`));
      pending.clear();
      worker = null;
    };
  }
  return worker;
}

function call<T>(msg: Record<string, unknown>): Promise<T> {
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    getWorker().postMessage({ ...msg, id });
  });
}

export const compiler = {
  transpile: (files: FileMap) => call<TranspileOutput>({ type: 'transpile', files }),
  typecheck: (files: FileMap, rootFiles: string[]) => call<{ diagnostics: Diagnostic[] }>({ type: 'typecheck', files, rootFiles }),
};
