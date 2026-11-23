import { promiseAll } from '../solution';

describe('promiseAll — hidden', () => {
  it('accepts any iterable: Set and generator', async () => {
    await expect(promiseAll(new Set([1, Promise.resolve(2)]))).resolves.toEqual([1, 2]);
    function* gen() {
      yield Promise.resolve('x');
      yield 'y';
    }
    await expect(promiseAll(gen())).resolves.toEqual(['x', 'y']);
  });

  it('adopts the state of thenables (objects with a then method)', async () => {
    const fulfilling = { then(onFulfilled) { onFulfilled(42); } };
    await expect(promiseAll([fulfilling, 1])).resolves.toEqual([42, 1]);

    const err = new Error('thenable failed');
    const throwing = { then() { throw err; } };
    await expect(promiseAll([throwing])).rejects.toBe(err);
  });

  it('stays pending until every input has fulfilled, even when the last one settles first', async () => {
    const a = deferred();
    const b = deferred();
    const c = deferred();
    let settled = false;
    promiseAll([a.promise, b.promise, c.promise]).then(() => { settled = true; });
    c.resolve(3); // filling the LAST slot first must not resolve the result
    await flush();
    expect(settled).toBe(false);
    a.resolve(1);
    await flush();
    expect(settled).toBe(false);
    b.resolve(2);
    await flush();
    expect(settled).toBe(true);
  });

  it('settles asynchronously, even when every value is already available', async () => {
    let value = null;
    promiseAll([1, 2]).then((v) => { value = v; });
    expect(value).toBe(null);
    await flush();
    expect(value).toEqual([1, 2]);
  });

  it('keeps the first rejection reason when several inputs reject', async () => {
    const a = deferred();
    const b = deferred();
    const all = promiseAll([a.promise, b.promise]);
    const first = new Error('first');
    b.reject(first);
    a.reject(new Error('second'));
    await expect(all).rejects.toBe(first);
  });

  it('rejects (does not throw synchronously) for a non-iterable argument', async () => {
    let result;
    expect(() => { result = promiseAll(42); }).not.toThrow();
    await expect(result).rejects.toThrow(TypeError);
    await expect(promiseAll(undefined)).rejects.toThrow(TypeError);
  });

  it('returns a new array and snapshots the input synchronously', async () => {
    const input = [1, 2];
    const all = promiseAll(input);
    input.push(3); // pushed after the call: must not be awaited
    const result = await all;
    expect(result).toEqual([1, 2]);
    expect(result).not.toBe(input);
  });
});
