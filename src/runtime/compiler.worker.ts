/// <reference lib="webworker" />
import ts from 'typescript';
import { referencedLibs, transpileProject, typecheckProject, TYPECHECK_LIBS } from './compilerCore';
import type { FileMap } from './types';

// Lazily-loaded TypeScript lib .d.ts files (bundled locally — works offline).
const libLoaders = import.meta.glob('/node_modules/typescript/lib/lib.*.d.ts', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;
const libs: Record<string, string> = {};

async function ensureLibs(): Promise<Record<string, string>> {
  const queue = [...TYPECHECK_LIBS];
  while (queue.length) {
    const name = queue.shift()!;
    if (libs[name] !== undefined) continue;
    const loader = libLoaders[`/node_modules/typescript/lib/${name}`];
    if (!loader) { libs[name] = ''; continue; }
    const text = await loader();
    libs[name] = text;
    queue.push(...referencedLibs(text));
  }
  return libs;
}

export type CompilerRequest =
  | { id: number; type: 'transpile'; files: FileMap }
  | { id: number; type: 'typecheck'; files: FileMap; rootFiles: string[] };

self.onmessage = async (e: MessageEvent<CompilerRequest>) => {
  const req = e.data;
  try {
    if (req.type === 'transpile') {
      const out = transpileProject(ts, req.files);
      (self as unknown as Worker).postMessage({ id: req.id, ok: true, result: out });
    } else if (req.type === 'typecheck') {
      const l = await ensureLibs();
      const diagnostics = typecheckProject(ts, req.files, l, req.rootFiles);
      (self as unknown as Worker).postMessage({ id: req.id, ok: true, result: { diagnostics } });
    }
  } catch (err) {
    (self as unknown as Worker).postMessage({ id: req.id, ok: false, error: String((err as Error)?.stack ?? err) });
  }
};
