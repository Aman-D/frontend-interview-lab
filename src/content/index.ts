import { CodingProblem, OutputQuestion, Question } from './schema';
import jsDebounce from './problems/js-debounce';
import jsPromiseAll from './problems/js-promise-all';
import jsCurry from './problems/js-curry';
import jsEventEmitter from './problems/js-event-emitter';
import vanillaAccordion from './problems/vanilla-accordion';
import vanillaEventDelegation from './problems/vanilla-event-delegation';
import tsReturnType from './problems/ts-return-type-parameters';
import tsTypedEmitter from './problems/ts-typed-event-emitter';
import { OUTPUT_QUESTIONS_DATA } from './output/questions';
import reactAutocomplete from './problems/react-autocomplete';
import reactFileExplorer from './problems/react-file-explorer';

/** Every coding problem bundled with the app. Order is the default library order. */
export const CODING_PROBLEMS: CodingProblem[] = [
  reactAutocomplete,
  reactFileExplorer,
  vanillaAccordion,
  vanillaEventDelegation,
  jsDebounce,
  jsPromiseAll,
  jsCurry,
  jsEventEmitter,
  tsReturnType,
  tsTypedEmitter,
];

export const OUTPUT_QUESTIONS: OutputQuestion[] = OUTPUT_QUESTIONS_DATA;

export const QUESTIONS: Question[] = [...CODING_PROBLEMS, ...OUTPUT_QUESTIONS];
export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

/** Validates all bundled content against the schemas. Used by tests and at app start (dev). */
export function validateContent(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const q of QUESTIONS) {
    const r = (q.kind === 'coding' ? CodingProblem : OutputQuestion).safeParse(q);
    if (!r.success) errors.push(`${q.id}: ${r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
  }
  const parsed = Question.array().safeParse(QUESTIONS);
  if (!parsed.success) errors.push('Question union failed to parse');
  return { ok: errors.length === 0, errors };
}
