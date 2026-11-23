import { TypedEmitter } from '../solution';

type Events = {
  add: [a: number, b: number];
  clear: [];
};

describe('TypedEmitter runtime — public', () => {
  it('calls listeners with the emitted arguments, in subscription order', () => {
    const emitter = new TypedEmitter<Events>();
    const calls: string[] = [];
    emitter.on('add', (a, b) => calls.push(`first ${a + b}`));
    emitter.on('add', (a, b) => calls.push(`second ${a * b}`));
    emitter.emit('add', 3, 4);
    expect(calls).toEqual(['first 7', 'second 12']);
  });

  it('on() returns a function that unsubscribes', () => {
    const emitter = new TypedEmitter<Events>();
    const spy = fn();
    const unsubscribe = emitter.on('clear', spy);
    emitter.emit('clear');
    unsubscribe();
    emitter.emit('clear');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('off() removes a listener', () => {
    const emitter = new TypedEmitter<Events>();
    const spy = fn();
    emitter.on('clear', spy);
    emitter.off('clear', spy);
    emitter.emit('clear');
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('events are independent and emitting without listeners is a no-op', () => {
    const emitter = new TypedEmitter<Events>();
    const spy = fn();
    emitter.on('add', spy);
    expect(() => emitter.emit('clear')).not.toThrow();
    expect(spy).toHaveBeenCalledTimes(0);
  });
});
