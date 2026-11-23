import { EventEmitter } from '../solution';

describe('EventEmitter — hidden', () => {
  it('the same function subscribed twice is called twice, and each unsubscribe removes only its own subscription', () => {
    const emitter = new EventEmitter();
    const spy = fn();
    const first = emitter.on('change', spy);
    emitter.on('change', spy);
    emitter.emit('change');
    expect(spy).toHaveBeenCalledTimes(2);

    first();
    first(); // calling it again must not remove the second subscription
    emitter.emit('change');
    expect(spy).toHaveBeenCalledTimes(3);
    expect(emitter.listenerCount('change')).toBe(1);
  });

  it('a listener that unsubscribes itself during emit does not cause the next listener to be skipped', () => {
    const emitter = new EventEmitter();
    const calls = [];
    const unsubscribeA = emitter.on('e', () => { calls.push('a'); unsubscribeA(); });
    emitter.on('e', () => calls.push('b'));
    emitter.on('e', () => calls.push('c'));
    emitter.emit('e');
    expect(calls).toEqual(['a', 'b', 'c']);
    emitter.emit('e');
    expect(calls).toEqual(['a', 'b', 'c', 'b', 'c']);
  });

  it('a listener added during emit is not called until the next emit', () => {
    const emitter = new EventEmitter();
    const late = fn();
    emitter.on('e', () => emitter.on('e', late));
    emitter.emit('e');
    expect(late).toHaveBeenCalledTimes(0);
    emitter.emit('e');
    expect(late).toHaveBeenCalledTimes(1);
  });

  it('a once() listener is removed before it runs, so a re-entrant emit does not call it again', () => {
    const emitter = new EventEmitter();
    const spy = fn(() => emitter.emit('ping'));
    emitter.once('ping', spy);
    emitter.emit('ping');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(emitter.listenerCount('ping')).toBe(0);
  });

  it('once() returns an unsubscribe function, and off() also removes once() listeners', () => {
    const emitter = new EventEmitter();
    const a = fn();
    const b = fn();
    const cancel = emitter.once('ready', a);
    emitter.once('ready', b);
    cancel();
    emitter.off('ready', b);
    expect(emitter.emit('ready')).toBe(false);
    expect(a).toHaveBeenCalledTimes(0);
    expect(b).toHaveBeenCalledTimes(0);
  });

  it('keeps events and instances isolated, including names like "constructor"', () => {
    const one = new EventEmitter();
    const two = new EventEmitter();
    const spy = fn();
    one.on('constructor', spy);
    two.emit('constructor');
    one.emit('toString');
    expect(spy).toHaveBeenCalledTimes(0);
    expect(two.listenerCount('constructor')).toBe(0);
    one.emit('constructor');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('off() for an unknown event or listener is a no-op', () => {
    const emitter = new EventEmitter();
    const spy = fn();
    emitter.on('x', spy);
    expect(() => emitter.off('nope', spy)).not.toThrow();
    expect(() => emitter.off('x', () => {})).not.toThrow();
    emitter.emit('x');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
