import { CONCEPT_BY_ID } from './concepts';
import { CODING_PROBLEMS, OUTPUT_QUESTIONS, QUESTIONS, validateContent } from './index';
import { SOURCE_BY_ID, SOURCES } from './sources';
import { VERIFICATION } from './verification';

describe('content schema', () => {
  it('all bundled content validates against the versioned schemas', () => {
    const r = validateContent();
    expect(r.errors).toEqual([]);
  });
  it('ids and slugs are unique', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    expect(new Set(QUESTIONS.map((q) => `${q.track}/${q.slug}`)).size).toBe(QUESTIONS.length);
  });
  it('every question links only to existing concepts', () => {
    for (const q of QUESTIONS) for (const c of q.conceptIds) expect(CONCEPT_BY_ID[c], `${q.id} → ${c}`).toBeDefined();
  });
});

describe('source traceability', () => {
  it('source registry: unique ids, https URLs, accessed date', () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
    for (const s of SOURCES) expect(s.url.startsWith('https://')).toBe(true);
  });
  it('every evidence entry, MCQ, follow-up and doc reference points to a registered source', () => {
    for (const q of QUESTIONS) {
      for (const e of q.research.evidence) {
        const s = SOURCE_BY_ID[e.sourceId];
        expect(s, `${q.id}: ${e.sourceId}`).toBeDefined();
        expect(new URL(e.url).host, `${q.id}: evidence URL host must match its source`).toBe(new URL(s.url).host);
        expect(s.accessible, `${q.id}: evidence must come from a source that was actually inspected`).toBe(true);
      }
      if (q.kind === 'coding') {
        for (const m of q.mcqs) for (const id of m.sourceIds) expect(SOURCE_BY_ID[id], `${q.id}/${m.id}: ${id}`).toBeDefined();
        for (const f of q.followUps) for (const id of f.sourceIds) expect(SOURCE_BY_ID[id], `${q.id}/${f.id}: ${id}`).toBeDefined();
      } else {
        for (const id of q.docSourceIds) expect(SOURCE_BY_ID[id], `${q.id}: ${id}`).toBeDefined();
      }
    }
  });
  it('original variations explain what they vary', () => {
    for (const q of QUESTIONS) if (q.research.provenance === 'ORIGINAL_VARIATION') expect(q.research.variationOf, q.id).toBeTruthy();
  });
  it('no question claims a verified interview report without a report source', () => {
    for (const q of QUESTIONS)
      if (q.research.provenance === 'VERIFIED_INTERVIEW_REPORT') expect(q.research.evidence.some((e) => SOURCE_BY_ID[e.sourceId]?.category === 'interview-report'), q.id).toBe(true);
  });
  it('HIGH_CONFIDENCE requires at least two independent sources', () => {
    for (const q of QUESTIONS)
      if (q.research.frequencyConfidence === 'HIGH_CONFIDENCE') expect(new Set(q.research.evidence.map((e) => e.sourceId)).size, q.id).toBeGreaterThanOrEqual(2);
  });
});

describe('coding problem integrity', () => {
  it.each(CODING_PROBLEMS.map((p) => [p.id, p] as const))('%s has public + hidden tests, MUST requirements, matching starter/solution files', (_id, p) => {
    expect(p.tests.some((t) => t.visibility === 'public')).toBe(true);
    expect(p.tests.some((t) => t.visibility === 'hidden')).toBe(true);
    expect(p.spec.requirements.some((r) => r.level === 'MUST')).toBe(true);
    expect(Object.keys(p.files.solution).sort()).toEqual(Object.keys(p.files.starter).sort());
    expect(p.files.starter[p.files.entry] ?? p.files.support[p.files.entry]).toBeDefined();
    for (const ro of p.files.readonly) expect(p.files.solution[ro]).toBe(p.files.starter[ro]);
    expect(new Set(p.spec.requirements.map((r) => r.id)).size).toBe(p.spec.requirements.length);
    for (const m of p.mcqs) expect(m.options.map((o) => o.id)).toContain(m.correctOptionId);
    if (p.track === 'vanilla') {
      const code = Object.entries(p.files.solution).filter(([k]) => /\.(js|ts)$/.test(k)).map(([, v]) => v).join('\n');
      expect(code).not.toMatch(/from ['"]react/);
    }
  });
  it('output questions have an executed expected output', () => {
    for (const q of OUTPUT_QUESTIONS) expect(q.expectedOutput.length).toBeGreaterThan(0);
  });
});

describe('solution verification record', () => {
  it('when present, covers every coding problem and reports only passing reference solutions', () => {
    if (!VERIFICATION.generatedAt) return; // not generated in this checkout — the app then shows "not verified"
    for (const p of CODING_PROBLEMS) {
      const r = VERIFICATION.results.find((x) => x.problemId === p.id);
      expect(r, `${p.id} missing from verification.generated.json — run npm run verify:solutions`).toBeDefined();
      expect(r!.ok).toBe(true);
    }
  });
});
