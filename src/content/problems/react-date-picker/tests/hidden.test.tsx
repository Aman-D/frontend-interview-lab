import DatePicker from '../DatePicker';
import { calendarButton, cell, dialog, focusedDate, gridName, input, isoMonth, openCalendar, press, renderedDates, typeDate } from './helpers';

const TODAY = '2024-03-15';

describe('DatePicker — hidden', () => {
  it('PageUp/PageDown move by month and Shift+PageUp/PageDown by year, clamping the day', () => {
    render(<DatePicker label="Start date" today={TODAY} defaultValue="2024-01-31" locale="en-US" />);
    openCalendar();
    expect(focusedDate()).toBe('2024-01-31');
    press('PageDown');
    expect(focusedDate()).toBe('2024-02-29');
    expect(gridName()).toBe('February 2024');
    press('PageDown');
    expect(focusedDate()).toBe('2024-03-29');
    press('PageUp');
    expect(focusedDate()).toBe('2024-02-29');
    press('PageDown', { shiftKey: true });
    expect(focusedDate()).toBe('2025-02-28');
    expect(gridName()).toBe('February 2025');
    press('PageUp', { shiftKey: true });
    expect(focusedDate()).toBe('2024-02-28');
  });

  it('weekStartsOn reorders the columns, and Home/End go to the start/end of that week', () => {
    const { unmount } = render(<DatePicker label="Start date" today="2024-03-13" weekStartsOn={1} locale="en-US" />);
    openCalendar();
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    const firstRow = screen.getAllByRole('row')[1];
    expect(within(firstRow).getAllByRole('gridcell')[4]).toBe(cell('2024-03-01')); // Friday column
    press('Home');
    expect(focusedDate()).toBe('2024-03-11');
    press('End');
    expect(focusedDate()).toBe('2024-03-17');
    press('Escape');
    unmount();

    render(<DatePicker label="Start date" today="2024-03-01" weekStartsOn={1} locale="en-US" />);
    openCalendar();
    press('Home'); // the week of Fri 1 March starts in February
    expect(focusedDate()).toBe('2024-02-26');
    expect(gridName()).toBe('February 2024');
  });

  it('days outside min/max are disabled: not selectable, and keyboard focus is clamped', () => {
    const onChange = fn();
    render(<DatePicker label="Start date" today={TODAY} min="2024-03-10" max="2024-03-20" locale="en-US" onChange={onChange} />);
    openCalendar();
    expect(cell('2024-03-09')).toHaveAttribute('aria-disabled', 'true');
    expect(cell('2024-03-21')).toHaveAttribute('aria-disabled', 'true');
    expect(cell('2024-03-10')).not.toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(cell('2024-03-21'));
    expect(dialog()).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledTimes(0);
    press('ArrowDown'); // the 22nd is past max → clamp to the 20th
    expect(focusedDate()).toBe('2024-03-20');
    press('PageDown');
    expect(focusedDate()).toBe('2024-03-20');
    press('PageUp', { shiftKey: true });
    expect(focusedDate()).toBe('2024-03-10');
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    fireEvent.click(cell('2024-03-12'));
    expect(onChange).toHaveBeenCalledWith('2024-03-12');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('typed dates outside the range are rejected; Enter commits; clearing the input reports null', () => {
    const onChange = fn();
    render(<DatePicker label="Start date" today={TODAY} min="2024-03-10" max="2024-03-20" locale="en-US" onChange={onChange} />);
    typeDate('2024-03-25');
    expect(screen.getByRole('alert')).toHaveTextContent('2024-03-20');
    expect(onChange).toHaveBeenCalledTimes(0);

    const el = input();
    el.focus();
    fireEvent.change(el, { target: { value: '2024-03-12' } });
    fireEvent.keyDown(el, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('2024-03-12');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(input()).not.toHaveAttribute('aria-invalid', 'true');

    typeDate('');
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(calendarButton()).toHaveAttribute('aria-label', 'Choose date');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('Previous/Next month buttons change the month without stealing focus; clicking a day selects it', () => {
    const onChange = fn();
    render(<DatePicker label="Start date" today={TODAY} locale="en-US" onChange={onChange} />);
    openCalendar();
    const next = screen.getByRole('button', { name: 'Next month' });
    next.focus();
    fireEvent.click(next);
    expect(gridName()).toBe('April 2024');
    expect(next).toHaveFocus();
    expect(cell('2024-04-15')).toHaveAttribute('tabindex', '0');
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(gridName()).toBe('February 2024');
    fireEvent.click(cell('2024-02-02'));
    expect(onChange).toHaveBeenCalledWith('2024-02-02');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(calendarButton()).toHaveFocus();
  });

  it('is a modal dialog: Tab and Shift+Tab wrap between the first and last focusable elements', () => {
    render(<DatePicker label="Start date" today={TODAY} locale="en-US" />);
    openCalendar();
    expect(cell('2024-03-15')).toHaveFocus();
    expect(press('Tab')).toBe(false);
    expect(screen.getByRole('button', { name: 'Previous month' })).toHaveFocus();
    expect(press('Tab', { shiftKey: true })).toBe(false);
    expect(cell('2024-03-15')).toHaveFocus();
  });

  it('marks exactly one today and one selected day, and opens on the selected month', () => {
    const { unmount } = render(<DatePicker label="Start date" today={TODAY} defaultValue="2024-03-03" locale="en-US" />);
    openCalendar();
    expect(focusedDate()).toBe('2024-03-03');
    expect(document.querySelectorAll('[role="grid"] [aria-current="date"]')).toHaveLength(1);
    expect(document.querySelectorAll('[role="grid"] [aria-selected="true"]')).toHaveLength(1);
    expect(cell('2024-03-03')).toHaveAttribute('aria-selected', 'true');
    unmount();

    render(<DatePicker label="Start date" today={TODAY} defaultValue="2023-12-25" locale="en-US" />);
    expect(calendarButton()).toHaveAttribute('aria-label', 'Change date, Monday, December 25, 2023');
    openCalendar();
    expect(gridName()).toBe('December 2023');
    expect(document.querySelectorAll('[role="grid"] [aria-current="date"]')).toHaveLength(0);
  });

  it('daylight-saving months render every day exactly once and day-by-day moves never skip', () => {
    const onChange = fn();
    render(<DatePicker label="Start date" today="2024-03-09" locale="en-US" onChange={onChange} />);
    openCalendar();
    expect(renderedDates()).toEqual(isoMonth(2024, 3, 31));
    press('ArrowRight');
    expect(focusedDate()).toBe('2024-03-10');
    press('ArrowRight');
    expect(focusedDate()).toBe('2024-03-11');
    for (let i = 0; i < 8; i++) press('PageDown');
    expect(gridName()).toBe('November 2024');
    expect(renderedDates()).toEqual(isoMonth(2024, 11, 30));
    press('Escape');
    typeDate('2024-03-31');
    expect(calendarButton()).toHaveAttribute('aria-label', 'Change date, Sunday, March 31, 2024');
    typeDate('2024-10-27');
    expect(calendarButton()).toHaveAttribute('aria-label', 'Change date, Sunday, October 27, 2024');
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
