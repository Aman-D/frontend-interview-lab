/**
 * Type-test helpers (read-only).
 *
 * Equal<X, Y> is true only when X and Y are identical types. It compares two
 * generic function types; TypeScript treats them as assignable only when the
 * conditional types inside are "identical", which is stricter than mutual
 * assignability (it distinguishes any from unknown, readonly from mutable, ...).
 */
export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

/** Compiles only when T is exactly `true`. */
export type Expect<T extends true> = T;
