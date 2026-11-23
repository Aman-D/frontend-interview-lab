import { MESSAGES, STEPS } from './steps';
import type { FieldErrors, SignupData, StepId } from './types';

// Pure functions: (data) → errors. Each step validator receives the WHOLE form data, so a rule may depend
// on another step (the Business plan needs a team) — that is what lets the final submit catch answers
// that were valid when entered but were invalidated by a later edit.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

export function validateAccount(data: SignupData): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.name.trim()) errors.name = MESSAGES.nameRequired;

  const email = data.email.trim();
  if (!email) errors.email = MESSAGES.emailRequired;
  else if (!EMAIL.test(email)) errors.email = MESSAGES.emailInvalid;

  // Passwords are not trimmed: spaces are legitimate characters.
  if (!data.password) errors.password = MESSAGES.passwordRequired;
  else if (data.password.length < 8) errors.password = MESSAGES.passwordTooShort;
  else if (!/\d/.test(data.password)) errors.password = MESSAGES.passwordNeedsNumber;
  return errors;
}

export function validateWorkspace(data: SignupData): FieldErrors {
  const errors: FieldErrors = {};
  const workspace = data.workspace.trim();
  if (!workspace) errors.workspace = MESSAGES.workspaceRequired;
  else if (workspace.length < 3 || workspace.length > 40) errors.workspace = MESSAGES.workspaceLength;
  if (!data.teamSize) errors.teamSize = MESSAGES.teamSizeRequired;
  return errors;
}

export function validatePlan(data: SignupData): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.plan) errors.plan = MESSAGES.planRequired;
  else if (data.plan === 'business' && data.teamSize === 'solo') errors.plan = MESSAGES.planNeedsTeam;
  if (!data.acceptTerms) errors.acceptTerms = MESSAGES.termsRequired;
  return errors;
}

const VALIDATORS: Record<StepId, (data: SignupData) => FieldErrors> = {
  account: validateAccount,
  workspace: validateWorkspace,
  plan: validatePlan,
  review: () => ({}),
};

export function validateStep(step: StepId, data: SignupData): FieldErrors {
  return VALIDATORS[step](data);
}

export function firstInvalidStep(data: SignupData): StepId | null {
  for (const step of STEPS) {
    if (Object.keys(validateStep(step.id, data)).length > 0) return step.id;
  }
  return null;
}

export function normalize(data: SignupData): SignupData {
  return { ...data, name: data.name.trim(), email: data.email.trim(), workspace: data.workspace.trim() };
}
