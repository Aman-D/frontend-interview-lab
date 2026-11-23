/**
 * A type-safe event emitter.
 *
 * - `Events` maps event names to argument tuples.
 * - `K extends keyof Events` ties the event name to its payload, so a wrong name
 *   or a wrong payload is a compile error at the call site.
 * - At runtime it is a plain synchronous emitter: listeners run in subscription
 *   order, and emit() iterates a snapshot of the subscriptions.
 */
export type Listener<Args extends unknown[]> = (...args: Args) => void;

/** One object per subscription, so the same function can be subscribed twice. */
interface Subscription<Args extends unknown[]> {
  listener: Listener<Args>;
}

export class TypedEmitter<Events extends Record<string, unknown[]>> {
  // Mapped type: for every event name, an optional list of correctly typed subscriptions.
  private subscriptions: { [K in keyof Events]?: Array<Subscription<Events[K]>> } = {};

  on<K extends keyof Events>(eventName: K, listener: Listener<Events[K]>): () => void {
    const subscription: Subscription<Events[K]> = { listener };
    const list = this.subscriptions[eventName] ?? [];
    list.push(subscription);
    this.subscriptions[eventName] = list;
    // The disposer closes over this exact subscription object.
    return () => this.remove(eventName, subscription);
  }

  off<K extends keyof Events>(eventName: K, listener: Listener<Events[K]>): void {
    const list = this.subscriptions[eventName];
    if (!list) return;
    // Remove the most recently added subscription of this function only.
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].listener === listener) {
        this.remove(eventName, list[i]);
        return;
      }
    }
  }

  emit<K extends keyof Events>(eventName: K, ...args: Events[K]): void {
    const list = this.subscriptions[eventName];
    if (!list) return;
    // Snapshot: listeners that unsubscribe (or subscribe) during emit do not
    // change which listeners this emit calls.
    for (const subscription of [...list]) subscription.listener(...args);
  }

  private remove<K extends keyof Events>(eventName: K, subscription: Subscription<Events[K]>): void {
    const list = this.subscriptions[eventName];
    if (!list) return;
    const index = list.indexOf(subscription);
    if (index === -1) return; // already removed: disposers are idempotent
    list.splice(index, 1);
    if (list.length === 0) delete this.subscriptions[eventName];
  }
}
