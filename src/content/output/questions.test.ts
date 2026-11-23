import { runInNewContext } from 'node:vm';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { OutputQuestion } from '../schema';
import { SOURCE_BY_ID } from '../sources';
import { OUTPUT_QUESTIONS_DATA } from './questions';

const EXPECTED_IDS = [
  'out-microtask-vs-timeout',
  'out-async-await-order',
  'out-promise-then-return',
  'out-promise-executor-sync',
  'out-var-hoisting',
  'out-tdz',
  'out-closure-loop-var-let',
  'out-this-method-extraction',
  'out-arrow-this',
  'out-equality-coercion',
  'out-object-is',
  'out-object-reference',
  'out-prototype-shadowing',
  'out-finally-return',
  'out-event-bubbling-order',
  'out-react-batching',
  'out-react-functional-update',
  'out-react-effect-order',
  'out-react-key-reset',
];

const CONCEPTS = new Set([
  'closures',
  'this-binding',
  'event-loop',
  'promises',
  'hoisting-tdz',
  'coercion-equality',
  'prototype-chain',
  'exceptions-finally',
  'referential-equality',
  'event-propagation',
  'react-state-batching',
  'react-effects',
  'react-reconciliation-keys',
]);

function capturingConsole() {
  const lines: string[] = [];
  const log = (...args: unknown[]) => {
    lines.push(args.map((a) => (typeof a === 'string' ? a : String(a))).join(' '));
  };
  return { lines, console: { log } };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function execute(q: OutputQuestion): Promise<string[]> {
  const cap = capturingConsole();
  if (q.environment === 'node') {
    runInNewContext(q.code, { console: cap.console, setTimeout, queueMicrotask, Promise });
    await wait(50);
  } else if (q.environment === 'jsdom') {
    document.body.replaceWith(document.createElement('body'));
    new Function('document', 'console', q.code)(document, cap.console);
    await wait(10);
  } else {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    new Function('React', 'createRoot', 'act', 'document', 'console', q.code)(React, createRoot, act, document, cap.console);
    await wait(10);
  }
  return cap.lines;
}

describe('output questions', () => {
  it('contains exactly the catalog ids, once each', () => {
    expect(OUTPUT_QUESTIONS_DATA.map((q) => q.id).sort()).toEqual([...EXPECTED_IDS].sort());
  });

  for (const q of OUTPUT_QUESTIONS_DATA) {
    describe(q.id, () => {
      it('matches the schema and references known sources/concepts', () => {
        expect(() => OutputQuestion.parse(q)).not.toThrow();
        for (const e of q.research.evidence) expect(SOURCE_BY_ID[e.sourceId], e.sourceId).toBeDefined();
        for (const id of q.docSourceIds) expect(SOURCE_BY_ID[id], id).toBeDefined();
        for (const c of q.conceptIds) expect(CONCEPTS.has(c), c).toBe(true);
        expect(q.code.split('\n').length).toBeLessThanOrEqual(25);
      });

      it('expectedOutput matches real execution', async () => {
        expect(await execute(q)).toEqual(q.expectedOutput);
      });
    });
  }
});
