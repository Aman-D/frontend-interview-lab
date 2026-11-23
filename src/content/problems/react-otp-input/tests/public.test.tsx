import OtpInput from '../OtpInput';
import { boxes, key, pasteInto, typeInto, typeSequence, values } from './helpers';

describe('OtpInput — public', () => {
  it('renders a labelled group of N boxes named "Digit i of N"', () => {
    render(<OtpInput length={6} />);
    expect(screen.getByRole('group', { name: 'Verification code' })).toBeInTheDocument();
    expect(boxes()).toHaveLength(6);
    expect(screen.getByRole('textbox', { name: 'Digit 1 of 6' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Digit 6 of 6' })).toBeInTheDocument();
  });

  it('typing a digit fills the box and moves focus to the next one', () => {
    const onChange = fn();
    render(<OtpInput onChange={onChange} />);
    typeInto(boxes()[0], '4');
    expect(values()).toEqual(['4', '', '', '', '', '']);
    expect(boxes()[1]).toHaveFocus();
    expect(onChange).toHaveBeenLastCalledWith('4');
    typeSequence('2');
    expect(values()).toEqual(['4', '2', '', '', '', '']);
    expect(boxes()[2]).toHaveFocus();
  });

  it('rejects non-digits: the box stays empty and focus does not move', () => {
    const onChange = fn();
    render(<OtpInput onChange={onChange} />);
    typeInto(boxes()[0], 'a');
    typeInto(boxes()[0], ' ');
    expect(values()[0]).toBe('');
    expect(boxes()[0]).toHaveFocus();
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  it('Backspace on an empty box clears the previous box and moves focus back', () => {
    render(<OtpInput />);
    typeInto(boxes()[0], '1');
    typeSequence('2');
    expect(boxes()[2]).toHaveFocus();
    key('Backspace');
    expect(values()).toEqual(['1', '', '', '', '', '']);
    expect(boxes()[1]).toHaveFocus();
  });

  it('pasting a full code into the first box fills every box', () => {
    const onComplete = fn();
    render(<OtpInput onComplete={onComplete} />);
    const notPrevented = pasteInto(boxes()[0], '123456');
    expect(notPrevented).toBe(false);
    expect(values()).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(boxes()[5]).toHaveFocus();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('onComplete fires exactly once when the last box is filled by typing', () => {
    const onComplete = fn();
    render(<OtpInput length={4} onComplete={onComplete} />);
    typeInto(boxes()[0], '9');
    typeSequence('87');
    expect(onComplete).toHaveBeenCalledTimes(0);
    typeSequence('6');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('9876');
    key('ArrowLeft');
    key('ArrowRight');
    act(() => boxes()[0].focus());
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
