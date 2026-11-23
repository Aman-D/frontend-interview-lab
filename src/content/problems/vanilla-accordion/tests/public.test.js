describe('accordion — public', () => {
  beforeEach(() => {
    mount();
  });

  const header = (name) => screen.getByRole('button', { name });

  it('each header is a button inside a heading, and aria-controls points at a labelled region', () => {
    const heading = screen.getByRole('heading', { level: 3, name: 'When will my order ship?' });
    const button = within(heading).getByRole('button', { name: 'When will my order ship?' });
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    expect(panel).toHaveAttribute('role', 'region');
    expect(panel).toHaveAttribute('aria-labelledby', button.id);
  });

  it('clicking a collapsed header expands its panel', () => {
    const button = header('How do returns work?');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', { name: 'How do returns work?' })).toBe(null);

    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    const region = screen.getByRole('region', { name: 'How do returns work?' });
    expect(region).toBeVisible();
    expect(region).toHaveTextContent('Start a return within 30 days');
  });

  it('clicking an expanded header collapses its panel', () => {
    const button = header('When will my order ship?');
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    expect(panel).toBeVisible();

    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveAttribute('hidden');
    expect(panel).not.toBeVisible();
  });

  it('in a single-open accordion, opening a section closes the open one', () => {
    const first = header('When will my order ship?');
    const second = header('Can I change my delivery address?');

    fireEvent.click(second);

    expect(second).toHaveAttribute('aria-expanded', 'true');
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('region', { name: 'Can I change my delivery address?' })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'When will my order ship?' })).toBe(null);
  });

  it('the header stays a focusable button whose expanded state can be toggled repeatedly', () => {
    const button = header('Can I change my delivery address?');
    button.focus();
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});
