// End-to-end smoke test of the built app in headless Chromium (Playwright).
// Usage: npm run build && npm run test:e2e
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const PORT = 4180;
const BASE = `http://localhost:${PORT}`;

const server = spawn(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'ignore' });
for (let i = 0; ; i++) {
  try {
    if ((await fetch(BASE)).ok) break;
  } catch {
    /* not up yet */
  }
  if (i > 100) throw new Error('preview server did not start');
  await new Promise((r) => setTimeout(r, 200));
}

const results = [];
async function check(name, fn) {
  try {
    await fn();
    results.push([true, name]);
    console.log(`  ✓ ${name}`);
  } catch (e) {
    results.push([false, name]);
    console.log(`  ✗ ${name}\n      ${String(e.message).split('\n').slice(0, 4).join('\n      ')}`);
  }
}
// Replace the editor contents via a real paste (typing would trigger Monaco's auto-indent/auto-close).
async function setEditor(page, text) {
  await page.locator('.monaco-editor textarea').first().focus();
  await page.evaluate((t) => navigator.clipboard.writeText(t), text);
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Control+V');
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));

try {
  await check('every page renders without crashing', async () => {
    for (const [path, heading] of [
      ['/', 'Dashboard'],
      ['/library', 'Problem Library'],
      ['/problems/react-autocomplete', 'Autocomplete / Typeahead'],
      ['/concepts', 'Concepts'],
      ['/concepts/abort-controller', null],
      ['/revision', 'Revision Queue'],
      ['/history', 'Attempt History'],
      ['/notes', 'Notes'],
      ['/sources', 'Research Sources'],
      ['/settings', 'Settings'],
    ]) {
      await page.goto(BASE + path);
      const h1 = page.locator('h1').first();
      await h1.waitFor({ timeout: 10000 });
      if (heading) assert((await h1.textContent())?.includes(heading), `${path}: expected heading "${heading}", got "${await h1.textContent()}"`);
      assert(!(await page.getByText('Something went wrong').count()), `${path}: error boundary shown`);
    }
  });

  await check('dashboard shows zero activity on a fresh profile (no invented metrics)', async () => {
    await page.goto(BASE + '/');
    await page.getByText('Completed', { exact: true }).first().waitFor();
    const text = await page.locator('main').innerText();
    assert(text.includes('No attempts yet'), 'expected empty recent attempts');
    assert(/Time practising\s*0 min/.test(text), 'expected 0 min practice time');
  });

  await check('library filters by category and search', async () => {
    await page.goto(BASE + '/library');
    await page.getByRole('button', { name: 'TypeScript', exact: true }).click();
    const rows = await page.locator('tbody tr').count();
    assert(rows === 2, `expected 2 TypeScript rows, got ${rows}`);
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await page.getByPlaceholder(/Search title/).fill('typeahead');
    assert((await page.locator('tbody tr').count()) === 1, 'search should find exactly the autocomplete problem');
  });

  await check('interview mode hides hints and solution; tests run in the sandbox and are recorded', async () => {
    await page.goto(BASE + '/problems/js-debounce');
    await page.getByRole('button', { name: 'Interview mode' }).click();
    await page.getByText('Interview mode', { exact: true }).waitFor();
    await page.getByRole('tab', { name: /^Hints/ }).click();
    await page.getByText('Hints are hidden in Interview Mode').waitFor();
    await page.getByRole('tab', { name: 'Solution', exact: true }).click();
    await page.getByText(/solution is hidden in Interview Mode/i).waitFor();
    assert(!(await page.getByRole('button', { name: 'Reveal solution' }).count()), 'reveal button must not exist in interview mode');
    await page.getByRole('button', { name: /Run tests/ }).click();
    await page.getByText(/\d+\/\d+ passed/).first().waitFor({ timeout: 60000 });
    const summary = await page.getByText(/\d+\/\d+ passed/).first().textContent();
    assert(/^1\/9 passed/.test(summary.trim()), `starter code should pass 1/9 tests, got "${summary}"`);
  });

  await check('editing code autosaves and survives a reload', async () => {
    await page.locator('.monaco-editor').first().waitFor({ timeout: 30000 });
    await page.locator('.monaco-editor textarea').first().focus();
    await page.keyboard.press('Control+End');
    await page.keyboard.type('\n// e2e-marker-123\n');
    await page.getByText('Saved', { exact: true }).waitFor({ timeout: 10000 });
    await page.reload();
    await page.locator('.monaco-editor').first().waitFor({ timeout: 30000 });
    await page.waitForFunction(() => document.querySelector('.monaco-editor')?.textContent?.includes('e2e-marker-123'), null, { timeout: 15000 });
  });

  await check('reference solution passes all tests in the UI runner', async () => {
    const solution = `export function debounce(fn, wait = 0) {
  let t = null, args = null, ctx = null;
  function d(...a) { args = a; ctx = this; if (t !== null) clearTimeout(t); t = setTimeout(() => { t = null; const x = args, c = ctx; args = ctx = null; fn.apply(c, x); }, wait); }
  d.cancel = () => { if (t !== null) clearTimeout(t); t = null; args = ctx = null; };
  return d;
}
`;
    await setEditor(page, solution);
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /Run tests/ }).click();
    await page.getByText(/passed · \d+ ms/).first().waitFor({ timeout: 60000 });
    await page.waitForTimeout(500);
    const summary = await page.getByText(/passed · \d+ ms/).first().textContent();
    if (!summary.startsWith('9/9')) {
      const txt = await page.locator('main').innerText();
      throw new Error(`expected 9/9, got "${summary}"\n${txt.slice(txt.indexOf('nothing is inferred'), txt.indexOf('nothing is inferred') + 800)}`);
    }
  });

  await check('submitting records an independent, tested attempt and opens final review', async () => {
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
    await page.getByText('Final review').waitFor({ timeout: 60000 });
    await page.getByText('Independently solved & tested').first().waitFor();
    await page.goto(BASE + '/');
    await page.getByText('Recent attempts').waitFor();
    await page.waitForFunction(() => /Completed\s*1\b/.test(document.querySelector('main')?.innerText ?? ''), null, { timeout: 10000 });
  });

  await check('study mode: solution reveal needs confirmation while independent; hints mark the attempt assisted', async () => {
    await page.goto(BASE + '/problems/js-curry');
    await page.getByRole('button', { name: 'Study mode' }).click();
    await page.getByRole('tab', { name: 'Solution', exact: true }).click();
    await page.getByRole('button', { name: 'Reveal solution' }).click();
    await page.getByRole('dialog').getByText('Reveal the solution?').waitFor();
    await page.getByRole('button', { name: 'Keep practising' }).click();
    assert(!(await page.getByTestId('assisted-badge').count()), 'cancelling the reveal must not mark the attempt assisted');
    await page.getByRole('tab', { name: /^Hints/ }).click();
    await page.getByRole('button', { name: 'Reveal hint 1' }).click();
    await page.getByTestId('assisted-badge').waitFor();
  });

  await check('notes persist across reloads', async () => {
    await page.goto(BASE + '/notes');
    await page.getByRole('button', { name: 'New general note' }).click();
    await page.getByLabel('Note body (Markdown)').first().fill('persisted **note** e2e');
    await page.getByText(/^Saved ·/).first().waitFor({ timeout: 10000 });
    await page.reload();
    await page.getByLabel('Note body (Markdown)').first().waitFor();
    assert((await page.getByLabel('Note body (Markdown)').first().inputValue()).includes('persisted **note** e2e'), 'note body lost after reload');
  });

  await check('output prediction checks the answer against the executed output', async () => {
    await page.goto(BASE + '/practice/out-var-hoisting');
    await page.getByLabel('Predicted output').fill('definitely wrong');
    await page.getByRole('button', { name: 'Check answer' }).click();
    await page.getByText('Not quite').waitFor();
    await page.getByText('Verified output').waitFor();
  });

  await check('React preview renders inside the sandbox iframe (opaque origin, no app storage access)', async () => {
    await page.goto(BASE + '/practice/react-autocomplete?mode=study');
    const frame = page.frameLocator('iframe[title="Preview"]');
    await frame.getByText('Fruit search').waitFor({ timeout: 60000 });
    const sandbox = await page.locator('iframe[title="Preview"]').getAttribute('sandbox');
    assert(sandbox === 'allow-scripts', `unexpected sandbox attribute: ${sandbox}`);
    const f = page.frames().find((x) => x.url().includes('/runner/'));
    const blocked = await f.evaluate(() => {
      try {
        indexedDB.open('frontend-interview-lab');
        return false;
      } catch {
        return true;
      }
    });
    assert(blocked, 'sandboxed frame must not be able to open the app database');
  });

  await check('infinite loops are stopped by the loop guard instead of freezing the tab', async () => {
    await page.goto(BASE + '/practice/js-promise-all?mode=study');
    await page.locator('.monaco-editor').first().waitFor({ timeout: 30000 });
    await setEditor(page, 'export function promiseAll(x) { while (true) {} }\n');
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+Enter'); // keyboard shortcut path
    await page.getByText(/\d+\/\d+ passed/).first().waitFor({ timeout: 90000 });
    await page.getByText(/Loop guard/).first().waitFor({ timeout: 5000 });
  });
} finally {
  await browser.close();
  server.kill();
}

const failed = results.filter(([ok]) => !ok).length;
if (pageErrors.length) console.log(`\nUncaught errors reported by pages/frames (${pageErrors.length}; sandbox frames include errors thrown on purpose by tests):\n  ${[...new Set(pageErrors)].slice(0, 5).join('\n  ')}`);
console.log(`\n${results.length - failed}/${results.length} e2e checks passed`);
process.exit(failed ? 1 : 0);
