import { promiseAll } from '../solution';

describe('promiseAll — public', () => {
  it('returns a Promise', () => {
    const result = promiseAll([1]);
    expect(result).toBeInstanceOf(Promise);
  });

  it('fulfils with values in input order even when they settle out of order', async () => {
    const first = deferred();
    const second = deferred();
    const third = deferred();
    const all = promiseAll([first.promise, second.promise, third.promise]);
    third.resolve('c');
    second.resolve('b');
    first.resolve('a');
    await expect(all).resolves.toEqual(['a', 'b', 'c']);
  });

  it('passes non-promise values through unchanged', async () => {
    const obj = { id: 1 };
    const result = await promiseAll([1, 'two', obj, null, Promise.resolve(5)]);
    expect(result).toEqual([1, 'two', obj, null, 5]);
    expect(result[2]).toBe(obj);
  });

  it('fulfils with an empty array for empty input', async () => {
    await expect(promiseAll([])).resolves.toEqual([]);
  });

  it('rejects with the reason of the first rejection', async () => {
    const slow = deferred();
    const failing = deferred();
    const reason = new Error('boom');
    const all = promiseAll([slow.promise, failing.promise, 3]);
    failing.reject(reason);
    await expect(all).rejects.toBe(reason);
  });
});
