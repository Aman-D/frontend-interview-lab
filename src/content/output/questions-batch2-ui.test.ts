import React, { act } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { CONCEPT_BY_ID } from '../concepts';
import { OutputQuestion } from '../schema';
import { SOURCE_BY_ID } from '../sources';
import { OUTPUT_QUESTIONS_DATA } from './questions';
import { OUTPUT_QUESTIONS_BATCH2_UI } from './questions-batch2-ui';

function capturingConsole() {
  const lines: string[] = [];
  const log = (...args: unknown[]) => {
    lines.push(args.map((a) => (typeof a === 'string' ? a : String(a))).join(' '));
  };
  return { lines, console: { log } };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Mirrors the jsdom / react-jsdom execution paths of questions.test.ts; React snippets also get `flushSync` from react-dom. */
async function execute(q: OutputQuestion): Promise<string[]> {
  const cap = capturingConsole();
  if (q.environment === 'jsdom') {
    document.body.replaceWith(document.createElement('body'));
    new Function('document', 'console', q.code)(document, cap.console);
    await wait(10);
  } else if (q.environment === 'react-jsdom') {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    new Function('React', 'createRoot', 'act', 'flushSync', 'document', 'console', q.code)(
      React,
      createRoot,
      act,
      flushSync,
      document,
      cap.console,
    );
    await wait(20);
  } else {
    throw new Error(`unexpected environment ${q.environment}`);
  }
  return cap.lines;
}

describe('output questions — batch 2 (DOM + React)', () => {
  it('has 12 questions: 5 jsdom, 7 react-jsdom', () => {
    expect(OUTPUT_QUESTIONS_BATCH2_UI).toHaveLength(12);
    expect(OUTPUT_QUESTIONS_BATCH2_UI.filter((q) => q.environment === 'jsdom')).toHaveLength(5);
    expect(OUTPUT_QUESTIONS_BATCH2_UI.filter((q) => q.environment === 'react-jsdom')).toHaveLength(7);
  });

  it('has unique ids and slugs that do not collide with the existing catalog', () => {
    const existing = new Set(OUTPUT_QUESTIONS_DATA.flatMap((q) => [q.id, q.slug]));
    const ids = OUTPUT_QUESTIONS_BATCH2_UI.map((q) => q.id);
    const slugs = OUTPUT_QUESTIONS_BATCH2_UI.map((q) => q.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const id of ids) expect(existing.has(id), id).toBe(false);
  });

  for (const q of OUTPUT_QUESTIONS_BATCH2_UI) {
    describe(q.id, () => {
      it('matches the schema and references known sources/concepts', () => {
        expect(() => OutputQuestion.parse(q)).not.toThrow();
        for (const e of q.research.evidence) expect(SOURCE_BY_ID[e.sourceId], e.sourceId).toBeDefined();
        for (const id of q.docSourceIds) expect(SOURCE_BY_ID[id], id).toBeDefined();
        for (const c of q.conceptIds) expect(CONCEPT_BY_ID[c], c).toBeDefined();
        expect(q.code.split('\n').length).toBeLessThanOrEqual(25);
        expect(q.steps.length).toBeGreaterThanOrEqual(3);
        expect(q.steps.length).toBeLessThanOrEqual(8);
        expect(q.misconceptions.length).toBeLessThanOrEqual(3);
        expect(q.estimatedMinutes).toBeGreaterThanOrEqual(2);
        expect(q.estimatedMinutes).toBeLessThanOrEqual(6);
      });

      it('expectedOutput matches real execution', async () => {
        expect(await execute(q)).toEqual(q.expectedOutput);
      });
    });
  }
});
