import SignupWizard, { type SignupWizardProps } from '../SignupWizard';
import type { SignupData, StorageLike } from '../types';

export const VALID: SignupData = {
  name: 'Grace Hopper',
  email: 'grace@example.com',
  password: 'cobol1959',
  workspace: 'Compilers',
  teamSize: 'small',
  plan: 'pro',
  acceptTerms: true,
};

/** In-memory StorageLike; `map` lets tests inspect exactly what was written. */
export function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  const storage: StorageLike & { map: Map<string, string> } = {
    map,
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
  return storage;
}

/** Renders the wizard with persistence OFF unless the test passes `storage`. */
export function renderWizard(props: Partial<SignupWizardProps> = {}) {
  const onSubmit = props.onSubmit ?? fn(() => Promise.resolve());
  const utils = render(<SignupWizard storage={null} {...props} onSubmit={onSubmit} />);
  return { ...utils, onSubmit: onSubmit as ReturnType<typeof fn> };
}

export const stepHeading = () => screen.getByRole('heading', { name: /^Step \d of 4: / });
export const currentStep = () => screen.getByRole('navigation', { name: 'Signup progress' }).querySelector('[aria-current="step"]')?.textContent?.trim();
export const form = () => screen.getByRole('form', { name: 'Create your workspace' });
export const primary = () => screen.getByRole('button', { name: /^(Next|Save and review|Create account|Creating account…)$/ });

export function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

/** Text of the element(s) referenced by aria-describedby. */
export function description(el: HTMLElement) {
  return (el.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent?.trim() ?? `(missing #${id})`)
    .join(' | ');
}

export function fillAccount(d: Partial<SignupData> = VALID) {
  if (d.name !== undefined) type('Full name', d.name);
  if (d.email !== undefined) type('Email', d.email);
  if (d.password !== undefined) type('Password', d.password);
}

export function fillWorkspace(d: Partial<SignupData> = VALID) {
  if (d.workspace !== undefined) type('Workspace name', d.workspace);
  if (d.teamSize !== undefined) fireEvent.change(screen.getByLabelText('Team size'), { target: { value: d.teamSize } });
}

export const planRadio = (label: string) => screen.getByRole('radio', { name: new RegExp(`^${label}\\b`) });

export function fillPlan(d: Partial<SignupData> = VALID) {
  if (d.plan) fireEvent.click(planRadio(d.plan[0].toUpperCase() + d.plan.slice(1)));
  if (d.acceptTerms) fireEvent.click(screen.getByRole('checkbox', { name: 'I accept the terms of service' }));
}

export const next = () => fireEvent.click(primary());

/** Fills every step with `d` and stops on the review step. */
export function goToReview(d: SignupData = VALID) {
  fillAccount(d);
  next();
  fillWorkspace(d);
  next();
  fillPlan(d);
  next();
}
