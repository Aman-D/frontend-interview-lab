import { firstInvalidStep, validateAccount, validatePlan, validateStep, validateWorkspace } from '../validation';
import { EMPTY_DATA, MESSAGES } from '../steps';
import { VALID } from './helpers';

describe('validation — public', () => {
  it('validateAccount reports every missing field and nothing for valid data', () => {
    expect(validateAccount(EMPTY_DATA)).toEqual({ name: MESSAGES.nameRequired, email: MESSAGES.emailRequired, password: MESSAGES.passwordRequired });
    expect(validateAccount(VALID)).toEqual({});
    expect(validateAccount({ ...VALID, name: '   ' })).toEqual({ name: MESSAGES.nameRequired });
  });

  it('validateAccount checks the email format and the password rules in order', () => {
    expect(validateAccount({ ...VALID, email: 'grace' }).email).toBe(MESSAGES.emailInvalid);
    expect(validateAccount({ ...VALID, email: 'grace@example' }).email).toBe(MESSAGES.emailInvalid);
    expect(validateAccount({ ...VALID, password: 'abc1' }).password).toBe(MESSAGES.passwordTooShort);
    expect(validateAccount({ ...VALID, password: 'abc' }).password).toBe(MESSAGES.passwordTooShort); // both rules fail → length first
    expect(validateAccount({ ...VALID, password: 'abcdefghij' }).password).toBe(MESSAGES.passwordNeedsNumber);
  });

  it('validateWorkspace requires a 3–40 character name and a team size', () => {
    expect(validateWorkspace(EMPTY_DATA)).toEqual({ workspace: MESSAGES.workspaceRequired, teamSize: MESSAGES.teamSizeRequired });
    expect(validateWorkspace({ ...VALID, workspace: 'ab' })).toEqual({ workspace: MESSAGES.workspaceLength });
    expect(validateWorkspace(VALID)).toEqual({});
  });

  it('validatePlan requires a plan and the terms, and rejects Business for a team of one', () => {
    expect(validatePlan(EMPTY_DATA)).toEqual({ plan: MESSAGES.planRequired, acceptTerms: MESSAGES.termsRequired });
    expect(validatePlan({ ...VALID, plan: 'business', teamSize: 'solo' })).toEqual({ plan: MESSAGES.planNeedsTeam });
    expect(validatePlan({ ...VALID, plan: 'business', teamSize: 'small' })).toEqual({});
  });

  it('validateStep dispatches per step and firstInvalidStep finds the earliest broken step', () => {
    expect(validateStep('workspace', EMPTY_DATA)).toEqual(validateWorkspace(EMPTY_DATA));
    expect(validateStep('review', EMPTY_DATA)).toEqual({});
    expect(firstInvalidStep(EMPTY_DATA)).toBe('account');
    expect(firstInvalidStep({ ...VALID, acceptTerms: false })).toBe('plan');
    expect(firstInvalidStep(VALID)).toBeNull();
  });
});
