import { COMPANIES, companiesForQuestion, companyQuestionIds } from './companies';
import { QUESTION_BY_ID } from './index';

describe('company prep sets', () => {
  it('have unique ids and at least one section', () => {
    expect(new Set(COMPANIES.map((c) => c.id)).size).toBe(COMPANIES.length);
    for (const c of COMPANIES) {
      expect(c.id).toMatch(/^[a-z0-9-]+$/);
      expect(c.sections.length, c.id).toBeGreaterThan(0);
      expect(c.basis.length, c.id).toBeGreaterThan(20);
    }
  });
  it('reference only questions that exist in the bank', () => {
    for (const c of COMPANIES) for (const s of c.sections) for (const id of s.questionIds) expect(QUESTION_BY_ID[id], `${c.id} / ${s.title} → ${id}`).toBeDefined();
  });
  it('list each question once per company', () => {
    for (const c of COMPANIES) {
      const all = c.sections.flatMap((s) => s.questionIds);
      expect(all.length, c.id).toBe(companyQuestionIds(c).length);
    }
  });
  it('say they are not a verified company question list', () => {
    for (const c of COMPANIES) expect(c.basis, c.id).toMatch(/not a verified/);
  });
  it('314e includes the rich text editor and both system designs', () => {
    for (const id of ['react-rich-text-editor', 'arch-sd-recruitment-portal', 'arch-sd-job-listing']) expect(companiesForQuestion(id).map((c) => c.id)).toContain('314e');
  });
});
