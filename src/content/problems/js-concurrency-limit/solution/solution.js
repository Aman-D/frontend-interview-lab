/**
 * Runs async tasks with at most `limit` running at the same time.
 *
 * @param {Array<() => any>} tasks  functions that return a value or a promise
 * @param {number} limit            positive integer
 * @returns {Promise<any[]>}        results in the same order as `tasks`
 */
export function runWithConcurrency(tasks, limit) {
  return new Promise((resolve, reject) => {
    if (!Number.isInteger(limit) || limit < 1) {
      reject(new RangeError('runWithConcurrency: limit must be a positive integer'));
      return;
    }
    const list = Array.from(tasks);
    const results = new Array(list.length);
    if (list.length === 0) {
      resolve(results);
      return;
    }

    let nextIndex = 0;
    let completed = 0;
    let failed = false;

    function launchNext() {
      if (failed || nextIndex >= list.length) return;
      const index = nextIndex++;
      // new Promise(...) runs the task synchronously and turns a synchronous
      // throw into a rejection; non-promise return values are wrapped.
      new Promise((res) => res(list[index]())).then(
        (value) => {
          results[index] = value; // keep input order, not completion order
          completed += 1;
          if (completed === list.length) resolve(results);
          else launchNext(); // a slot freed up
        },
        (error) => {
          if (failed) return;
          failed = true; // stop launching; already-running tasks finish on their own
          reject(error);
        },
      );
    }

    for (let i = 0; i < Math.min(limit, list.length); i++) launchNext();
  });
}
