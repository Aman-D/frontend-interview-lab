/**
 * A small synchronous event emitter.
 *
 * Each subscription is stored as its own record, so:
 *  - the same function can be subscribed several times;
 *  - the unsubscribe function returned by on()/once() removes exactly the
 *    subscription it belongs to, and is safe to call more than once.
 */
export class EventEmitter {
  // Map instead of a plain object: event names such as "__proto__" or
  // "constructor" are just keys and cannot collide with Object.prototype.
  #listeners = new Map(); // eventName -> Array<{ listener, once }>

  on(eventName, listener) {
    return this.#add(eventName, listener, false);
  }

  once(eventName, listener) {
    return this.#add(eventName, listener, true);
  }

  off(eventName, listener) {
    const records = this.#listeners.get(eventName);
    if (!records) return;
    // Like Node's removeListener: remove the most recently added match only.
    for (let i = records.length - 1; i >= 0; i--) {
      if (records[i].listener === listener) {
        this.#removeRecord(eventName, records[i]);
        return;
      }
    }
  }

  emit(eventName, ...args) {
    const records = this.#listeners.get(eventName);
    if (!records || records.length === 0) return false;
    // Snapshot: listeners added or removed while emitting do not change
    // which listeners this emit() calls.
    for (const record of records.slice()) {
      if (record.once) {
        // Remove BEFORE calling, so a re-entrant emit() from inside the
        // listener (or a throw) cannot run it a second time.
        this.#removeRecord(eventName, record);
      }
      record.listener.apply(this, args);
    }
    return true;
  }

  listenerCount(eventName) {
    const records = this.#listeners.get(eventName);
    return records ? records.length : 0;
  }

  #add(eventName, listener, once) {
    if (typeof listener !== 'function') throw new TypeError('listener must be a function');
    const record = { listener, once };
    const records = this.#listeners.get(eventName);
    if (records) records.push(record);
    else this.#listeners.set(eventName, [record]);
    // The closure holds the record itself, not the function, so it can only
    // ever remove this one subscription.
    return () => this.#removeRecord(eventName, record);
  }

  #removeRecord(eventName, record) {
    const records = this.#listeners.get(eventName);
    if (!records) return;
    const index = records.indexOf(record);
    if (index === -1) return; // already removed: unsubscribe is idempotent
    records.splice(index, 1);
    if (records.length === 0) this.#listeners.delete(eventName); // no empty arrays left behind
  }
}
