// Runs every reference solution (and starter) through the real in-app runner in headless Chromium,
// then writes src/content/verification.generated.json and rebuilds so the app can display the record.
// Usage: npm run verify:solutions   (builds first)
import { spawn, execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const PORT = 4179;

const server = spawn(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'ignore' });
// Wait until the preview server answers HTTP.
for (let i = 0; ; i++) {
  try {
    if ((await fetch(`http://localhost:${PORT}/`)).ok) break;
  } catch {
    /* not up yet */
  }
  if (i > 100) throw new Error('vite preview did not start');
  await new Promise((r) => setTimeout(r, 200));
}

let failed = false;
try {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/__verify`);
  await page.waitForFunction(() => window.__VERIFY__, null, { timeout: 300_000 });
  const results = await page.evaluate(() => window.__VERIFY__);
  const report = { generatedAt: new Date().toISOString(), browser: `Chromium ${browser.version()} (Playwright)`, results };
  await browser.close();
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.problemId.padEnd(28)} solution ${r.solution.passed}/${r.solution.total}  starter ${r.starter.passed}/${r.starter.total}`);
    if (!r.ok) {
      failed = true;
      r.solution.failures.forEach((f) => console.log('      ' + f.slice(0, 300)));
      if (!r.starter.failsAtLeastOne) console.log('      starter passes every test — tests cannot fail');
    }
  }
  writeFileSync(join(root, 'src/content/verification.generated.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`\nWrote src/content/verification.generated.json (${results.length} problems).`);
} finally {
  server.kill();
}
if (failed) {
  console.error('Verification FAILED.');
  process.exit(1);
}
// Rebuild so the bundled app shows the fresh verification record.
execSync('npx vite build', { cwd: root, stdio: 'inherit' });
