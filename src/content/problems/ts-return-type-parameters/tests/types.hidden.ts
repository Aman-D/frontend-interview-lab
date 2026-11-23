import type { Equal, Expect } from '../type-utils';
import type { MyParameters, MyReturnType } from '../solution';

declare function fetchUser(id: string, opts?: { cache: boolean }): Promise<{ id: string }>;
declare function format(value: number): string;
declare function format(value: Date, locale: string): string[];
declare function identity<T>(value: T): T;
declare function onClick(this: HTMLElement, event: MouseEvent): void;
declare class Store {
  constructor(name: string);
}

// @test: works with typeof on a declared function (async return type, optional parameter)
type H1 = Expect<Equal<MyReturnType<typeof fetchUser>, Promise<{ id: string }>>>;
type H2 = Expect<Equal<MyParameters<typeof fetchUser>, [id: string, opts?: { cache: boolean }]>>;

// @test: rest parameters are preserved in the tuple
type H3 = Expect<Equal<MyParameters<(head: string, ...tail: number[]) => void>, [head: string, ...tail: number[]]>>;

// @test: overloaded functions resolve to the LAST signature, like the built-ins
type H4 = Expect<Equal<MyReturnType<typeof format>, string[]>>;
type H5 = Expect<Equal<MyParameters<typeof format>, Parameters<typeof format>>>;

// @test: generic functions behave like the built-ins
type H6 = Expect<Equal<MyReturnType<typeof identity>, ReturnType<typeof identity>>>;

// @test: a `this` parameter is not part of the parameter tuple
type H7 = Expect<Equal<MyParameters<typeof onClick>, [event: MouseEvent]>>;

// @test: the return type can itself be a function
type H8 = Expect<Equal<MyReturnType<() => (x: number) => boolean>, (x: number) => boolean>>;

// @test: never distributes to never, like the built-ins
type H9 = Expect<Equal<MyParameters<never>, never>>;
type H10 = Expect<Equal<MyReturnType<never>, never>>;

// @test: constructors and primitives are rejected
// @ts-expect-error -- a class constructor has no call signature
type HBad1 = MyReturnType<typeof Store>;
// @ts-expect-error -- number is not a function
type HBad2 = MyParameters<number>;
// @ts-expect-error -- undefined is not a function
type HBad3 = MyReturnType<undefined>;
