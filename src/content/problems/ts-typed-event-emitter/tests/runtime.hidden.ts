import { TypedEmitter } from '../solution';

type Events = {
  tick: [n: number];
};

describe('TypedEmitter runtime — hidden', () => {
  it('a listener that unsubscribes itself during emit does not cause the next one to be skipped', () => {
    const emitter = new TypedEmitter<Events>();
    const seen: string[] = [];
    const stop = emitter.on('tick', () => { seen.push('a'); stop(); });
    emitter.on('tick', () => seen.push('b'));
    emitter.emit('tick', 1);
    emitter.emit('tick', 2);
    expect(seen).toEqual(['a', 'b', 'b']);
  });

  it('the same function subscribed twice runs twice; each unsubscribe removes only its own subscription', () => {
    const emitter = new TypedEmitter<Events>();
    const spy = fn();
    const first = emitter.on('tick', spy);
    emitter.on('tick', spy);
    first();
    first();
    emitter.emit('tick', 1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('instances do not share listeners', () => {
    const a = new TypedEmitter<Events>();
    const b = new TypedEmitter<Events>();
    const spy = fn();
    a.on('tick', spy);
    b.emit('tick', 1);
    expect(spy).toHaveBeenCalledTimes(0);
    a.emit('tick', 2);
    expect(spy).toHaveBeenCalledWith(2);
  });

  it('a listener added during emit runs from the next emit', () => {
    const emitter = new TypedEmitter<Events>();
    const late = fn();
    emitter.on('tick', () => { emitter.on('tick', late); });
    emitter.emit('tick', 1);
    expect(late).toHaveBeenCalledTimes(0);
    emitter.emit('tick', 2);
    expect(late).toHaveBeenCalledTimes(1);
  });
});
