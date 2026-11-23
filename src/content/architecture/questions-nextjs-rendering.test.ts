import { CONCEPT_BY_ID } from '../concepts';
import { DesignQuestion } from '../schema';
import { SOURCE_BY_ID } from '../sources';
import { ARCH_QUESTIONS_NEXTJS_RENDERING } from './questions-nextjs-rendering';

/** Concept ids being added alongside these questions (may not be registered in CONCEPTS yet). */
const NEW_CONCEPT_IDS = new Set([
  'react-19-actions',
  'react-19-apis',
  'react-server-components',
  'react-performance',
  'code-splitting',
  'core-web-vitals',
  'rendering-strategies',
  'hydration',
  'streaming-ssr',
  'nextjs-app-router',
  'nextjs-caching',
]);

const EXPECTED_IDS = [
  'arch-rendering-strategy-choice',
  'arch-hydration-mismatch-debug',
  'arch-streaming-suspense-boundaries',
  'arch-server-client-boundary',
  'arch-nextjs-caching-strategy',
  'arch-app-router-data-mutations',
];

const qs = ARCH_QUESTIONS_NEXTJS_RENDERING;
const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

describe('architecture: Next.js rendering questions', () => {
  it('contains exactly the six expected questions', () => {
    expect(qs.map((q) => q.id)).toEqual(EXPECTED_IDS);
  });

  it.each(qs.map((q) => [q.id, q] as const))('%s parses against the DesignQuestion schema', (_id, q) => {
    expect(() => DesignQuestion.parse(q)).not.toThrow();
    expect(q.kind).toBe('design');
    expect(q.execution).toBe('quiz');
    expect(q.track).toBe('architecture');
  });

  it('ids and slugs are unique', () => {
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
    expect(new Set(qs.map((q) => q.slug)).size).toBe(qs.length);
  });

  it('every referenced source id exists, and evidence URLs match their source host', () => {
    for (const q of qs) {
      const ids = [
        ...q.docSourceIds,
        ...q.research.evidence.map((e) => e.sourceId),
        ...q.mcqs.flatMap((m) => m.sourceIds),
        ...q.followUps.flatMap((f) => f.sourceIds),
      ];
      for (const id of ids) expect(SOURCE_BY_ID[id], `${q.id}: ${id}`).toBeDefined();
      for (const e of q.research.evidence) {
        expect(new URL(e.url).host, `${q.id}: ${e.url}`).toBe(new URL(SOURCE_BY_ID[e.sourceId].url).host);
      }
    }
  });

  it("each MCQ's correctOptionId is one of its options, and option ids are unique", () => {
    for (const q of qs) {
      expect(q.mcqs.length, q.id).toBe(3);
      for (const m of q.mcqs) {
        const ids = m.options.map((o) => o.id);
        expect(ids.length, `${q.id}/${m.id}`).toBe(4);
        expect(new Set(ids).size, `${q.id}/${m.id}`).toBe(ids.length);
        expect(ids, `${q.id}/${m.id}`).toContain(m.correctOptionId);
      }
      expect(new Set(q.mcqs.map((m) => m.id)).size, q.id).toBe(q.mcqs.length);
      expect(new Set(q.followUps.map((f) => f.id)).size, q.id).toBe(q.followUps.length);
    }
  });

  it('conceptIds are existing or newly-added concept ids', () => {
    for (const q of qs) for (const c of q.conceptIds) expect(Boolean(CONCEPT_BY_ID[c]) || NEW_CONCEPT_IDS.has(c), `${q.id} → ${c}`).toBe(true);
  });

  it('meets the content-shape requirements', () => {
    for (const q of qs) {
      expect(q.research.provenance, q.id).toBe('DOCUMENTED_TECHNICAL_EXERCISE');
      expect(q.research.frequencyConfidence, q.id).toBe('LOW_CONFIDENCE');
      expect(q.research.verificationStatus, q.id).toBe('SOURCES_VERIFIED');
      expect(q.research.lastVerified, q.id).toBe('2026-11-23');
      expect(q.estimatedMinutes, q.id).toBeGreaterThanOrEqual(15);
      expect(q.estimatedMinutes, q.id).toBeLessThanOrEqual(30);
      expect(q.constraints.length, q.id).toBeGreaterThanOrEqual(2);
      expect(q.constraints.length, q.id).toBeLessThanOrEqual(4);
      expect(q.answerOutline.length, q.id).toBeGreaterThanOrEqual(6);
      expect(q.answerOutline.length, q.id).toBeLessThanOrEqual(10);
      expect(q.pitfalls.length, q.id).toBeGreaterThanOrEqual(3);
      expect(q.pitfalls.length, q.id).toBeLessThanOrEqual(5);
      expect(q.followUps.length, q.id).toBeGreaterThanOrEqual(4);
      expect(q.followUps.length, q.id).toBeLessThanOrEqual(5);
      const words = wordCount(q.modelAnswer);
      expect(words, `${q.id} modelAnswer words`).toBeGreaterThanOrEqual(300);
      expect(words, `${q.id} modelAnswer words`).toBeLessThanOrEqual(600);
      expect(q.versionNotes.startsWith('Checked against Next.js 16.4 and React 19.3 docs on 2026-11-23'), q.id).toBe(true);
    }
  });

  it('P0 priority for the strategy, hydration, boundary and caching questions', () => {
    const p0 = qs.filter((q) => q.priority === 'P0').map((q) => q.id).sort();
    expect(p0).toEqual(['arch-hydration-mismatch-debug', 'arch-nextjs-caching-strategy', 'arch-rendering-strategy-choice', 'arch-server-client-boundary']);
  });
});
