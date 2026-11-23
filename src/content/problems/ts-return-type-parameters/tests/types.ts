import type { Equal, Expect } from '../type-utils';
import type { MyParameters, MyReturnType } from '../solution';

// @test: MyReturnType extracts a primitive return type
type R1 = Expect<Equal<MyReturnType<() => string>, string>>;

// @test: MyReturnType keeps object and union return types intact
type R2 = Expect<Equal<MyReturnType<(id: number) => { id: number; name: string } | null>, { id: number; name: string } | null>>;

// @test: MyReturnType of a void function is void
type R3 = Expect<Equal<MyReturnType<(msg: string) => void>, void>>;

// @test: MyParameters extracts the parameter tuple
type P1 = Expect<Equal<MyParameters<(a: string, b: number) => void>, [a: string, b: number]>>;

// @test: MyParameters of a function without parameters is an empty tuple
type P2 = Expect<Equal<MyParameters<() => void>, []>>;

// @test: non-function types are rejected
// @ts-expect-error -- a string is not a function
type Bad1 = MyReturnType<string>;
// @ts-expect-error -- an object type without a call signature is not a function
type Bad2 = MyParameters<{ length: number }>;
