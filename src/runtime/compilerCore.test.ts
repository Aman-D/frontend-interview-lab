// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { CODING_PROBLEMS } from '@/content';
import { evaluateTypeTests, parseTypeTestSegments, referencedLibs, transpileProject, typecheckProject, TYPECHECK_LIBS } from './compilerCore';

const require = createRequire(import.meta.url);
const libDir = require.resolve('typescript/lib/lib.d.ts').replace(/lib\.d\.ts$/, '');
function loadLibs() {
  const libs: Record<string, string> = {};
  const queue = [...TYPECHECK_LIBS];
  while (queue.length) {
    const n = queue.shift()!;
    if (libs[n] !== undefined) continue;
    libs[n] = readFileSync(libDir + n, 'utf8');
    queue.push(...referencedLibs(libs[n]));
  }
  return libs;
}
const libs = loadLibs();
const utils = 'export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;\nexport type Expect<T extends true> = T;\n';

describe('transpileProject', () => {
  it('compiles TSX to CommonJS using the automatic JSX runtime', () => {
    const out = transpileProject(ts, { '/App.tsx': 'export default function App(){ return <div>hi</div>; }', '/s.css': 'a{}' });
    expect(out.diagnostics).toEqual([]);
    expect(out.modules['/App.tsx']).toContain('require("react/jsx-runtime")');
    expect(out.styles['/s.css']).toBe('a{}');
  });
  it('injects the loop guard into every loop body', () => {
    const out = transpileProject(ts, { '/a.js': 'while(true) x++; for (const a of b) {} do { y() } while (z); for (;;) break;' });
    expect(out.modules['/a.js'].match(/__lg\(\)/g)).toHaveLength(4);
  });
  it('reports syntax errors with positions', () => {
    const out = transpileProject(ts, { '/a.ts': 'const x = ;' });
    expect(out.diagnostics[0]).toMatchObject({ file: '/a.ts', line: 1 });
  });
});

describe('type-level test evaluation (real TypeScript compiler)', () => {
  it('passes correct types, fails wrong ones, and fails unused @ts-expect-error', () => {
    const test = [
      "import type { Equal, Expect } from '../type-utils';",
      "import type { Id } from '../solution';",
      '// @test: identity of string',
      'type A = Expect<Equal<Id<string>, string>>;',
      '// @test: deliberately wrong',
      'type B = Expect<Equal<Id<string>, number>>;',
      '// @test: must reject numbers',
      '// @ts-expect-error',
      'type C = Id<5>;',
    ].join('\n');
    const files = { '/solution.ts': 'export type Id<T> = T;', '/type-utils.ts': utils, '/tests/t.test.ts': test };
    const diags = typecheckProject(ts, files, libs, Object.keys(files));
    const res = evaluateTypeTests(diags, [{ path: '/tests/t.test.ts', source: test, visibility: 'public' }], ['/solution.ts']);
    const by = Object.fromEntries(res.map((r) => [r.name, r.status]));
    expect(by['Solution compiles without type errors']).toBe('pass');
    expect(by['identity of string']).toBe('pass');
    expect(by['deliberately wrong']).toBe('fail');
    expect(by['must reject numbers']).toBe('fail'); // Id<5> compiles, so the expect-error is unused
  });
  it('segments test files by // @test markers', () => {
    expect(parseTypeTestSegments('x\n// @test: a\n1\n// @test: b\n2').map((s) => [s.name, s.startLine, s.endLine])).toEqual([
      ['a', 2, 3],
      ['b', 4, 5],
    ]);
  });
  it.each(CODING_PROBLEMS.filter((p) => p.execution === 'ts-types').map((p) => [p.id, p] as const))('%s: reference solution passes its type tests in Node too', (_id, p) => {
    const typeTests = p.tests.filter((t) => t.kind === 'type');
    const files: Record<string, string> = { ...p.files.support, ...p.files.solution };
    for (const t of typeTests) files[t.path] = t.source;
    const diags = typecheckProject(ts, files, libs, Object.keys(files).filter((f) => /\.tsx?$/.test(f)));
    const res = evaluateTypeTests(diags, typeTests, Object.keys(p.files.solution));
    expect(res.filter((r) => r.status !== 'pass').map((r) => `${r.name}: ${r.error?.message}`)).toEqual([]);
  });
});
