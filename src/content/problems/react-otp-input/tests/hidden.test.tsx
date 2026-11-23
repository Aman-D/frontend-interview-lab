import { useState } from 'react';
import OtpInput from '../OtpInput';
import { boxes, key, pasteInto, typeInto, typeSequence, values } from './helpers';

describe('OtpInput — hidden', () => {
  it('first box asks for the SMS code; all boxes use a numeric keyboard and type="text"', () => {
    render(<OtpInput />);
    const [first, ...rest] = boxes();
    expect(first).toHaveAttribute('autocomplete', 'one-time-code');
    rest.forEach((b) => expect(b.getAttribute('autocomplete')).not.toBe('one-time-code'));
    boxes().forEach((b) => {
      expect(b).toHaveAttribute('inputmode', 'numeric');
      expect(b).toHaveAttribute('type', 'text');
      expect(b.maxLength === 1).toBe(false); // maxLength=1 would truncate SMS autofill
    });
  });

  it('SMS autofill puts the whole code into the first box: it is distributed', () => {
    const onComplete = fn();
    render(<OtpInput onComplete={onComplete} />);
    fireEvent.change(boxes()[0], { target: { value: '482913' } });
    expect(values()).toEqual(['4', '8', '2', '9', '1', '3']);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('482913');
  });

  it('a partial paste fills from the focused box, strips separators and cuts overflow', () => {
    const onComplete = fn();
    render(<OtpInput onComplete={onComplete} />);
    pasteInto(boxes()[2], '9-8 7');
    expect(values()).toEqual(['', '', '9', '8', '7', '']);
    expect(boxes()[5]).toHaveFocus();
    pasteInto(boxes()[4], '12345678');
    expect(values()).toEqual(['', '', '9', '8', '1', '2']);
    expect(boxes()[5]).toHaveFocus();
    pasteInto(boxes()[0], 'abc');
    expect(values()).toEqual(['', '', '9', '8', '1', '2']);
    expect(onComplete).toHaveBeenCalledTimes(0);
  });

  it('after completing, onComplete fires again only after an edit that completes it again', () => {
    const first = fn();
    const second = fn();
    const { rerender } = render(<OtpInput length={4} onComplete={first} />);
    pasteInto(boxes()[0], '1234');
    expect(first).toHaveBeenCalledTimes(1);
    rerender(<OtpInput length={4} onComplete={second} />);
    expect(second).toHaveBeenCalledTimes(0);
    typeInto(boxes()[3], '4'); // same digit: no change
    expect(second).toHaveBeenCalledTimes(0);
    pasteInto(boxes()[0], '1234'); // same code again: nothing changed, nothing to report
    expect(second).toHaveBeenCalledTimes(0);
    act(() => boxes()[3].focus());
    key('Backspace');
    expect(values()).toEqual(['1', '2', '3', '']);
    expect(second).toHaveBeenCalledTimes(0);
    typeInto(boxes()[3], '7');
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith('1237');
    expect(first).toHaveBeenCalledTimes(1);
  });

  it('arrows move focus and stop at the ends; Backspace on a filled box clears it in place', () => {
    render(<OtpInput length={4} />);
    pasteInto(boxes()[0], '5678');
    act(() => boxes()[1].focus());
    key('ArrowLeft');
    expect(boxes()[0]).toHaveFocus();
    key('ArrowLeft');
    expect(boxes()[0]).toHaveFocus();
    key('ArrowRight');
    key('ArrowRight');
    expect(boxes()[2]).toHaveFocus();
    key('Backspace');
    expect(values()).toEqual(['5', '6', '', '8']);
    expect(boxes()[2]).toHaveFocus();
    act(() => boxes()[0].focus());
    key('Backspace');
    key('Backspace'); // first box now empty: nothing before it
    expect(values()).toEqual(['', '6', '', '8']);
    expect(boxes()[0]).toHaveFocus();
  });

  it('typing over a filled box replaces its digit', () => {
    render(<OtpInput length={4} />);
    typeInto(boxes()[0], '3');
    typeInto(boxes()[0], '37'); // caret after the old digit
    expect(values()).toEqual(['7', '', '', '']);
    expect(boxes()[1]).toHaveFocus();
    typeInto(boxes()[0], '57'); // caret before it
    expect(values()).toEqual(['5', '', '', '']);
  });

  it('disabled and error states', () => {
    const { unmount } = render(<OtpInput length={4} disabled />);
    boxes().forEach((b) => expect(b).toBeDisabled());
    unmount();

    render(<OtpInput length={4} error="Code expired. Request a new one." label="SMS code" />);
    expect(screen.getByRole('group', { name: 'SMS code' })).toBeInTheDocument();
    boxes().forEach((b) => {
      expect(b).toHaveAttribute('aria-invalid', 'true');
      const id = b.getAttribute('aria-describedby') ?? '';
      expect(document.getElementById(id.split(' ')[0])).toHaveTextContent('Code expired. Request a new one.');
    });
  });

  it('controlled: renders from `value`, reports positional values and obeys the parent', () => {
    const onChange = fn();
    const { rerender } = render(<OtpInput value="12" onChange={onChange} />);
    expect(values()).toEqual(['1', '2', '', '', '', '']);
    typeInto(boxes()[3], '4');
    expect(onChange).toHaveBeenLastCalledWith('12 4');
    expect(values()[3]).toBe(''); // parent did not accept it
    rerender(<OtpInput value="12 4" onChange={onChange} />);
    expect(values()).toEqual(['1', '2', '', '4', '', '']);

    function Parent() {
      const [v, setV] = useState('');
      return (
        <>
          <OtpInput length={4} value={v} onChange={setV} />
          <output>{JSON.stringify(v)}</output>
        </>
      );
    }
    rerender(<Parent />);
    typeInto(boxes()[0], '8');
    typeSequence('1');
    expect(values()).toEqual(['8', '1', '', '']);
    expect(screen.getByText('"81"')).toBeInTheDocument();
  });
});
