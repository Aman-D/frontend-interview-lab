import React, { act } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { CONCEPT_BY_ID } from '../concepts';
import { OutputQuestion } from '../schema';
import { SOURCE_BY_ID } from '../sources';
import { OUTPUT_QUESTIONS_DATA } from './questions';
import { OUTPUT_QUESTIONS_BATCH2_JS } from './questions-batch2-js';
import { OUTPUT_QUESTIONS_BATCH2_UI } from './questions-batch2-ui';
import { OUTPUT_QUESTIONS_SSR } from './questions-ssr';

const EXPECTED_IDS = [
  'out-ssr-hooks-during-render-to-string',
  'out-ssr-suspense-render-to-string',
  'out-ssr-useid-stable',
  'out-ssr-hydration-mismatch-boundary',
  'out-ssr-effects-after-hydration',
];

/** Concepts being authored in parallel; allowed even before they land in concepts*.ts. */
const PENDING_CONCEPTS = new Set(['hydration', 'streaming-ssr']);

/**
 * Number of React development warnings (console.error) each snippet is expected to trigger.
 * They are not part of `expectedOutput`, but asserting the count keeps the explanations honest.
 */
const EXPECTED_CONSOLE_ERRORS: Record<string, number> = {
  'out-ssr-hooks-during-render-to-string': 0,
  'out-ssr-suspense-render-to-string': 0,
  'out-ssr-useid-stable': 0,
  'out-ssr-hydration-mismatch-boundary': 1, // "Text content did not match"
  'out-ssr-effects-after-hydration': 2, // "useLayoutEffect does nothing on the server" x2
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Executes a snippet with the real global console patched (not a fake object), so that React's
 * dev-only console suppression (used while it builds component stacks for warnings) behaves as in
 * a real app and does not leak extra "render" lines into the captured output.
 */
async function execute(q: OutputQuestion): Promise<{ lines: string[]; errors: number }> {
  const lines: string[] = [];
  let errors = 0;
  const original = { log: console.log, error: console.error };
  console.log = (...args: unknown[]) => {
    lines.push(args.map((a) => (typeof a === 'string' ? a : String(a))).join(' '));
  };
  console.error = () => {
    errors++;
  };
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  try {
    new Function('React', 'renderToString', 'hydrateRoot', 'act', 'document', 'console', q.code)(
      React,
      renderToString,
      hydrateRoot,
      act,
      document,
      console,
    );
    await wait(30);
  } finally {
    console.log = original.log;
    console.error = original.error;
  }
  return { lines, errors };
}

describe('SSR output questions', () => {
  it('contains exactly the catalog ids, once each, not colliding with other output files', () => {
    const ids = OUTPUT_QUESTIONS_SSR.map((q) => q.id);
    expect([...ids].sort()).toEqual([...EXPECTED_IDS].sort());
    const others = new Set(
      [...OUTPUT_QUESTIONS_DATA, ...OUTPUT_QUESTIONS_BATCH2_JS, ...OUTPUT_QUESTIONS_BATCH2_UI].map((q) => q.id),
    );
    for (const id of ids) expect(others.has(id), id).toBe(false);
    const slugs = OUTPUT_QUESTIONS_SSR.map((q) => q.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  for (const q of OUTPUT_QUESTIONS_SSR) {
    describe(q.id, () => {
      it('matches the schema and references known sources/concepts', () => {
        expect(() => OutputQuestion.parse(q)).not.toThrow();
        expect(q.environment).toBe('react-ssr');
        expect(q.id.startsWith('out-ssr-')).toBe(true);
        for (const e of q.research.evidence) expect(SOURCE_BY_ID[e.sourceId], e.sourceId).toBeDefined();
        for (const id of q.docSourceIds) expect(SOURCE_BY_ID[id], id).toBeDefined();
        for (const c of q.conceptIds) expect(Boolean(CONCEPT_BY_ID[c]) || PENDING_CONCEPTS.has(c), c).toBe(true);
        expect(q.code.split('\n').length).toBeLessThanOrEqual(25);
        expect(q.steps.length).toBeGreaterThanOrEqual(3);
        expect(q.steps.length).toBeLessThanOrEqual(8);
        expect(q.misconceptions.length).toBeLessThanOrEqual(3);
        expect(q.estimatedMinutes).toBeGreaterThanOrEqual(3);
        expect(q.estimatedMinutes).toBeLessThanOrEqual(6);
      });

      it('expectedOutput matches real execution', async () => {
        const { lines, errors } = await execute(q);
        expect(lines).toEqual(q.expectedOutput);
        expect(errors).toBe(EXPECTED_CONSOLE_ERRORS[q.id]);
      });
    });
  }
});
