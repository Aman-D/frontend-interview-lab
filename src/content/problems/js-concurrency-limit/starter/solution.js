/**
 * Runs async tasks with at most `limit` running at the same time.
 *
 * @param {Array<() => any>} tasks  functions that return a value or a promise
 * @param {number} limit            positive integer
 * @returns {Promise<any[]>}        results in the same order as `tasks`
 */
export function runWithConcurrency(tasks, limit) {
  // TODO: implement
  return Promise.resolve([]);
}
