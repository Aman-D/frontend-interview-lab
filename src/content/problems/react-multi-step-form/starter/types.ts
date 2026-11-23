export type TeamSize = 'solo' | 'small' | 'medium' | 'large';
export type Plan = 'free' | 'pro' | 'business';

/** Everything the wizard collects. Empty string = not chosen yet. */
export interface SignupData {
  name: string;
  email: string;
  password: string;
  workspace: string;
  teamSize: TeamSize | '';
  plan: Plan | '';
  acceptTerms: boolean;
}

export type Field = keyof SignupData;
export type StepId = 'account' | 'workspace' | 'plan' | 'review';

/** One message per invalid field. A field with no entry is valid. */
export type FieldErrors = Partial<Record<Field, string>>;

/** The subset of the Web Storage API the wizard uses (sessionStorage satisfies it). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
