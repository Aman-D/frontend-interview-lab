import { runWithConcurrency } from '../solution';

describe('runWithConcurrency — hidden', () => {
  it('never runs more than `limit` tasks at once', async () => {
    let running = 0;
    let peak = 0;
    const tasks = Array.from({ length: 10 }, (_, i) => async () => {
      running += 1;
      peak = Math.max(peak, running);
      await flush();
      if (i % 3 === 0) await flush();
      running -= 1;
      return i;
    });
    const result = await runWithConcurrency(tasks, 3);
    expect(peak).toBe(3);
    expect(result).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('accepts tasks that return plain values', async () => {
    await expect(runWithConcurrency([() => 1, () => 'two'], 1)).resolves.toEqual([1, 'two']);
  });

  it('turns a synchronous throw into a rejection', async () => {
    const err = new Error('sync');
    const all = runWithConcurrency([() => { throw err; }], 1);
    await expect(all).rejects.toBe(err);
  });

  it('does not start new tasks after a rejection', async () => {
    const started = [];
    const d0 = deferred();
    const tasks = [
      () => { started.push(0); return d0.promise; },
      () => { started.push(1); return Promise.reject(new Error('x')); },
      () => { started.push(2); return 2; },
      () => { started.push(3); return 3; },
    ];
    const all = runWithConcurrency(tasks, 2);
    await expect(all).rejects.toThrow('x');
    d0.resolve(0);
    await flush();
    expect(started).toEqual([0, 1]);
  });

  it('works when limit is larger than the number of tasks', async () => {
    await expect(runWithConcurrency([() => Promise.resolve('a')], 10)).resolves.toEqual(['a']);
  });

  it('with limit 1 runs tasks strictly one after another', async () => {
    const log = [];
    const make = (name) => async () => {
      log.push('start ' + name);
      await flush();
      log.push('end ' + name);
      return name;
    };
    await runWithConcurrency([make('a'), make('b')], 1);
    expect(log).toEqual(['start a', 'end a', 'start b', 'end b']);
  });

  it('rejects with a RangeError for an invalid limit', async () => {
    await expect(runWithConcurrency([() => 1], 0)).rejects.toBeInstanceOf(RangeError);
    await expect(runWithConcurrency([() => 1], 1.5)).rejects.toBeInstanceOf(RangeError);
  });

  it('does not call any task before it is its turn', () => {
    const late = fn(() => 'late');
    const d = deferred();
    runWithConcurrency([() => d.promise, late], 1);
    expect(late).toHaveBeenCalledTimes(0);
  });
});
