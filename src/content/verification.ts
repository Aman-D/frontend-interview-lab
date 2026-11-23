import data from './verification.generated.json';

export interface VerificationRecord {
  problemId: string;
  solution: { passed: number; total: number; allPassed: boolean; status: string; failures: string[] };
  starter: { passed: number; total: number; failsAtLeastOne: boolean; status: string };
  ok: boolean;
}

export interface VerificationReport {
  generatedAt: string | null;
  browser: string | null;
  results: VerificationRecord[];
}

/** Written by `npm run verify:solutions` — actual results of running every reference solution in Chromium. */
export const VERIFICATION = data as VerificationReport;

export function verificationFor(problemId: string): VerificationRecord | undefined {
  return VERIFICATION.results.find((r) => r.problemId === problemId);
}
