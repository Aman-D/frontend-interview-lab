import type { FieldErrors, SignupData, StepId } from './types';

// Pure functions: (data) → errors. No React, no DOM, no mutation. Use the strings in MESSAGES (steps.ts).
//
// account   name: required (after trimming)
//           email: required; must look like "local@domain.tld" (trimmed, no spaces, a dot in the domain, TLD ≥ 2 chars)
//           password: required; at least 8 characters; at least one digit (checked in this order)
// workspace workspace: required; 3–40 characters after trimming
//           teamSize: required
// plan      plan: required; 'business' is not allowed when teamSize is 'solo' (MESSAGES.planNeedsTeam)
//           acceptTerms: must be true

export function validateAccount(data: SignupData): FieldErrors {
  // TODO
  return {};
}

export function validateWorkspace(data: SignupData): FieldErrors {
  // TODO
  return {};
}

export function validatePlan(data: SignupData): FieldErrors {
  // TODO
  return {};
}

/** Errors for one step. The review step has no fields of its own → {}. */
export function validateStep(step: StepId, data: SignupData): FieldErrors {
  // TODO
  return {};
}

/** The first step (in STEPS order) that has errors, or null when everything is valid. */
export function firstInvalidStep(data: SignupData): StepId | null {
  // TODO
  return null;
}

/** What onSubmit receives: name, email and workspace trimmed; everything else unchanged. Returns a new object. */
export function normalize(data: SignupData): SignupData {
  return { ...data };
}
