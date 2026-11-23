import type { Equal, Expect } from '../type-utils';
import { TypedEmitter } from '../solution';

type ChatEvents = {
  message: [text: string, meta: { from: string; at: number }];
  typing: [isTyping: boolean];
  reset: [];
};

declare const chat: TypedEmitter<ChatEvents>;

// @test: a listener with an incompatible parameter type is rejected
// @ts-expect-error -- typing passes a boolean, not a number
chat.on('typing', (isTyping: number) => {});

// @test: a listener may ignore trailing parameters
chat.on('message', (text) => {
  type CheckText = Expect<Equal<typeof text, string>>;
});
chat.on('reset', () => {});

// @test: object payloads are checked structurally
chat.emit('message', 'hi', { from: 'ana', at: 1 });
// @ts-expect-error -- meta.at must be a number
chat.emit('message', 'hi', { from: 'ana', at: 'now' });

// @test: on returns an unsubscribe function
const unsubscribe = chat.on('typing', () => {});
type CheckUnsubscribe = Expect<Equal<typeof unsubscribe, () => void>>;

// @test: off is typed like on
const handler = (isTyping: boolean) => {};
chat.off('typing', handler);
// @ts-expect-error -- handler belongs to "typing", not "message"
chat.off('message', handler);

// @test: the event map must map names to argument tuples
// @ts-expect-error -- payloads must be tuples (arrays of arguments)
type NotTuples = TypedEmitter<{ save: string }>;

// @test: different emitters keep their own event maps
declare const other: TypedEmitter<{ ping: [] }>;
other.emit('ping');
// @ts-expect-error -- "ping" belongs to the other emitter
chat.emit('ping');
