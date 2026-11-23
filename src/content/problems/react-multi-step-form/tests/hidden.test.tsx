import { MESSAGES } from '../steps';
import type { StorageLike } from '../types';
import { VALID, currentStep, description, fillAccount, fillPlan, fillWorkspace, form, goToReview, memoryStorage, next, planRadio, primary, renderWizard, stepHeading, type } from './helpers';

describe('SignupWizard — hidden', () => {
  it('focuses the first INVALID field; errors appear only after an attempt and then update as the user types', () => {
    renderWizard();
    type('Email', 'not-an-email');
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid', 'true'); // no nagging before Next
    type('Full name', 'Grace Hopper');
    next();
    const email = screen.getByLabelText('Email');
    expect(email).toHaveFocus();
    expect(description(email)).toContain(MESSAGES.emailInvalid);
    expect(screen.getByLabelText('Full name')).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('There are 2 errors on this step');

    type('Email', 'grace@example.com');
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('There is 1 error on this step');
    type('Password', 'short1');
    expect(description(screen.getByLabelText('Password'))).toContain(MESSAGES.passwordTooShort);
    type('Password', 'longer123');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('is a real form: submitting it (Enter) runs the same validation as Next', () => {
    renderWizard();
    expect(form().tagName).toBe('FORM');
    expect(primary()).toHaveAttribute('type', 'submit');
    // fireEvent returns false when a handler called preventDefault(): the browser must not navigate.
    expect(fireEvent.submit(form())).toBe(false);
    expect(stepHeading()).toHaveTextContent('Step 1 of 4: Account');
    expect(screen.getByLabelText('Full name')).toHaveFocus();
    fillAccount();
    fireEvent.submit(form());
    expect(stepHeading()).toHaveTextContent('Step 2 of 4: Workspace');
  });

  it('the plan step groups radios in a fieldset; an empty attempt focuses the first radio and flags the checkbox', () => {
    renderWizard();
    fillAccount();
    next();
    fillWorkspace();
    next();
    const group = screen.getByRole('group', { name: 'Choose a plan' });
    expect(within(group).getAllByRole('radio')).toHaveLength(3);
    next();
    expect(stepHeading()).toHaveTextContent('Step 3 of 4: Plan');
    expect(planRadio('Free')).toHaveFocus();
    expect(planRadio('Free')).toHaveAttribute('aria-invalid', 'true');
    expect(description(planRadio('Free'))).toContain(MESSAGES.planRequired);
    const terms = screen.getByRole('checkbox', { name: 'I accept the terms of service' });
    expect(terms).toHaveAttribute('aria-invalid', 'true');
    expect(description(terms)).toContain(MESSAGES.termsRequired);
  });

  it('review → Edit returns straight to review, and re-validates steps an edit has invalidated', () => {
    renderWizard();
    goToReview({ ...VALID, plan: 'business' });
    fireEvent.click(screen.getByRole('button', { name: 'Edit workspace' }));
    expect(stepHeading()).toHaveTextContent('Step 2 of 4: Workspace');
    expect(stepHeading()).toHaveFocus();
    expect(screen.getByLabelText('Workspace name')).toHaveValue('Compilers');
    type('Workspace name', 'Compilers Inc');
    next(); // "Save and review"
    expect(stepHeading()).toHaveTextContent('Step 4 of 4: Review');
    expect(stepHeading().closest('form')!).toHaveTextContent('Compilers Inc');

    // Now make the earlier Business choice invalid from step 2.
    fireEvent.click(screen.getByRole('button', { name: 'Edit workspace' }));
    expect(primary()).toHaveTextContent('Save and review');
    fireEvent.change(screen.getByLabelText('Team size'), { target: { value: 'solo' } });
    next();
    expect(stepHeading()).toHaveTextContent('Step 3 of 4: Plan');
    expect(currentStep()).toBe('Plan');
    const business = planRadio('Business');
    expect(business).toHaveFocus();
    expect(business).toHaveAttribute('aria-invalid', 'true');
    expect(description(business)).toContain(MESSAGES.planNeedsTeam);
    fillPlan({ plan: 'pro' });
    next();
    expect(stepHeading()).toHaveTextContent('Step 4 of 4: Review');
  });

  it('a failed submit shows the error, keeps the answers, and can be retried', async () => {
    const onSubmit = fn();
    onSubmit.mockImplementationOnce(() => Promise.reject(new Error('server unavailable')));
    onSubmit.mockImplementationOnce(() => Promise.resolve());
    renderWizard({ onSubmit });
    goToReview({ ...VALID, name: '  Grace Hopper  ', email: ' grace@example.com ' });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await flush();
    expect(screen.getByRole('alert')).toHaveTextContent('server unavailable');
    const retry = screen.getByRole('button', { name: 'Create account' });
    expect(retry).not.toBeDisabled();
    expect(retry).toHaveFocus();
    expect(stepHeading().closest('form')!).toHaveTextContent('Grace Hopper');

    fireEvent.click(retry);
    await flush();
    expect(screen.getByRole('heading', { name: 'Account created' })).toHaveFocus();
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(onSubmit.mock.calls[1][0]).toEqual(VALID); // normalised (trimmed) both times
    expect(onSubmit.mock.calls[0][0]).toEqual(VALID);
  });

  it('cannot double-submit while pending; navigation is disabled until it settles', async () => {
    const d = deferred<void>();
    const onSubmit = fn(() => d.promise);
    renderWizard({ onSubmit });
    goToReview();
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    fireEvent.click(primary());
    fireEvent.submit(form());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Edit account' })).toBeDisabled();
    expect(form()).toHaveAttribute('aria-busy', 'true');
    d.resolve();
    await flush();
    expect(screen.getByRole('heading', { name: 'Account created' })).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('progress survives a reload via storage — never the password — and is cleared after success', async () => {
    const storage = memoryStorage();
    const first = renderWizard({ storage });
    fillAccount();
    next();
    type('Workspace name', 'Compilers');
    first.unmount();
    for (const value of storage.map.values()) expect(value).not.toContain(VALID.password);
    expect(storage.map.has('signup-wizard')).toBe(true);

    renderWizard({ storage });
    expect(stepHeading()).toHaveTextContent('Step 2 of 4: Workspace');
    expect(screen.getByLabelText('Workspace name')).toHaveValue('Compilers');
    fireEvent.change(screen.getByLabelText('Team size'), { target: { value: 'small' } });
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByLabelText('Full name')).toHaveValue(VALID.name);
    expect(screen.getByLabelText('Password')).toHaveValue('');
    type('Password', VALID.password);
    next();
    next();
    fillPlan();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await flush();
    expect(screen.getByRole('heading', { name: 'Account created' })).toBeInTheDocument();
    expect(storage.map.has('signup-wizard')).toBe(false);
  });

  it('restored or broken storage is handled defensively; submit re-validates every step', () => {
    // Restored straight onto the review step: the password was (correctly) never saved.
    const saved = { v: 1, step: 'review', data: { ...VALID, password: undefined } };
    const { onSubmit, unmount } = renderWizard({ storage: memoryStorage({ 'signup-wizard': JSON.stringify(saved) }) });
    expect(stepHeading()).toHaveTextContent('Step 4 of 4: Review');
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(onSubmit).toHaveBeenCalledTimes(0);
    expect(stepHeading()).toHaveTextContent('Step 1 of 4: Account');
    expect(screen.getByLabelText('Password')).toHaveFocus();
    expect(description(screen.getByLabelText('Password'))).toContain(MESSAGES.passwordRequired);
    unmount();

    // Corrupt JSON → a fresh start.
    const corrupt = renderWizard({ storage: memoryStorage({ 'signup-wizard': '{not json' }) });
    expect(stepHeading()).toHaveTextContent('Step 1 of 4: Account');
    corrupt.unmount();

    // Storage that throws on every call (blocked storage, quota) must not break the form.
    const boom = () => {
      throw new Error('SecurityError');
    };
    const throwing: StorageLike = { getItem: boom, setItem: boom, removeItem: boom };
    const broken = renderWizard({ storage: throwing });
    fillAccount();
    next();
    expect(stepHeading()).toHaveTextContent('Step 2 of 4: Workspace');
    broken.unmount();

    // Default storage (sessionStorage, which throws in this sandbox) must not break it either.
    renderWizard({ storage: undefined });
    fillAccount();
    next();
    expect(stepHeading()).toHaveTextContent('Step 2 of 4: Workspace');
  });
});
