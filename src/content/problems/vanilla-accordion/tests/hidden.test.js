describe('accordion — hidden', () => {
  beforeEach(() => {
    mount();
  });

  const header = (name) => screen.getByRole('button', { name });
  const panelOf = (button) => document.getElementById(button.getAttribute('aria-controls'));

  it('an accordion with data-allow-multiple keeps several sections open', () => {
    const email = header('Email notifications');
    const language = header('Language and region');
    fireEvent.click(email);
    fireEvent.click(language);
    expect(email).toHaveAttribute('aria-expanded', 'true');
    expect(language).toHaveAttribute('aria-expanded', 'true');
    expect(panelOf(email)).toBeVisible();
    expect(panelOf(language)).toBeVisible();
  });

  it('accordions on the same page do not affect each other', () => {
    const faqOpen = header('When will my order ship?');
    fireEvent.click(header('Email notifications'));
    expect(faqOpen).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(header('How do returns work?'));
    expect(header('Email notifications')).toHaveAttribute('aria-expanded', 'true');
  });

  it('a click on an element inside the header button (title or icon) toggles it', () => {
    const button = header('How do returns work?');
    fireEvent.click(button.querySelector('.accordion-title'));
    expect(button).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(button.querySelector('.accordion-icon'));
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('clicks inside panel content do not toggle anything', () => {
    const button = header('When will my order ship?');
    const panel = panelOf(button);
    fireEvent.click(panel.querySelector('p'));
    fireEvent.click(panel);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(panel).toBeVisible();
  });

  it('sections appended after initialisation work without extra wiring (event delegation)', () => {
    const accordion = document.getElementById('faq');
    const heading = document.createElement('h3');
    heading.className = 'accordion-heading';
    heading.innerHTML =
      '<button type="button" class="accordion-trigger" id="faq-trigger-4" aria-expanded="false" aria-controls="faq-panel-4">' +
      '<span class="accordion-title">Do you ship abroad?</span><span class="accordion-icon" aria-hidden="true"></span></button>';
    const panel = document.createElement('div');
    panel.className = 'accordion-panel';
    panel.id = 'faq-panel-4';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', 'faq-trigger-4');
    panel.hidden = true;
    panel.textContent = 'We ship to most countries in Europe.';
    accordion.append(heading, panel);

    const added = header('Do you ship abroad?');
    fireEvent.click(added);
    expect(added).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: 'Do you ship abroad?' })).toBeVisible();
    // single-open still applies to the new section
    expect(header('When will my order ship?')).toHaveAttribute('aria-expanded', 'false');
  });

  it('ArrowDown / ArrowUp move focus between headers of the same accordion and wrap around', () => {
    const first = header('When will my order ship?');
    const second = header('Can I change my delivery address?');
    const last = header('How do returns work?');

    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(second).toHaveFocus();
    fireEvent.keyDown(second, { key: 'ArrowDown' });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: 'ArrowDown' });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: 'ArrowUp' });
    expect(last).toHaveFocus();
    // moving focus must not change which sections are open
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(last).toHaveAttribute('aria-expanded', 'false');
  });

  it('Home / End move focus to the first / last header; arrow keys inside panels are left alone', () => {
    const first = header('Email notifications');
    const last = header('Language and region');
    first.focus();
    fireEvent.keyDown(first, { key: 'End' });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: 'Home' });
    expect(first).toHaveFocus();

    fireEvent.click(first);
    const checkbox = screen.getByRole('checkbox', { name: 'Shipping updates' });
    checkbox.focus();
    fireEvent.keyDown(checkbox, { key: 'ArrowDown' });
    expect(checkbox).toHaveFocus();
  });
});
