import type { FrequencyConfidence, Provenance, TrackId } from './schema';

export const TRACK_LABEL: Record<TrackId, string> = {
  react: 'React machine coding',
  vanilla: 'Vanilla JS / DOM',
  javascript: 'JavaScript & polyfills',
  typescript: 'TypeScript',
  output: 'Output prediction',
};

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  VERIFIED_INTERVIEW_REPORT: 'Verified interview report',
  PUBLISHED_PRACTICE_PROBLEM: 'Published practice problem',
  DOCUMENTED_TECHNICAL_EXERCISE: 'Documented technical exercise',
  ORIGINAL_VARIATION: 'Original variation',
};

export const PROVENANCE_HELP: Record<Provenance, string> = {
  VERIFIED_INTERVIEW_REPORT: 'Supported by a specific public interview report.',
  PUBLISHED_PRACTICE_PROBLEM: 'Listed on an established practice platform or interview handbook. This is NOT evidence that a particular company asks it.',
  DOCUMENTED_TECHNICAL_EXERCISE: 'Derived from behaviour documented in official docs.',
  ORIGINAL_VARIATION: 'Written for this lab to test a concept or extend a published problem.',
};

export const CONFIDENCE_LABEL: Record<FrequencyConfidence, string> = {
  HIGH_CONFIDENCE: 'High confidence',
  MEDIUM_CONFIDENCE: 'Medium confidence',
  LOW_CONFIDENCE: 'Low confidence',
  UNKNOWN: 'Unknown',
};

export const CONFIDENCE_HELP =
  'Qualitative research assessment of how established this question is in interview-preparation material (High = ≥2 independent sources). It is not a probability of being asked.';

export const EXECUTION_LABEL = {
  react: 'React + TS · live preview · UI tests',
  dom: 'HTML/CSS/JS · DOM tests (no frameworks)',
  js: 'JavaScript · unit tests',
  'ts-types': 'TypeScript compiler · type tests',
  output: 'Predict the output',
} as const;

/** Researched candidates in docs/research/question-catalog.md (rows per track). */
export const CATALOG_CANDIDATES: Record<TrackId, number> = { react: 30, vanilla: 20, javascript: 30, typescript: 20, output: 19 };
