import { describe, expect, it } from 'vitest';
import { CONCEPTS } from './concepts';
import { Concept } from './schema';
import { SOURCE_BY_ID } from './sources';

const EXPECTED_IDS = [
  'closures', 'this-binding', 'event-loop', 'promises', 'promise-combinators', 'currying', 'observer-pattern',
  'hoisting-tdz', 'coercion-equality', 'prototype-chain', 'exceptions-finally', 'referential-equality', 'debouncing',
  'abort-controller', 'race-conditions', 'async-ui-states', 'event-delegation', 'event-propagation', 'focus-management',
  'keyboard-navigation', 'combobox-aria', 'tree-aria-pattern', 'disclosure-accordion-aria', 'react-state-batching',
  'react-effects', 'react-reconciliation-keys', 'immutable-updates', 'recursive-tree-traversal', 'generics',
  'conditional-types-infer', 'mapped-types-keyof', 'discriminated-unions', 'fake-timers',
];

describe('concept knowledge base', () => {
  it('contains exactly the expected concept ids', () => {
    expect(CONCEPTS.map((c) => c.id).sort()).toEqual([...EXPECTED_IDS].sort());
  });

  it('has unique ids', () => {
    const ids = CONCEPTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(CONCEPTS.map((c) => [c.id, c] as const))('%s parses with the Concept schema', (_id, concept) => {
    expect(() => Concept.parse(concept)).not.toThrow();
  });

  it.each(CONCEPTS.map((c) => [c.id, c] as const))('%s references only registered doc sources', (_id, concept) => {
    const missing = concept.docSourceIds.filter((id) => !(id in SOURCE_BY_ID));
    expect(missing).toEqual([]);
  });

  it.each(CONCEPTS.map((c) => [c.id, c] as const))('%s relates only to existing concepts', (_id, concept) => {
    const ids = new Set(CONCEPTS.map((c) => c.id));
    const missing = concept.related.filter((id) => !ids.has(id));
    expect(missing).toEqual([]);
    expect(concept.related).not.toContain(concept.id);
  });

  it('keeps code walkthroughs fenced and content within the size budget', () => {
    for (const c of CONCEPTS) {
      expect(c.codeWalkthrough, c.id).toMatch(/~~~|```/);
      expect(c.misconceptions.length, c.id).toBeGreaterThanOrEqual(2);
      expect(c.failureCases.length, c.id).toBeGreaterThanOrEqual(2);
      expect(c.interviewQuestions.length, c.id).toBeGreaterThanOrEqual(3);
      expect(c.docSourceIds.length, c.id).toBeLessThanOrEqual(3);
    }
  });
});
