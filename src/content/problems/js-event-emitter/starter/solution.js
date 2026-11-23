/**
 * A small synchronous event emitter.
 *
 *   const emitter = new EventEmitter();
 *   const unsubscribe = emitter.on('save', (doc) => console.log('saved', doc));
 *   emitter.emit('save', { id: 1 }); // logs "saved { id: 1 }", returns true
 *   unsubscribe();
 *   emitter.emit('save', { id: 2 }); // nothing happens, returns false
 */
export class EventEmitter {
  constructor() {
    this.listeners = {};
  }

  /** Subscribe. Returns a function that removes exactly this subscription. */
  on(eventName, listener) {
    (this.listeners[eventName] ||= []).push(listener);
    // TODO: return an unsubscribe function
  }

  /** Subscribe for a single call. Returns an unsubscribe function. */
  once(eventName, listener) {
    // TODO
  }

  /** Remove one subscription of `listener` for `eventName`. */
  off(eventName, listener) {
    // TODO
  }

  /** Call every listener with `args`. Returns true if there was at least one listener. */
  emit(eventName, ...args) {
    const list = this.listeners[eventName] || [];
    for (let i = 0; i < list.length; i++) list[i](...args);
    return list.length > 0;
  }

  /** Number of active subscriptions for `eventName`. */
  listenerCount(eventName) {
    return (this.listeners[eventName] || []).length;
  }
}
