import type { Equal, Expect } from '../type-utils';
import { TypedEmitter } from '../solution';

type AppEvents = {
  login: [userId: string];
  move: [x: number, y: number];
  logout: [];
};

declare const emitter: TypedEmitter<AppEvents>;

// @test: emit accepts each event's declared payload
emitter.emit('login', 'user-1');
emitter.emit('move', 10, 20);
emitter.emit('logout');

// @test: emit rejects unknown event names
// @ts-expect-error -- "signup" is not in AppEvents
emitter.emit('signup', 'user-1');

// @test: emit rejects a payload of the wrong type
// @ts-expect-error -- login expects a string
emitter.emit('login', 42);

// @test: emit rejects missing and extra arguments
// @ts-expect-error -- move needs two numbers
emitter.emit('move', 10);
// @ts-expect-error -- logout takes no arguments
emitter.emit('logout', 'now');

// @test: listener parameters are inferred from the event map
emitter.on('move', (x, y) => {
  type CheckX = Expect<Equal<typeof x, number>>;
  type CheckY = Expect<Equal<typeof y, number>>;
});
emitter.on('login', (userId) => {
  type CheckId = Expect<Equal<typeof userId, string>>;
});

// @test: on rejects unknown event names
// @ts-expect-error -- "signup" is not in AppEvents
emitter.on('signup', () => {});
