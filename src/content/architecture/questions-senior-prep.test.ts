import { describe, expect, it } from 'vitest';
import { CONCEPT_BY_ID } from '../concepts';
import { DesignQuestion } from '../schema';
import { SOURCE_BY_ID } from '../sources';
import { ARCH_QUESTIONS_REACT_INTERNALS } from './questions-react-internals';
import { ARCH_QUESTIONS_SECURITY_BROWSER } from './questions-security-browser';
import { ARCH_QUESTIONS_SYSTEM_DESIGN } from './questions-system-design';

const SETS = {
  'react-internals': { qs: ARCH_QUESTIONS_REACT_INTERNALS, ids: ['arch-memo-child-still-rerenders', 'arch-stale-closures-hooks', 'arch-render-commit-pipeline', 'arch-search-race-conditions', 'arch-state-placement-context'] },
  'security-browser': { qs: ARCH_QUESTIONS_SECURITY_BROWSER, ids: ['arch-xss-job-description', 'arch-auth-tokens-csrf', 'arch-csp-rollout', 'arch-secure-resume-upload', 'arch-memory-leak-hunt', 'arch-web-worker-offload'] },
  'system-design': { qs: ARCH_QUESTIONS_SYSTEM_DESIGN, ids: ['arch-sd-recruitment-portal', 'arch-sd-job-listing'] },
} as const;

const ALL = Object.values(SETS).flatMap((s) => s.qs);
const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;
const isSystemDesign = (id: string) => id.startsWith('arch-sd-');

describe('architecture: senior prep scenarios (React internals, security & browser, system design)', () => {
  it.each(Object.entries(SETS))('%s contains exactly the expected questions', (_name, set) => {
    expect(set.qs.map((q) => q.id)).toEqual([...set.ids]);
  });

  it('ids and slugs are unique across the three sets', () => {
    expect(new Set(ALL.map((q) => q.id)).size).toBe(ALL.length);
    expect(new Set(ALL.map((q) => q.slug)).size).toBe(ALL.length);
  });

  it.each(ALL.map((q) => [q.id, q] as const))('%s parses as an architecture DesignQuestion', (_id, q) => {
    const r = DesignQuestion.safeParse(q);
    if (!r.success) throw new Error(JSON.stringify(r.error.issues, null, 2));
    expect(q.track).toBe('architecture');
    expect(q.id.startsWith('arch-')).toBe(true);
  });

  it.each(ALL.map((q) => [q.id, q] as const))('%s references registered, inspected sources with exact evidence URLs', (_id, q) => {
    const refs = [...q.research.evidence.map((e) => e.sourceId), ...q.docSourceIds, ...q.mcqs.flatMap((m) => m.sourceIds), ...q.followUps.flatMap((f) => f.sourceIds)];
    for (const id of refs) expect(SOURCE_BY_ID[id], `unknown source "${id}"`).toBeDefined();
    for (const e of q.research.evidence) {
      expect(e.url).toBe(SOURCE_BY_ID[e.sourceId].url);
      expect(SOURCE_BY_ID[e.sourceId].accessible).toBe(true);
    }
  });

  it.each(ALL.map((q) => [q.id, q] as const))('%s links only to existing concepts', (_id, q) => {
    for (const c of q.conceptIds) expect(CONCEPT_BY_ID[c], c).toBeDefined();
  });

  it.each(ALL.map((q) => [q.id, q] as const))('%s has well-formed MCQs and follow-ups', (_id, q) => {
    expect(q.mcqs).toHaveLength(3);
    for (const m of q.mcqs) {
      expect(m.options).toHaveLength(4);
      expect(m.options.map((o) => o.id)).toContain(m.correctOptionId);
      expect(new Set(m.options.map((o) => o.id)).size).toBe(4);
    }
    expect(q.followUps.length).toBeGreaterThanOrEqual(4);
    expect(q.followUps.length).toBeLessThanOrEqual(5);
    expect(new Set(q.followUps.map((f) => f.id)).size).toBe(q.followUps.length);
  });

  it.each(ALL.map((q) => [q.id, q] as const))('%s meets the content-shape guidelines', (_id, q) => {
    const sd = isSystemDesign(q.id);
    expect(q.estimatedMinutes).toBeGreaterThanOrEqual(sd ? 40 : 15);
    expect(q.estimatedMinutes).toBeLessThanOrEqual(sd ? 60 : 30);
    expect(q.constraints.length).toBeGreaterThanOrEqual(2);
    expect(q.constraints.length).toBeLessThanOrEqual(4);
    expect(q.answerOutline.length).toBeGreaterThanOrEqual(6);
    expect(q.answerOutline.length).toBeLessThanOrEqual(10);
    expect(q.pitfalls.length).toBeGreaterThanOrEqual(3);
    expect(q.pitfalls.length).toBeLessThanOrEqual(5);
    const words = wordCount(q.modelAnswer);
    expect(words).toBeGreaterThanOrEqual(300);
    expect(words).toBeLessThanOrEqual(sd ? 1000 : 700);
    expect(q.versionNotes.startsWith('Checked against')).toBe(true);
    expect(q.research.frequencyConfidence).toBe('LOW_CONFIDENCE');
    expect(q.research.verificationStatus).toBe('SOURCES_VERIFIED');
    expect(q.research.lastVerified).toBe('2026-11-26');
    expect(q.research.provenance).toBe(sd ? 'ORIGINAL_VARIATION' : 'DOCUMENTED_TECHNICAL_EXERCISE');
  });

  it('never claims a verified interview report', () => {
    for (const q of ALL) expect(q.research.provenance).not.toBe('VERIFIED_INTERVIEW_REPORT');
  });
});
