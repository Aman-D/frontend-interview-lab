import { runWithConcurrency } from '../solution';

function controlledTasks(n) {
  const ds = Array.from({ length: n }, () => deferred());
  const started = [];
  const tasks = ds.map((d, i) => () => {
    started.push(i);
    return d.promise;
  });
  return { ds, started, tasks };
}

describe('runWithConcurrency — public', () => {
  it('returns a Promise', () => {
    expect(runWithConcurrency([], 2)).toBeInstanceOf(Promise);
  });

  it('starts only `limit` tasks at first', () => {
    const { started, tasks } = controlledTasks(5);
    runWithConcurrency(tasks, 2);
    expect(started).toEqual([0, 1]);
  });

  it('starts the next task as soon as one finishes', async () => {
    const { ds, started, tasks } = controlledTasks(4);
    runWithConcurrency(tasks, 2);
    ds[1].resolve('b');
    await flush();
    expect(started).toEqual([0, 1, 2]);
    ds[0].resolve('a');
    await flush();
    expect(started).toEqual([0, 1, 2, 3]);
  });

  it('resolves with results in input order, not completion order', async () => {
    const { ds, tasks } = controlledTasks(3);
    const all = runWithConcurrency(tasks, 3);
    ds[2].resolve('c');
    ds[0].resolve('a');
    ds[1].resolve('b');
    await expect(all).resolves.toEqual(['a', 'b', 'c']);
  });

  it('resolves with [] for no tasks', async () => {
    await expect(runWithConcurrency([], 3)).resolves.toEqual([]);
  });

  it('rejects with the first error', async () => {
    const err = new Error('task failed');
    const all = runWithConcurrency([() => Promise.resolve(1), () => Promise.reject(err)], 2);
    await expect(all).rejects.toBe(err);
  });
});
