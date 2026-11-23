import { useReducer, type FormEvent } from 'react';
import { EMPTY_DATA, STEPS } from './steps';
import type { Field, SignupData, StorageLike } from './types';

export interface SignupWizardProps {
  /** Called once with the normalised data. Resolve = account created; reject = show the error and allow a retry. */
  onSubmit: (data: SignupData) => Promise<void>;
  /** Where progress is saved. Omitted → sessionStorage when it is accessible; null → do not persist. */
  storage?: StorageLike | null;
  storageKey?: string;
}

interface WizardState {
  stepIndex: number;
  data: SignupData;
  // TODO: which steps show errors, submit status (idle / pending / error / success), focus requests, …
}

type Action = { type: 'change'; field: Field; value: SignupData[Field] } | { type: 'next' } | { type: 'back' };

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'change':
      return { ...state, data: { ...state.data, [action.field]: action.value } };
    case 'next':
      // TODO: validate the current step first (validation.ts)
      return { ...state, stepIndex: Math.min(state.stepIndex + 1, STEPS.length - 1) };
    case 'back':
      return { ...state, stepIndex: Math.max(state.stepIndex - 1, 0) };
  }
}

export default function SignupWizard(_props: SignupWizardProps) {
  const [state, dispatch] = useReducer(reducer, { stepIndex: 0, data: EMPTY_DATA });
  const step = STEPS[state.stepIndex];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // never let the browser navigate away
    dispatch({ type: 'next' });
  }

  return (
    <form className="wizard" noValidate onSubmit={handleSubmit}>
      <h2>Create your workspace</h2>
      <h3>
        Step {state.stepIndex + 1} of {STEPS.length}: {step.title}
      </h3>
      {step.id === 'account' ? (
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" type="text" value={state.data.name} onChange={(e) => dispatch({ type: 'change', field: 'name', value: e.target.value })} />
        </div>
      ) : (
        <p>TODO: render the “{step.title}” step.</p>
      )}
      {/* TODO: step indicator, the remaining fields, errors + summary, review, submit states, persistence. */}
      <div className="actions">
        {state.stepIndex > 0 && (
          <button type="button" onClick={() => dispatch({ type: 'back' })}>
            Back
          </button>
        )}
        <button type="submit">Next</button>
      </div>
    </form>
  );
}
