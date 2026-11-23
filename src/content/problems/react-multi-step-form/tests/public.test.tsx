import { MESSAGES } from '../steps';
import { VALID, currentStep, description, fillAccount, fillWorkspace, goToReview, next, primary, renderWizard, stepHeading } from './helpers';

describe('SignupWizard — public', () => {
  it('starts on step 1 with a step indicator, labelled fields and no errors', () => {
    renderWizard();
    expect(stepHeading()).toHaveTextContent('Step 1 of 4: Account');
    const nav = screen.getByRole('navigation', { name: 'Signup progress' });
    expect(within(nav).getAllByRole('listitem').map((li: HTMLElement) => li.textContent?.trim())).toEqual(['Account', 'Workspace', 'Plan', 'Review']);
    expect(nav.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
    expect(currentStep()).toBe('Account');
    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    expect(document.activeElement).toBe(document.body); // nothing steals focus on load
  });

  it('Next on an invalid step shows errors under the fields, an error summary, and focuses the first invalid field', () => {
    const { onSubmit } = renderWizard();
    next();
    expect(stepHeading()).toHaveTextContent('Step 1 of 4: Account');
    const name = screen.getByLabelText('Full name');
    const email = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Password');
    for (const el of [name, email, password]) expect(el).toHaveAttribute('aria-invalid', 'true');
    expect(description(name)).toContain(MESSAGES.nameRequired);
    expect(description(email)).toContain(MESSAGES.emailRequired);
    expect(description(password)).toContain(MESSAGES.passwordRequired);
    const summary = screen.getByRole('alert');
    expect(summary).toHaveTextContent('There are 3 errors on this step');
    expect(summary).toHaveTextContent(MESSAGES.emailRequired);
    expect(name).toHaveFocus();
    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('a valid step advances, moves focus to the new step heading and updates aria-current', () => {
    renderWizard();
    fillAccount();
    next();
    expect(stepHeading()).toHaveTextContent('Step 2 of 4: Workspace');
    expect(stepHeading()).toHaveFocus();
    expect(currentStep()).toBe('Workspace');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('Back keeps what was entered on every step', () => {
    renderWizard();
    fillAccount();
    next();
    fillWorkspace({ workspace: 'Half done' });
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(stepHeading()).toHaveTextContent('Step 1 of 4: Account');
    expect(stepHeading()).toHaveFocus();
    expect(screen.getByLabelText('Full name')).toHaveValue(VALID.name);
    expect(screen.getByLabelText('Email')).toHaveValue(VALID.email);
    expect(screen.getByLabelText('Password')).toHaveValue(VALID.password);
    next();
    expect(screen.getByLabelText('Workspace name')).toHaveValue('Half done');
  });

  it('review shows the answers (password masked); submit is pending, called once, then succeeds', async () => {
    const d = deferred<void>();
    const { onSubmit } = renderWizard({ onSubmit: fn(() => d.promise) });
    goToReview();
    expect(stepHeading()).toHaveTextContent('Step 4 of 4: Review');
    expect(currentStep()).toBe('Review');
    const review = stepHeading().closest('form')!;
    for (const text of ['Grace Hopper', 'grace@example.com', 'Compilers', '2–10 people', 'Pro']) expect(review).toHaveTextContent(text);
    expect(review).not.toHaveTextContent(VALID.password);

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(VALID);
    expect(primary()).toHaveTextContent('Creating account…');
    expect(primary()).toBeDisabled();

    d.resolve();
    await flush();
    const done = screen.getByRole('heading', { name: 'Account created' });
    expect(done).toHaveFocus();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
