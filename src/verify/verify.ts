import { CODING_PROBLEMS } from '@/content';
import type { CodingProblem } from '@/content/schema';
import { runTests } from '@/runtime/runProject';
import { summarize, type RunResult } from '@/runtime/types';

export interface VerificationEntry {
  problemId: string;
  solution: { passed: number; total: number; allPassed: boolean; status: RunResult['status']; failures: string[] };
  starter: { passed: number; total: number; failsAtLeastOne: boolean; status: RunResult['status'] };
  ok: boolean;
}

export function projectFor(problem: CodingProblem, which: 'starter' | 'solution') {
  return {
    execution: problem.execution,
    files: problem.files[which],
    entry: problem.files.entry,
    supportFiles: problem.files.support,
    testFiles: problem.tests.map((t) => ({ path: t.path, source: t.source, visibility: t.visibility, kind: t.kind })),
  } as const;
}

/** Runs every reference solution and starter through the real in-browser runner. */
export async function verifyAll(host: HTMLElement, onProgress?: (msg: string) => void): Promise<VerificationEntry[]> {
  const out: VerificationEntry[] = [];
  for (const p of CODING_PROBLEMS) {
    onProgress?.(`Verifying ${p.id}…`);
    const sol = await runTests(projectFor(p, 'solution'), host);
    const st = await runTests(projectFor(p, 'starter'), host);
    const s1 = summarize(sol);
    const s2 = summarize(st);
    const entry: VerificationEntry = {
      problemId: p.id,
      solution: {
        passed: s1.passed,
        total: s1.total,
        allPassed: s1.allPassed,
        status: sol.status,
        failures: [
          ...sol.tests.filter((t) => t.status !== 'pass').map((t) => `${t.file} › ${t.name}: ${t.error?.message ?? ''}`),
          ...sol.diagnostics.map((d) => `${d.file}:${d.line} ${d.message}`),
          ...(sol.message ? [sol.message] : []),
        ],
      },
      starter: { passed: s2.passed, total: s2.total, failsAtLeastOne: st.status !== 'completed' || s2.passed < s2.total, status: st.status },
      ok: false,
    };
    entry.ok = entry.solution.allPassed && entry.starter.failsAtLeastOne;
    out.push(entry);
  }
  return out;
}
