/**
 * A type-safe event emitter.
 *
 * `Events` maps each event name to the tuple of arguments its listeners receive:
 *
 *   type AppEvents = {
 *     login: [userId: string];
 *     move: [x: number, y: number];
 *     logout: [];
 *   };
 *   const emitter = new TypedEmitter<AppEvents>();
 *   emitter.on('move', (x, y) => {});  // x: number, y: number
 *   emitter.emit('move', 1, 2);        // OK
 *   emitter.emit('move', '1');         // compile error
 *   emitter.emit('signup');            // compile error
 *
 * TODO: make on/off/emit type-safe AND implement them at runtime.
 */
export class TypedEmitter<Events extends Record<string, unknown[]>> {
  on(eventName: string, listener: (...args: any[]) => void): () => void {
    // TODO
    return () => {};
  }

  off(eventName: string, listener: (...args: any[]) => void): void {
    // TODO
  }

  emit(eventName: string, ...args: any[]): void {
    // TODO
  }
}
