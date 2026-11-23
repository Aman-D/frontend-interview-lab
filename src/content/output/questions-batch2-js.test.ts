import { runInNewContext } from 'node:vm';
import { CONCEPT_BY_ID } from '../concepts';
import { OutputQuestion } from '../schema';
import { SOURCE_BY_ID } from '../sources';
import { OUTPUT_QUESTIONS_DATA } from './questions';
import { OUTPUT_QUESTIONS_BATCH2_JS } from './questions-batch2-js';

const EXPECTED_IDS = [
  'out-generator-two-way-next',
  'out-generator-return-finally',
  'out-return-await-vs-return',
  'out-await-thenable-ticks',
  'out-race-allsettled-shape',
  'out-promise-finally-override',
  'out-nested-timers-microtasks',
  'out-proxy-reflect-traps',
  'out-inherited-setter-assignment',
  'out-define-property-flags',
  'out-property-key-order',
  'out-json-stringify-edge-cases',
  'out-parseint-radix-map',
  'out-sparse-array-holes',
  'out-default-sort-pitfalls',
  'out-floating-point-tofixed',
  'out-class-private-static-super',
  'out-structured-clone-limits',
  'out-counter-factory-shared-state',
  'out-nullish-vs-or-falsy',
];

function capturingConsole() {
  const lines: string[] = [];
  const log = (...args: unknown[]) => {
    lines.push(args.map((a) => (typeof a === 'string' ? a : String(a))).join(' '));
  };
  return { lines, console: { log } };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Runs the snippet in a fresh V8 context. `Promise`, `Proxy`, `Reflect`, `JSON`, `Map`, etc. are the
 * context's own intrinsics (deliberately not injected from the outer realm, so `await` on a promise
 * takes the native fast path exactly as in a real script). Only host APIs are injected.
 */
async function execute(q: OutputQuestion): Promise<string[]> {
  const cap = capturingConsole();
  runInNewContext(q.code, {
    console: cap.console,
    setTimeout,
    clearTimeout,
    queueMicrotask,
    structuredClone: globalThis.structuredClone,
  });
  await wait(100);
  return cap.lines;
}

describe('output questions — batch 2 (JavaScript)', () => {
  it('contains exactly the catalog ids, once each, with no collision with batch 1', () => {
    const ids = OUTPUT_QUESTIONS_BATCH2_JS.map((q) => q.id);
    expect([...ids].sort()).toEqual([...EXPECTED_IDS].sort());
    expect(new Set(ids).size).toBe(ids.length);
    const existing = new Set(OUTPUT_QUESTIONS_DATA.map((q) => q.id));
    for (const id of ids) expect(existing.has(id), id).toBe(false);
    const existingSlugs = new Set(OUTPUT_QUESTIONS_DATA.map((q) => q.slug));
    for (const q of OUTPUT_QUESTIONS_BATCH2_JS) expect(existingSlugs.has(q.slug), q.slug).toBe(false);
  });

  for (const q of OUTPUT_QUESTIONS_BATCH2_JS) {
    describe(q.id, () => {
      it('matches the schema and references known sources/concepts', () => {
        expect(() => OutputQuestion.parse(q)).not.toThrow();
        expect(q.id.startsWith('out-')).toBe(true);
        expect(q.environment).toBe('node');
        for (const e of q.research.evidence) expect(SOURCE_BY_ID[e.sourceId], e.sourceId).toBeDefined();
        for (const id of q.docSourceIds) {
          expect(SOURCE_BY_ID[id], id).toBeDefined();
          expect(SOURCE_BY_ID[id].category, id).toBe('official-docs');
        }
        for (const c of q.conceptIds) expect(CONCEPT_BY_ID[c], c).toBeDefined();
        expect(q.code.split('\n').length).toBeLessThanOrEqual(25);
        expect(q.estimatedMinutes).toBeGreaterThanOrEqual(2);
        expect(q.estimatedMinutes).toBeLessThanOrEqual(6);
        expect(q.steps.length).toBeGreaterThanOrEqual(3);
        expect(q.steps.length).toBeLessThanOrEqual(8);
        expect(q.misconceptions.length).toBeGreaterThanOrEqual(1);
        expect(q.misconceptions.length).toBeLessThanOrEqual(3);
      });

      it('expectedOutput matches real execution', async () => {
        expect(await execute(q)).toEqual(q.expectedOutput);
      });
    });
  }
});
