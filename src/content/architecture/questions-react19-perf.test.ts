import { describe, expect, it } from 'vitest';
import { CONCEPTS } from '../concepts';
import { REACT_BATCH2_CONCEPTS } from '../concepts-react-batch2';
import { A11Y_BATCH2_CONCEPTS } from '../concepts-a11y-batch2';
import { DesignQuestion } from '../schema';
import { SOURCE_BY_ID } from '../sources';
import { ARCH_QUESTIONS_REACT19_PERF } from './questions-react19-perf';

/** Concept ids being written in parallel for the architecture track. */
const NEW_CONCEPT_IDS = [
  'react-19-actions', 'react-19-apis', 'react-server-components', 'react-performance', 'code-splitting',
  'core-web-vitals', 'rendering-strategies', 'hydration', 'streaming-ssr', 'nextjs-app-router', 'nextjs-caching',
];
const ALLOWED_CONCEPT_IDS = new Set([
  ...NEW_CONCEPT_IDS,
  ...[...CONCEPTS, ...REACT_BATCH2_CONCEPTS, ...A11Y_BATCH2_CONCEPTS].map((c) => c.id),
]);

const EXPECTED_IDS = [
  'arch-react19-form-actions',
  'arch-react19-use-and-suspense',
  'arch-react-rerender-diagnosis',
  'arch-react-compiler-adoption',
  'arch-core-web-vitals-plan',
  'arch-code-splitting-strategy',
];

const wordCount = (s: string) => s.trim().split(/\s+/).length;

describe('ARCH_QUESTIONS_REACT19_PERF', () => {
  it('contains exactly the expected questions with unique ids and slugs', () => {
    const ids = ARCH_QUESTIONS_REACT19_PERF.map((q) => q.id);
    expect(ids).toEqual(EXPECTED_IDS);
    expect(new Set(ids).size).toBe(ids.length);
    const slugs = ARCH_QUESTIONS_REACT19_PERF.map((q) => q.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(ARCH_QUESTIONS_REACT19_PERF.map((q) => [q.id, q] as const))('%s parses as a DesignQuestion', (_id, q) => {
    const result = DesignQuestion.safeParse(q);
    if (!result.success) throw new Error(JSON.stringify(result.error.issues, null, 2));
    expect(q.kind).toBe('design');
    expect(q.execution).toBe('quiz');
    expect(q.track).toBe('architecture');
    expect(q.id.startsWith('arch-')).toBe(true);
  });

  it.each(ARCH_QUESTIONS_REACT19_PERF.map((q) => [q.id, q] as const))('%s references only registered sources', (_id, q) => {
    const refs = [
      ...q.research.evidence.map((e) => e.sourceId),
      ...q.docSourceIds,
      ...q.mcqs.flatMap((m) => m.sourceIds),
      ...q.followUps.flatMap((f) => f.sourceIds),
    ];
    for (const id of refs) expect(SOURCE_BY_ID[id], `unknown source id "${id}"`).toBeDefined();
    for (const e of q.research.evidence) expect(e.url).toBe(SOURCE_BY_ID[e.sourceId].url);
  });

  it.each(ARCH_QUESTIONS_REACT19_PERF.map((q) => [q.id, q] as const))('%s has well-formed MCQs and follow-ups', (_id, q) => {
    expect(q.mcqs).toHaveLength(3);
    for (const m of q.mcqs) {
      expect(m.options).toHaveLength(4);
      expect(m.options.map((o) => o.id)).toContain(m.correctOptionId);
      expect(new Set(m.options.map((o) => o.id)).size).toBe(m.options.length);
    }
    expect(new Set(q.mcqs.map((m) => m.id)).size).toBe(q.mcqs.length);
    expect(q.followUps.length).toBeGreaterThanOrEqual(4);
    expect(q.followUps.length).toBeLessThanOrEqual(5);
    expect(new Set(q.followUps.map((f) => f.id)).size).toBe(q.followUps.length);
  });

  it.each(ARCH_QUESTIONS_REACT19_PERF.map((q) => [q.id, q] as const))('%s uses only allowed concept ids', (_id, q) => {
    for (const id of q.conceptIds) expect(ALLOWED_CONCEPT_IDS.has(id), `unknown concept id "${id}"`).toBe(true);
  });

  it.each(ARCH_QUESTIONS_REACT19_PERF.map((q) => [q.id, q] as const))('%s meets the content-shape guidelines', (_id, q) => {
    expect(q.estimatedMinutes).toBeGreaterThanOrEqual(15);
    expect(q.estimatedMinutes).toBeLessThanOrEqual(30);
    expect(q.constraints.length).toBeGreaterThanOrEqual(2);
    expect(q.constraints.length).toBeLessThanOrEqual(4);
    expect(q.answerOutline.length).toBeGreaterThanOrEqual(6);
    expect(q.answerOutline.length).toBeLessThanOrEqual(10);
    expect(q.pitfalls.length).toBeGreaterThanOrEqual(3);
    expect(q.pitfalls.length).toBeLessThanOrEqual(5);
    const words = wordCount(q.modelAnswer);
    expect(words).toBeGreaterThanOrEqual(300);
    expect(words).toBeLessThanOrEqual(600);
    expect(q.versionNotes.startsWith('Checked against')).toBe(true);
    expect(q.research.provenance).toBe('DOCUMENTED_TECHNICAL_EXERCISE');
    expect(q.research.frequencyConfidence).toBe('LOW_CONFIDENCE');
    expect(q.research.verificationStatus).toBe('SOURCES_VERIFIED');
    expect(q.research.lastVerified).toBe('2026-11-23');
  });

  it('marks form actions, re-render diagnosis and Core Web Vitals as P0', () => {
    const p0 = ARCH_QUESTIONS_REACT19_PERF.filter((q) => q.priority === 'P0').map((q) => q.id);
    expect(p0).toEqual(['arch-react19-form-actions', 'arch-react-rerender-diagnosis', 'arch-core-web-vitals-plan']);
  });
});
