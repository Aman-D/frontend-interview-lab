import 'fake-indexeddb/auto';
import { QUESTION_BY_ID } from '@/content';
import type { RunResult } from '@/runtime/types';
import { LabDB } from './db';
import { createRepo } from './repo';

let n = 0;
function fresh() {
  const database = new LabDB(`test-db-${++n}-${Date.now()}`);
  return { database, repo: createRepo(database) };
}

const passingRun = (passed: number, total: number): RunResult => ({
  status: 'completed', startedAt: Date.now(), durationMs: 5, console: [], diagnostics: [], runtimeErrors: [],
  tests: Array.from({ length: total }, (_, i) => ({ file: '/t.js', visibility: i % 2 ? 'hidden' : 'public', name: `t${i}`, status: i < passed ? 'pass' : 'fail', durationMs: 1, kind: 'runtime' })),
});

describe('persistence (IndexedDB via Dexie)', () => {
  it('drafts survive a new connection (reload)', async () => {
    const { database, repo } = fresh();
    await repo.saveDraft('js-debounce', { '/solution.js': 'export const x = 1;' });
    database.close();
    const reopened = new LabDB(database.name);
    expect((await reopened.drafts.get('js-debounce'))?.files['/solution.js']).toBe('export const x = 1;');
  });

  it('startAttempt reuses the active attempt instead of creating a second one', async () => {
    const { repo, database } = fresh();
    const a = await repo.startAttempt('js-debounce', 'study');
    const b = await repo.startAttempt('js-debounce', 'interview');
    expect(b.id).toBe(a.id);
    expect(await database.attempts.count()).toBe(1);
  });

  it('tracks runs, hints, requirements and active time on the attempt', async () => {
    const { repo, database } = fresh();
    const a = await repo.startAttempt('js-debounce', 'study');
    await repo.recordRun(a.id, passingRun(3, 4));
    await repo.revealHint(a.id, 0);
    await repo.revealHint(a.id, 1);
    await repo.revealHint(a.id, 0); // re-viewing an earlier hint doesn't decrease the count
    await repo.toggleRequirement(a.id, 'cancel', true);
    await repo.toggleRequirement(a.id, 'flush', true);
    await repo.toggleRequirement(a.id, 'flush', false);
    await repo.addActiveTime(a.id, 15000);
    const saved = (await database.attempts.get(a.id))!;
    expect(saved.lastRun).toMatchObject({ passed: 3, total: 4, allPassed: false });
    expect(saved.runCount).toBe(1);
    expect(saved.hintsRevealed).toBe(2);
    expect(saved.requirementsDone).toEqual(['cancel']);
    expect(saved.activeMs).toBe(15000);
  });

  it('solution reveal is recorded and the submission is classified as assisted + queued for revision', async () => {
    const { repo, database } = fresh();
    const a = await repo.startAttempt('js-debounce', 'study');
    await repo.recordRun(a.id, passingRun(4, 4));
    await repo.revealSolution(a.id);
    const done = await repo.submitCodingAttempt(a.id, { files: {}, confidence: 5, mistakes: '' });
    expect(done?.outcome).toBe('assisted');
    expect((await database.progress.get('js-debounce'))?.needsRevision).toBe(true);
  });

  it('independent submission with all tests passing is independent-tested and not queued', async () => {
    const { repo, database } = fresh();
    const a = await repo.startAttempt('js-debounce', 'interview');
    await repo.recordRun(a.id, passingRun(4, 4));
    const done = await repo.submitCodingAttempt(a.id, { files: { '/solution.js': 'x' }, confidence: 4, mistakes: 'none' });
    expect(done?.outcome).toBe('independent-tested');
    expect(done?.files).toEqual({ '/solution.js': 'x' });
    expect((await database.progress.get('js-debounce'))?.needsRevision).toBe(false);
  });

  it('refuses to mark interview-ready without evidence', async () => {
    const { repo } = fresh();
    await expect(repo.setInterviewReady(QUESTION_BY_ID['js-debounce'], true)).rejects.toThrow();
  });

  it('notes persist with categories and reminders', async () => {
    const { repo, database } = fresh();
    const note = await repo.saveNote({ problemId: 'js-debounce', category: 'mistake', title: 't', body: '```js\nx\n```', reminderAt: 123 });
    const again = await repo.saveNote({ ...note, body: 'updated' });
    expect(again.createdAt).toBe(note.createdAt);
    expect((await database.notes.get(note.id))?.body).toBe('updated');
    expect(await database.notes.where('problemId').equals('js-debounce').count()).toBe(1);
  });

  it('export → import round-trips; invalid files are rejected', async () => {
    const a = fresh();
    await a.repo.saveDraft('js-curry', { '/solution.js': 'y' });
    await a.repo.saveNote({ category: 'insight', title: 'x', body: 'b' });
    await a.repo.setConceptStatus('closures', 'needs-revision');
    const data = JSON.parse(JSON.stringify(await a.repo.exportAll()));
    const b = fresh();
    const { counts } = await b.repo.importAll(data, 'replace');
    expect(counts.drafts).toBe(1);
    expect((await b.database.concepts.get('closures'))?.status).toBe('needs-revision');
    await expect(b.repo.importAll({ hello: 1 }, 'merge')).rejects.toThrow('Not a valid export file');
  });
});
