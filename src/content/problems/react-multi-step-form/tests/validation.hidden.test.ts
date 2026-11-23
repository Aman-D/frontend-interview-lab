import { firstInvalidStep, normalize, validateAccount, validatePlan, validateWorkspace } from '../validation';
import { MESSAGES } from '../steps';
import type { SignupData } from '../types';
import { VALID } from './helpers';

const frozen = (d: SignupData) => Object.freeze({ ...d });

describe('validation — hidden', () => {
  it('email: trimmed, needs a local part, no spaces, a dotted domain and a TLD of 2+ characters', () => {
    const email = (value: string) => validateAccount({ ...VALID, email: value }).email;
    expect(email('  grace@example.com  ')).toBeUndefined();
    expect(email('g.hopper+navy@mail.example.co')).toBeUndefined();
    expect(email('   ')).toBe(MESSAGES.emailRequired);
    for (const bad of ['@example.com', 'grace@', 'grace @example.com', 'grace@example.c', 'grace@@example.com']) {
      expect(email(bad)).toBe(MESSAGES.emailInvalid);
    }
  });

  it('password: exactly 8 characters is enough, spaces are not trimmed', () => {
    const password = (value: string) => validateAccount({ ...VALID, password: value }).password;
    expect(password('abcdefg1')).toBeUndefined();
    expect(password('abcdef1')).toBe(MESSAGES.passwordTooShort);
    expect(password('        ')).toBe(MESSAGES.passwordNeedsNumber);
    expect(password(' pass 1 x')).toBeUndefined();
  });

  it('workspace length is measured after trimming, inclusive at 3 and 40', () => {
    const ws = (value: string) => validateWorkspace({ ...VALID, workspace: value }).workspace;
    expect(ws('   ')).toBe(MESSAGES.workspaceRequired);
    expect(ws('  ab  ')).toBe(MESSAGES.workspaceLength);
    expect(ws('  abc  ')).toBeUndefined();
    expect(ws('x'.repeat(40))).toBeUndefined();
    expect(ws('x'.repeat(41))).toBe(MESSAGES.workspaceLength);
  });

  it('the Business rule only applies to a solo team; a missing team size is the workspace step\'s error', () => {
    expect(validatePlan({ ...VALID, plan: 'business', teamSize: '' })).toEqual({});
    expect(validatePlan({ ...VALID, plan: 'free', teamSize: 'solo' })).toEqual({});
    expect(firstInvalidStep({ ...VALID, plan: 'business', teamSize: 'solo' })).toBe('plan');
    expect(firstInvalidStep({ ...VALID, email: 'nope', acceptTerms: false })).toBe('account');
  });

  it('validators and normalize are pure', () => {
    const input = frozen({ ...VALID, name: '  Grace  ', email: ' grace@example.com ', workspace: ' Compilers ', password: ' pass word1 ' });
    expect(() => validateAccount(input)).not.toThrow();
    expect(validateAccount(input)).not.toBe(validateAccount(input));
    const out = normalize(input);
    expect(out).not.toBe(input);
    expect(out).toEqual({ ...input, name: 'Grace', email: 'grace@example.com', workspace: 'Compilers', password: ' pass word1 ' });
    expect(input.name).toBe('  Grace  ');
  });
});
