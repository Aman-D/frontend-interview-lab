import { z } from 'zod';

/** Bump when the shape of bundled content changes. */
export const CONTENT_SCHEMA_VERSION = 1;

export const TrackId = z.enum(['react', 'vanilla', 'javascript', 'typescript', 'output']);
export type TrackId = z.infer<typeof TrackId>;

export const ExecutionType = z.enum(['react', 'dom', 'js', 'ts-types', 'output']);

export const Provenance = z.enum(['VERIFIED_INTERVIEW_REPORT', 'PUBLISHED_PRACTICE_PROBLEM', 'DOCUMENTED_TECHNICAL_EXERCISE', 'ORIGINAL_VARIATION']);
export type Provenance = z.infer<typeof Provenance>;

export const FrequencyConfidence = z.enum(['HIGH_CONFIDENCE', 'MEDIUM_CONFIDENCE', 'LOW_CONFIDENCE', 'UNKNOWN']);
export type FrequencyConfidence = z.infer<typeof FrequencyConfidence>;

export const VerificationStatus = z.enum(['SOURCES_VERIFIED', 'PARTIALLY_VERIFIED', 'UNVERIFIED']);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const md = z.string().min(1);

export const SourceCategory = z.enum(['practice-platform', 'interview-handbook', 'curated-hub', 'blog', 'official-docs', 'interview-report', 'tooling-docs']);

export const Source = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  url: z.string().url().startsWith('https://'),
  category: SourceCategory,
  accessedOn: isoDate,
  accessible: z.boolean(),
  notes: z.string().optional(),
});
export type Source = z.infer<typeof Source>;

/** Evidence linking a question to a source. `originalTitle` is the title exactly as the source lists it. */
export const Evidence = z.object({
  sourceId: z.string(),
  url: z.string().url().startsWith('https://'),
  originalTitle: z.string().min(1),
  note: z.string().optional(),
});

export const Research = z.object({
  provenance: Provenance,
  frequencyConfidence: FrequencyConfidence,
  verificationStatus: VerificationStatus,
  lastVerified: isoDate,
  evidence: z.array(Evidence).min(1),
  researchNotes: z.string().min(1),
  /** Present when provenance is ORIGINAL_VARIATION: what it varies and why. */
  variationOf: z.string().optional(),
});
export type Research = z.infer<typeof Research>;

export const Level = z.enum(['MUST', 'SHOULD', 'OPTIONAL']);
export type Level = z.infer<typeof Level>;

export const RequirementCategory = z.enum(['functional', 'technical', 'edge-case', 'accessibility', 'performance', 'testing']);
export type RequirementCategory = z.infer<typeof RequirementCategory>;

export const Requirement = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  category: RequirementCategory,
  level: Level,
  text: z.string().min(5),
  acceptance: z.string().optional(),
});
export type Requirement = z.infer<typeof Requirement>;

export const Clarification = z.object({
  question: z.string(),
  why: z.string(),
  defaultAssumption: z.string(),
});

export const Example = z.object({ title: z.string(), input: z.string(), output: z.string(), explanation: z.string().optional() });

export const FollowUpLevel = z.enum(['definition', 'mechanism', 'application', 'edge-cases', 'production', 'architecture']);
export const FollowUp = z.object({
  id: z.string(),
  level: FollowUpLevel,
  question: z.string(),
  expectedConcepts: z.array(z.string()).min(1),
  sourceIds: z.array(z.string()).default([]),
});
export type FollowUp = z.infer<typeof FollowUp>;

export const Mcq = z.object({
  id: z.string(),
  question: z.string(),
  code: z.string().optional(),
  options: z
    .array(z.object({ id: z.string(), text: z.string(), explanation: z.string().min(5) }))
    .min(3)
    .max(5),
  correctOptionId: z.string(),
  explanation: z.string().min(10),
  sourceIds: z.array(z.string()).min(1),
});
export type Mcq = z.infer<typeof Mcq>;

export const SolutionContent = z.object({
  initialApproach: md,
  bruteForce: z.string().optional(),
  optimizedApproach: md,
  walkthrough: md,
  complexity: md,
  edgeCases: md,
  alternatives: md,
  tradeoffs: md,
  commonMistakes: md,
  testingStrategy: md,
  seniorFollowUps: md,
});

export const TestFile = z.object({
  path: z.string().startsWith('/'),
  visibility: z.enum(['public', 'hidden']),
  kind: z.enum(['runtime', 'type']),
  source: z.string().min(1),
});

const fileMap = z.record(z.string().startsWith('/'), z.string());

const BaseQuestion = z.object({
  schemaVersion: z.literal(CONTENT_SCHEMA_VERSION),
  id: z.string().regex(/^[a-z0-9-]+$/),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  track: TrackId,
  difficulty: z.enum(['easy', 'medium', 'hard']),
  priority: z.enum(['P0', 'P1', 'P2']),
  seniority: z.array(z.enum(['Senior', 'SDE-2', 'SDE-3', 'MTS'])).min(1),
  topics: z.array(z.string()).min(1),
  estimatedMinutes: z.number().int().positive(),
  research: Research,
  conceptIds: z.array(z.string()).min(1),
});

export const CodingProblem = BaseQuestion.extend({
  kind: z.literal('coding'),
  execution: z.enum(['react', 'dom', 'js', 'ts-types']),
  spec: z.object({
    summary: z.string().min(20),
    description: md,
    technologies: z.array(z.string()).min(1),
    learningObjectives: z.array(z.string()).min(1),
    clarifications: z.array(Clarification).min(1),
    scopeDecisions: z.array(z.string()).min(1),
    requirements: z.array(Requirement).min(1),
    constraints: z.array(z.string()),
    acceptanceCriteria: z.array(z.string()).min(1),
    examples: z.array(Example),
    manualTests: z.array(z.string()),
  }),
  files: z.object({
    entry: z.string().startsWith('/'),
    starter: fileMap,
    solution: fileMap,
    /** Paths in starter that are shown read-only (support files). */
    readonly: z.array(z.string()).default([]),
    support: fileMap.default({}),
  }),
  tests: z.array(TestFile).min(1),
  hints: z.array(z.string()).min(1),
  solution: SolutionContent,
  followUps: z.array(FollowUp).min(1),
  mcqs: z.array(Mcq),
});
export type CodingProblem = z.infer<typeof CodingProblem>;

export const OutputQuestion = BaseQuestion.extend({
  kind: z.literal('output'),
  execution: z.literal('output'),
  environment: z.enum(['node', 'jsdom', 'react-jsdom']),
  prompt: z.string(),
  code: z.string().min(1),
  /** Exact expected console output, one entry per line. Verified by executing `code` in tests. */
  expectedOutput: z.array(z.string()),
  steps: z.array(z.string()).min(2),
  misconceptions: z.array(z.string()).min(1),
  followUp: z.object({ question: z.string(), answer: z.string() }),
  docSourceIds: z.array(z.string()).min(1),
});
export type OutputQuestion = z.infer<typeof OutputQuestion>;

export const Question = z.discriminatedUnion('kind', [CodingProblem, OutputQuestion]);
export type Question = z.infer<typeof Question>;

export const Concept = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  area: z.enum(['JavaScript', 'TypeScript', 'React', 'DOM & Browser', 'Accessibility', 'Async', 'Data structures', 'Testing', 'Performance']),
  summary: z.string().min(10),
  definition: md,
  whyItExists: md,
  mechanism: md,
  example: md,
  codeWalkthrough: md,
  misconceptions: z.array(z.string()).min(1),
  failureCases: z.array(z.string()).min(1),
  productionImplications: md,
  docSourceIds: z.array(z.string()).min(1),
  interviewQuestions: z.array(z.string()).min(1),
  related: z.array(z.string()).default([]),
});
export type Concept = z.infer<typeof Concept>;
