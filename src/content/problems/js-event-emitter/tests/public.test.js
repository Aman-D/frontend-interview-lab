import { EventEmitter } from '../solution';

describe('EventEmitter — public', () => {
  it('calls a listener with the emitted arguments', () => {
    const emitter = new EventEmitter();
    const spy = fn();
    emitter.on('save', spy);
    emitter.emit('save', 'doc-1', { force: true });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('doc-1', { force: true });
  });

  it('calls listeners in subscription order', () => {
    const emitter = new EventEmitter();
    const order = [];
    emitter.on('tick', () => order.push('a'));
    emitter.on('tick', () => order.push('b'));
    emitter.on('tick', () => order.push('c'));
    emitter.emit('tick');
    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('on() returns a function that unsubscribes', () => {
    const emitter = new EventEmitter();
    const spy = fn();
    const unsubscribe = emitter.on('save', spy);
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
    emitter.emit('save');
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('off(eventName, listener) removes the listener', () => {
    const emitter = new EventEmitter();
    const spy = fn();
    const other = fn();
    emitter.on('save', spy);
    emitter.on('save', other);
    emitter.off('save', spy);
    emitter.emit('save');
    expect(spy).toHaveBeenCalledTimes(0);
    expect(other).toHaveBeenCalledTimes(1);
  });

  it('once() listeners run a single time', () => {
    const emitter = new EventEmitter();
    const spy = fn();
    emitter.once('ready', spy);
    emitter.emit('ready', 1);
    emitter.emit('ready', 2);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(1);
  });

  it('emit() returns whether any listener was registered', () => {
    const emitter = new EventEmitter();
    expect(emitter.emit('nobody-listens')).toBe(false);
    emitter.on('x', () => {});
    expect(emitter.emit('x')).toBe(true);
  });
});
