import { useEffect, useId, useReducer, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { EMPTY_DATA, PLANS, STEPS, TEAM_SIZES } from './steps';
import { firstInvalidStep, normalize, validateStep } from './validation';
import type { Field, FieldErrors, SignupData, StepId, StorageLike } from './types';

export interface SignupWizardProps {
  /** Called once with the normalised data. Resolve = account created; reject = show the error and allow a retry. */
  onSubmit: (data: SignupData) => Promise<void>;
  /** Where progress is saved. Omitted → sessionStorage when it is accessible; null → do not persist. */
  storage?: StorageLike | null;
  storageKey?: string;
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

type SubmitState = { status: 'idle' } | { status: 'pending' } | { status: 'error'; message: string } | { status: 'success' };
type FocusRequest = { kind: 'heading' } | { kind: 'field'; field: Field } | { kind: 'submit' } | { kind: 'success' };

interface WizardState {
  stepIndex: number;
  data: SignupData;
  /** Steps the user tried to leave: their errors are shown (and re-derived live as they type). */
  attempted: readonly StepId[];
  /** Editing a step from the review page: the primary button goes straight back to review. */
  returnToReview: boolean;
  submit: SubmitState;
  /** Progress was restored from storage (the password is never stored, so it must be re-entered). */
  restored: boolean;
  /** A new object per request, so the focus effect runs once per request. */
  focus: FocusRequest | null;
}

type Action =
  | { type: 'change'; field: Field; value: SignupData[Field] }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'edit'; step: StepId }
  | { type: 'showInvalid'; step: StepId }
  | { type: 'submitStart' }
  | { type: 'submitSuccess' }
  | { type: 'submitError'; message: string };

const REVIEW = STEPS.length - 1;
const indexOf = (step: StepId) => STEPS.findIndex((s) => s.id === step);
const hasErrors = (errors: FieldErrors) => Object.keys(errors).length > 0;

/** Focus target for a step whose errors are being shown: the first invalid field in DOM order. */
function firstErrorField(step: StepId, errors: FieldErrors): Field {
  const fields = STEPS[indexOf(step)].fields;
  return fields.find((f) => errors[f] !== undefined) ?? fields[0];
}

/** Moves to `step` with its errors visible and focus on its first invalid field. */
function showInvalid(state: WizardState, step: StepId): WizardState {
  return {
    ...state,
    stepIndex: indexOf(step),
    attempted: state.attempted.includes(step) ? state.attempted : [...state.attempted, step],
    returnToReview: step !== STEPS[state.stepIndex].id || state.returnToReview,
    focus: { kind: 'field', field: firstErrorField(step, validateStep(step, state.data)) },
  };
}

export function wizardReducer(state: WizardState, action: Action): WizardState {
  const busy = state.submit.status === 'pending' || state.submit.status === 'success';
  switch (action.type) {
    case 'change':
      if (busy) return state;
      return { ...state, data: { ...state.data, [action.field]: action.value } };
    case 'next': {
      if (busy) return state;
      const step = STEPS[state.stepIndex].id;
      if (hasErrors(validateStep(step, state.data))) return showInvalid(state, step);
      if (state.returnToReview) {
        // An edit may have invalidated a later step (e.g. team size vs. Business plan).
        const invalid = firstInvalidStep(state.data);
        if (invalid && indexOf(invalid) !== state.stepIndex) return showInvalid(state, invalid);
        return { ...state, stepIndex: REVIEW, returnToReview: false, focus: { kind: 'heading' } };
      }
      return { ...state, stepIndex: Math.min(state.stepIndex + 1, REVIEW), focus: { kind: 'heading' } };
    }
    case 'back':
      if (busy || state.stepIndex === 0) return state;
      return { ...state, stepIndex: state.stepIndex - 1, focus: { kind: 'heading' } };
    case 'edit':
      if (busy) return state;
      return { ...state, stepIndex: indexOf(action.step), returnToReview: true, focus: { kind: 'heading' } };
    case 'showInvalid':
      return showInvalid(state, action.step);
    case 'submitStart':
      return { ...state, submit: { status: 'pending' } };
    case 'submitSuccess':
      return { ...state, submit: { status: 'success' }, focus: { kind: 'success' } };
    case 'submitError':
      return { ...state, submit: { status: 'error', message: action.message }, focus: { kind: 'submit' } };
  }
}

/* ------------------------------------------------------------------ */
/* Persistence (never the password)                                    */
/* ------------------------------------------------------------------ */

/** sessionStorage, or null where touching it throws (opaque-origin iframes, blocked storage, some private modes). */
function sessionStorageOrNull(): StorageLike | null {
  try {
    const s = window.sessionStorage;
    const probe = '__signup_probe__';
    s.setItem(probe, probe);
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

interface Saved {
  v: 1;
  step: StepId;
  data: Omit<SignupData, 'password'>;
}

/** Reads saved progress defensively: storage can throw, and its contents are untrusted input. */
function restore(storage: StorageLike | null, key: string): Pick<WizardState, 'stepIndex' | 'data'> | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<Saved> | null;
    if (!saved || saved.v !== 1 || typeof saved.data !== 'object' || saved.data === null) return null;
    const stepIndex = STEPS.findIndex((s) => s.id === saved.step);
    if (stepIndex < 0) return null;
    const d = saved.data as Record<string, unknown>;
    const str = (k: string) => (typeof d[k] === 'string' ? (d[k] as string) : '');
    const data: SignupData = {
      ...EMPTY_DATA,
      name: str('name'),
      email: str('email'),
      workspace: str('workspace'),
      teamSize: TEAM_SIZES.some((t) => t.value === d.teamSize) ? (d.teamSize as SignupData['teamSize']) : '',
      plan: PLANS.some((p) => p.value === d.plan) ? (d.plan as SignupData['plan']) : '',
      acceptTerms: d.acceptTerms === true,
    };
    return { stepIndex, data };
  } catch {
    return null; // corrupt JSON or a throwing getItem: start fresh
  }
}

function persist(storage: StorageLike | null, key: string, state: WizardState) {
  if (!storage) return;
  try {
    if (state.submit.status === 'success') {
      storage.removeItem(key);
      return;
    }
    const { password: _omit, ...data } = state.data;
    const saved: Saved = { v: 1, step: STEPS[state.stepIndex].id, data };
    storage.setItem(key, JSON.stringify(saved));
  } catch {
    // Quota exceeded or storage disabled: persistence is a nice-to-have, never break the form for it.
  }
}

function init({ storage, storageKey }: { storage: StorageLike | null; storageKey: string }): WizardState {
  const restored = restore(storage, storageKey);
  return {
    stepIndex: restored?.stepIndex ?? 0,
    data: restored?.data ?? EMPTY_DATA,
    attempted: [],
    returnToReview: false,
    submit: { status: 'idle' },
    restored: restored !== null,
    focus: null,
  };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function SignupWizard({ onSubmit, storage, storageKey = 'signup-wizard' }: SignupWizardProps) {
  // Resolve the storage once: the default probes sessionStorage, which may throw.
  const [store] = useState(() => (storage === undefined ? sessionStorageOrNull() : storage));
  const [state, dispatch] = useReducer(wizardReducer, { storage: store, storageKey }, init);
  const inFlight = useRef(false); // synchronous double-submit guard (state updates are not visible until re-render)

  const id = useId();
  const fieldId = (field: Field) => `${id}-${field}`;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const step = STEPS[state.stepIndex];
  const errors: FieldErrors = state.attempted.includes(step.id) ? validateStep(step.id, state.data) : {};
  const errorFields = step.fields.filter((f) => errors[f] !== undefined);
  const pending = state.submit.status === 'pending';

  // Perform focus requests after React has rendered the step they refer to.
  useEffect(() => {
    const request = state.focus;
    if (!request) return;
    if (request.kind === 'heading') headingRef.current?.focus();
    else if (request.kind === 'success') successRef.current?.focus();
    else if (request.kind === 'submit') submitRef.current?.focus();
    else document.getElementById(fieldId(request.field))?.focus();
    // fieldId is derived from a stable useId value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.focus]);

  // Save progress whenever the step or the answers change (an Effect: syncing with an external system).
  useEffect(() => {
    persist(store, storageKey, state);
  }, [store, storageKey, state.stepIndex, state.data, state.submit.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    if (state.stepIndex !== REVIEW) {
      dispatch({ type: 'next' }); // Enter in a field and the Next button both land here
      return;
    }
    // Re-validate everything: restored or edited answers may no longer be valid.
    const invalid = firstInvalidStep(state.data);
    if (invalid) {
      dispatch({ type: 'showInvalid', step: invalid });
      return;
    }
    inFlight.current = true;
    dispatch({ type: 'submitStart' });
    try {
      await onSubmit(normalize(state.data));
      dispatch({ type: 'submitSuccess' });
    } catch (error) {
      dispatch({ type: 'submitError', message: error instanceof Error ? error.message : String(error) });
    } finally {
      inFlight.current = false;
    }
  }

  const set = <F extends Field>(field: F) => (value: SignupData[F]) => dispatch({ type: 'change', field, value });
  const describedBy = (field: Field, hint?: boolean) =>
    [hint ? `${fieldId(field)}-hint` : '', errors[field] ? `${fieldId(field)}-error` : ''].filter(Boolean).join(' ') || undefined;
  const invalid = (field: Field) => (errors[field] ? true : undefined);
  const errorText = (field: Field) =>
    errors[field] ? (
      <p id={`${fieldId(field)}-error`} className="error">
        {errors[field]}
      </p>
    ) : null;

  if (state.submit.status === 'success') {
    return (
      <section className="wizard" aria-labelledby={`${id}-done`}>
        <h2 id={`${id}-done`} ref={successRef} tabIndex={-1}>
          Account created
        </h2>
        <p>
          Welcome, {state.data.name.trim()}. Your workspace “{state.data.workspace.trim()}” is ready.
        </p>
      </section>
    );
  }

  const { data } = state;
  let body: ReactNode;
  if (step.id === 'account') {
    body = (
      <>
        <TextField id={fieldId('name')} label="Full name" value={data.name} onChange={set('name')} autoComplete="name" invalid={invalid('name')} describedBy={describedBy('name')} error={errorText('name')} />
        <TextField id={fieldId('email')} label="Email" type="email" value={data.email} onChange={set('email')} autoComplete="email" invalid={invalid('email')} describedBy={describedBy('email')} error={errorText('email')} />
        <TextField
          id={fieldId('password')}
          label="Password"
          type="password"
          value={data.password}
          onChange={set('password')}
          autoComplete="new-password"
          hint="At least 8 characters, including a number."
          invalid={invalid('password')}
          describedBy={describedBy('password', true)}
          error={errorText('password')}
        />
      </>
    );
  } else if (step.id === 'workspace') {
    body = (
      <>
        <TextField id={fieldId('workspace')} label="Workspace name" value={data.workspace} onChange={set('workspace')} autoComplete="organization" invalid={invalid('workspace')} describedBy={describedBy('workspace')} error={errorText('workspace')} />
        <div className="field">
          <label htmlFor={fieldId('teamSize')}>Team size</label>
          <select id={fieldId('teamSize')} value={data.teamSize} onChange={(e) => set('teamSize')(e.target.value as SignupData['teamSize'])} aria-invalid={invalid('teamSize')} aria-describedby={describedBy('teamSize')}>
            <option value="">Select…</option>
            {TEAM_SIZES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {errorText('teamSize')}
        </div>
      </>
    );
  } else if (step.id === 'plan') {
    // The id used for focusing goes on the checked radio (or the first): that is where Tab would land.
    const focusPlan = data.plan || PLANS[0].value;
    body = (
      <>
        <fieldset aria-describedby={describedBy('plan')}>
          <legend>Choose a plan</legend>
          {PLANS.map((p) => (
            <label key={p.value} className="choice">
              <input
                type="radio"
                name={`${id}-plan`}
                id={p.value === focusPlan ? fieldId('plan') : `${fieldId('plan')}-${p.value}`}
                value={p.value}
                checked={data.plan === p.value}
                onChange={() => set('plan')(p.value)}
                aria-invalid={invalid('plan')}
                aria-describedby={describedBy('plan')}
              />
              <span>
                {p.label} <small>— {p.blurb}</small>
              </span>
            </label>
          ))}
          {errorText('plan')}
        </fieldset>
        <div className="field">
          <label className="choice">
            <input type="checkbox" id={fieldId('acceptTerms')} checked={data.acceptTerms} onChange={(e) => set('acceptTerms')(e.target.checked)} aria-invalid={invalid('acceptTerms')} aria-describedby={describedBy('acceptTerms')} />
            <span>I accept the terms of service</span>
          </label>
          {errorText('acceptTerms')}
        </div>
      </>
    );
  } else {
    const teamLabel = TEAM_SIZES.find((t) => t.value === data.teamSize)?.label ?? 'Not set';
    const planLabel = PLANS.find((p) => p.value === data.plan)?.label ?? 'Not set';
    body = (
      <div className="review">
        <ReviewSection title="Account" editLabel="Edit account" disabled={pending} onEdit={() => dispatch({ type: 'edit', step: 'account' })}>
          <dt>Full name</dt>
          <dd>{data.name.trim()}</dd>
          <dt>Email</dt>
          <dd>{data.email.trim()}</dd>
          <dt>Password</dt>
          {/* Never echo the password, nor its length. */}
          <dd>{data.password ? '••••••••' : 'Not set'}</dd>
        </ReviewSection>
        <ReviewSection title="Workspace" editLabel="Edit workspace" disabled={pending} onEdit={() => dispatch({ type: 'edit', step: 'workspace' })}>
          <dt>Workspace name</dt>
          <dd>{data.workspace.trim()}</dd>
          <dt>Team size</dt>
          <dd>{teamLabel}</dd>
        </ReviewSection>
        <ReviewSection title="Plan" editLabel="Edit plan" disabled={pending} onEdit={() => dispatch({ type: 'edit', step: 'plan' })}>
          <dt>Plan</dt>
          <dd>{planLabel}</dd>
          <dt>Terms</dt>
          <dd>{data.acceptTerms ? 'Accepted' : 'Not accepted'}</dd>
        </ReviewSection>
      </div>
    );
  }

  const primaryLabel = step.id === 'review' ? (pending ? 'Creating account…' : 'Create account') : state.returnToReview ? 'Save and review' : 'Next';

  return (
    <form className="wizard" noValidate aria-labelledby={`${id}-title`} aria-busy={pending} onSubmit={handleSubmit}>
      <h2 id={`${id}-title`}>Create your workspace</h2>
      <nav aria-label="Signup progress">
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.id} aria-current={i === state.stepIndex ? 'step' : undefined} data-state={i < state.stepIndex ? 'done' : undefined}>
              {s.title}
            </li>
          ))}
        </ol>
      </nav>

      <h3 ref={headingRef} tabIndex={-1}>
        Step {state.stepIndex + 1} of {STEPS.length}: {step.title}
      </h3>

      {state.restored && state.stepIndex !== 0 && !data.password && (
        <p className="notice">We restored your progress. For your security, you will need to re-enter your password before creating the account.</p>
      )}

      {errorFields.length > 0 && (
        <div className="error-summary" role="alert">
          <p>{errorFields.length === 1 ? 'There is 1 error on this step' : `There are ${errorFields.length} errors on this step`}</p>
          <ul>
            {errorFields.map((f) => (
              <li key={f}>
                <a
                  href={`#${fieldId(f)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(fieldId(f))?.focus();
                  }}
                >
                  {errors[f]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {body}

      {state.submit.status === 'error' && (
        <p className="submit-error" role="alert">
          Could not create your account: {state.submit.message}. Your answers are kept — please try again.
        </p>
      )}

      <div className="actions">
        {state.stepIndex > 0 ? (
          <button type="button" onClick={() => dispatch({ type: 'back' })} disabled={pending}>
            Back
          </button>
        ) : (
          <span />
        )}
        {/* aria-disabled (not disabled) while pending: the button keeps focus and stays discoverable; the handler guards. */}
        <button type="submit" ref={submitRef} aria-disabled={pending || undefined}>
          {primaryLabel}
        </button>
      </div>
    </form>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password';
  autoComplete?: string;
  hint?: string;
  invalid?: true;
  describedBy?: string;
  error: ReactNode;
}

function TextField({ id, label, value, onChange, type = 'text', autoComplete, hint, invalid, describedBy, error }: TextFieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      )}
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} aria-invalid={invalid} aria-describedby={describedBy} />
      {error}
    </div>
  );
}

function ReviewSection({ title, editLabel, disabled, onEdit, children }: { title: string; editLabel: string; disabled: boolean; onEdit: () => void; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <div className="review__head">
        <h4>{title}</h4>
        <button type="button" onClick={onEdit} disabled={disabled}>
          {editLabel}
        </button>
      </div>
      <dl>{children}</dl>
    </section>
  );
}
