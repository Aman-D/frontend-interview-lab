import { CodingProblem, DesignQuestion, OutputQuestion, Question } from './schema';
import jsDebounce from './problems/js-debounce';
import jsPromiseAll from './problems/js-promise-all';
import jsCurry from './problems/js-curry';
import jsEventEmitter from './problems/js-event-emitter';
import vanillaAccordion from './problems/vanilla-accordion';
import vanillaEventDelegation from './problems/vanilla-event-delegation';
import tsReturnType from './problems/ts-return-type-parameters';
import tsTypedEmitter from './problems/ts-typed-event-emitter';
import { OUTPUT_QUESTIONS_DATA } from './output/questions';
import { OUTPUT_QUESTIONS_BATCH2_JS } from './output/questions-batch2-js';
import { OUTPUT_QUESTIONS_BATCH2_UI } from './output/questions-batch2-ui';
import { OUTPUT_QUESTIONS_SSR } from './output/questions-ssr';
import { ARCH_QUESTIONS_REACT19_PERF } from './architecture/questions-react19-perf';
import { ARCH_QUESTIONS_NEXTJS_RENDERING } from './architecture/questions-nextjs-rendering';
import reactAutocomplete from './problems/react-autocomplete';
import reactFileExplorer from './problems/react-file-explorer';
import reactImageCarousel from './problems/react-image-carousel';
import reactStarRating from './problems/react-star-rating';
import reactDataTable from './problems/react-data-table';
import reactModalDialog from './problems/react-modal-dialog';
import reactTabs from './problems/react-tabs';
import reactToast from './problems/react-toast';
import reactTooltipPopover from './problems/react-tooltip-popover';
import reactOtpInput from './problems/react-otp-input';
import reactInfiniteScroll from './problems/react-infinite-scroll';
import reactVirtualizedList from './problems/react-virtualized-list';
import reactKanbanBoard from './problems/react-kanban-board';
import reactDatePicker from './problems/react-date-picker';
import reactPollWidget from './problems/react-poll-widget';
import reactCustomHooks from './problems/react-custom-hooks';
import reactCommandPalette from './problems/react-command-palette';
import reactMultiSelect from './problems/react-multi-select';
import reactNestedComments from './problems/react-nested-comments';
import reactMultiStepForm from './problems/react-multi-step-form';
import reactRichTextEditor from './problems/react-rich-text-editor';

/** Every coding problem bundled with the app. Order is the default library order. */
export const CODING_PROBLEMS: CodingProblem[] = [
  reactAutocomplete,
  reactFileExplorer,
  reactDataTable,
  reactModalDialog,
  reactTabs,
  reactToast,
  reactImageCarousel,
  reactStarRating,
  reactTooltipPopover,
  reactOtpInput,
  reactInfiniteScroll,
  reactVirtualizedList,
  reactKanbanBoard,
  reactDatePicker,
  reactPollWidget,
  reactCustomHooks,
  reactCommandPalette,
  reactMultiSelect,
  reactNestedComments,
  reactMultiStepForm,
  reactRichTextEditor,
  vanillaAccordion,
  vanillaEventDelegation,
  jsDebounce,
  jsPromiseAll,
  jsCurry,
  jsEventEmitter,
  tsReturnType,
  tsTypedEmitter,
];

export const OUTPUT_QUESTIONS: OutputQuestion[] = [...OUTPUT_QUESTIONS_DATA, ...OUTPUT_QUESTIONS_BATCH2_JS, ...OUTPUT_QUESTIONS_BATCH2_UI, ...OUTPUT_QUESTIONS_SSR];

/** Architecture & performance scenario questions (React 19, rendering patterns, Next.js App Router). */
export const DESIGN_QUESTIONS: DesignQuestion[] = [...ARCH_QUESTIONS_REACT19_PERF, ...ARCH_QUESTIONS_NEXTJS_RENDERING];

export const QUESTIONS: Question[] = [...CODING_PROBLEMS, ...OUTPUT_QUESTIONS, ...DESIGN_QUESTIONS];
export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

/** Validates all bundled content against the schemas. Used by tests and at app start (dev). */
export function validateContent(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const q of QUESTIONS) {
    const r = (q.kind === 'coding' ? CodingProblem : q.kind === 'design' ? DesignQuestion : OutputQuestion).safeParse(q);
    if (!r.success) errors.push(`${q.id}: ${r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
  }
  const parsed = Question.array().safeParse(QUESTIONS);
  if (!parsed.success) errors.push('Question union failed to parse');
  return { ok: errors.length === 0, errors };
}
