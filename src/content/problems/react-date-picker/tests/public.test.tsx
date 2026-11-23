import DatePicker from '../DatePicker';
import { calendarButton, cell, dialog, focusedDate, gridName, input, isoMonth, openCalendar, press, renderedDates, typeDate } from './helpers';

// 15 March 2024 was a Friday.
const TODAY = '2024-03-15';

describe('DatePicker — public', () => {
  it('renders a labelled input and a calendar button; the calendar starts closed', () => {
    render(<DatePicker label="Start date" today={TODAY} locale="en-US" />);
    expect(input()).toHaveValue('');
    expect(calendarButton()).toHaveAttribute('aria-label', 'Choose date');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens a dialog with a month grid; today is marked and focused, and only it is tabbable', () => {
    render(<DatePicker label="Start date" today={TODAY} locale="en-US" />);
    openCalendar();
    expect(dialog()).toHaveAttribute('aria-modal', 'true');
    expect(gridName()).toBe('March 2024');
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(renderedDates()).toEqual(isoMonth(2024, 3, 31));
    expect(cell('2024-03-15')).toHaveAttribute('aria-current', 'date');
    expect(cell('2024-03-14')).not.toHaveAttribute('aria-current');
    expect(cell('2024-03-15')).toHaveFocus();
    expect(cell('2024-03-15')).toHaveAttribute('tabindex', '0');
    expect(document.querySelectorAll('[role="grid"] [tabindex="0"]')).toHaveLength(1);
  });

  it('arrow keys move by day and by week, changing month when needed', () => {
    render(<DatePicker label="Start date" today={TODAY} locale="en-US" />);
    openCalendar();
    press('ArrowRight');
    expect(focusedDate()).toBe('2024-03-16');
    press('ArrowDown');
    expect(focusedDate()).toBe('2024-03-23');
    press('ArrowDown');
    press('ArrowDown');
    expect(focusedDate()).toBe('2024-04-06');
    expect(gridName()).toBe('April 2024');
    expect(cell('2024-04-06')).toHaveAttribute('tabindex', '0');
    press('ArrowUp');
    expect(focusedDate()).toBe('2024-03-30');
    expect(gridName()).toBe('March 2024');
    expect(press('ArrowLeft')).toBe(false); // handled keys must not scroll the page
    expect(focusedDate()).toBe('2024-03-29');
  });

  it('Enter selects the focused day, closes the dialog and returns focus to the button', () => {
    const onChange = fn();
    render(<DatePicker label="Start date" today={TODAY} locale="en-US" onChange={onChange} />);
    openCalendar();
    for (let i = 0; i < 5; i++) press('ArrowRight');
    press('Enter');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(input()).toHaveValue('2024-03-20');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2024-03-20');
    expect(calendarButton()).toHaveFocus();
    expect(calendarButton()).toHaveAttribute('aria-label', 'Change date, Wednesday, March 20, 2024');

    openCalendar(); // reopens on the selected day
    expect(cell('2024-03-20')).toHaveFocus();
    expect(cell('2024-03-20')).toHaveAttribute('aria-selected', 'true');
    expect(cell('2024-03-15')).not.toHaveAttribute('aria-selected', 'true');
  });

  it('Escape closes without changing anything and returns focus to the button', () => {
    const onChange = fn();
    render(<DatePicker label="Start date" today={TODAY} locale="en-US" onChange={onChange} />);
    openCalendar();
    press('ArrowDown');
    press('Escape');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(input()).toHaveValue('');
    expect(onChange).toHaveBeenCalledTimes(0);
    expect(calendarButton()).toHaveFocus();
  });

  it('parses a typed ISO date on blur; an invalid one shows an error and keeps the old value', () => {
    const onChange = fn();
    render(<DatePicker label="Start date" today={TODAY} locale="en-US" onChange={onChange} />);
    typeDate('2024-02-29');
    expect(onChange).toHaveBeenCalledWith('2024-02-29');
    expect(calendarButton()).toHaveAttribute('aria-label', 'Change date, Thursday, February 29, 2024');
    expect(screen.queryByRole('alert')).toBeNull();

    typeDate('2023-02-29');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(onChange).toHaveBeenCalledTimes(1);
    openCalendar();
    expect(gridName()).toBe('February 2024');
    expect(cell('2024-02-29')).toHaveFocus();
  });
});
