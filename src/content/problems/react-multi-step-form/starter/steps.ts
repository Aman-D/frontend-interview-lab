import type { Field, Plan, SignupData, StepId, TeamSize } from './types';

/** The wizard's steps in order. `fields` is also the DOM order used to pick "the first invalid field". */
export const STEPS: readonly { id: StepId; title: string; fields: readonly Field[] }[] = [
  { id: 'account', title: 'Account', fields: ['name', 'email', 'password'] },
  { id: 'workspace', title: 'Workspace', fields: ['workspace', 'teamSize'] },
  { id: 'plan', title: 'Plan', fields: ['plan', 'acceptTerms'] },
  { id: 'review', title: 'Review', fields: [] },
];

export const EMPTY_DATA: SignupData = {
  name: '',
  email: '',
  password: '',
  workspace: '',
  teamSize: '',
  plan: '',
  acceptTerms: false,
};

export const TEAM_SIZES: readonly { value: TeamSize; label: string }[] = [
  { value: 'solo', label: 'Just me' },
  { value: 'small', label: '2–10 people' },
  { value: 'medium', label: '11–50 people' },
  { value: 'large', label: '51 or more' },
];

export const PLANS: readonly { value: Plan; label: string; blurb: string }[] = [
  { value: 'free', label: 'Free', blurb: 'Up to 3 projects' },
  { value: 'pro', label: 'Pro', blurb: 'Unlimited projects, priority support' },
  { value: 'business', label: 'Business', blurb: 'SSO, audit log, for teams of 2+' },
];

/** Exact error messages. Use these constants so the tests and the UI agree. */
export const MESSAGES = {
  nameRequired: 'Enter your full name',
  emailRequired: 'Enter your email address',
  emailInvalid: 'Enter an email address like name@example.com',
  passwordRequired: 'Create a password',
  passwordTooShort: 'Password must be at least 8 characters',
  passwordNeedsNumber: 'Password must include a number',
  workspaceRequired: 'Enter a workspace name',
  workspaceLength: 'Workspace name must be between 3 and 40 characters',
  teamSizeRequired: 'Choose your team size',
  planRequired: 'Choose a plan',
  planNeedsTeam: 'The Business plan needs a team of 2 or more. Choose another plan or change your team size.',
  termsRequired: 'Accept the terms to continue',
} as const;
