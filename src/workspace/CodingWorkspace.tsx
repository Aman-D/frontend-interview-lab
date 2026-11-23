import { AlertTriangle, CheckCircle2, CircleSlash, FileCode2, FlaskConical, Lock, Maximize2, Minimize2, PanelBottom, PanelLeft, PanelRight, Play, RefreshCw, RotateCcw, Send, XCircle } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import { Link, useSearchParams } from 'react-router-dom';
import { OutcomeBadge, SourcesPanel } from '@/components/meta';
import { ClarificationsView, DescriptionView, RequirementsChecklist, TestingPlanView } from '@/components/ProblemSpec';
import { Badge, Button, Dialog, Select, Tabs, Textarea, cn } from '@/components/ui';
import type { CodingProblem } from '@/content/schema';
import { EXECUTION_LABEL } from '@/content/labels';
import { db } from '@/db/db';
import { repo } from '@/db/repo';
import type { Attempt, PracticeMode } from '@/db/types';
import { useAttempts } from '@/hooks/useData';
import { classifyCodingOutcome, OUTCOME_LABEL, revisionIntervalDays } from '@/lib/progress';
import type { TimerState } from '@/lib/timer';
import { runTests, startPreview, type PreviewHandle, type RunnableProject } from '@/runtime/runProject';
import type { ConsoleEntry, Diagnostic, FileMap, RunResult, TestCaseResult } from '@/runtime/types';
import { ConceptsPanel, FollowUpsPanel, HintsPanel, McqPanel } from './LearningPanels';
import { NotesPanel } from './NotesPanel';
import { SolutionPanel } from './SolutionPanel';
import { TimerControl } from './TimerControl';

const CodeEditor = lazy(() => import('@/components/CodeEditor'));

type LeftTab = 'description' | 'clarify' | 'requirements' | 'testing' | 'previous';
type RightTab = 'preview' | 'console' | 'tests' | 'problems';
type BottomTab = 'hints' | 'solution' | 'concepts' | 'notes' | 'followups' | 'mcqs' | 'sources';

const MODE_INFO: Record<PracticeMode, { label: string; description: string }> = {
  study: { label: 'Study', description: 'Progressive hints and concepts available; the solution sits behind an explicit, recorded reveal. No time limit.' },
  interview: { label: 'Interview', description: 'Hints and solution hidden until you submit. Optional countdown. Final review after submission.' },
  revision: { label: 'Revision', description: 'Re-attempt with your past mistakes and notes visible. Solution hidden until you submit.' },
};

function entryFor(problem: CodingProblem, files: FileMap) {
  const e = problem.files.entry;
  if (files[e] !== undefined) return e;
  const alt = e.endsWith('.js') ? e.replace(/\.js$/, '.ts') : e.replace(/\.ts$/, '.js');
  return files[alt] !== undefined ? alt : e;
}

export default function CodingWorkspace({ problem }: { problem: CodingProblem }) {
  const [params, setParams] = useSearchParams();
  const attempts = useAttempts(problem.id);
  const active = attempts?.find((a) => a.status === 'active');
  const [reviewId, setReviewId] = useState<string | null>(null);
  const review = attempts?.find((a) => a.id === reviewId && a.status === 'submitted');
  const attempt: Attempt | undefined = active ?? review;
  const requestedMode = params.get('mode') as PracticeMode | null;

  // Start an attempt automatically when a mode was chosen on the problem page.
  const starting = useRef(false);
  useEffect(() => {
    if (!attempts || active || review || !requestedMode || starting.current) return;
    if (!(requestedMode in MODE_INFO)) return;
    starting.current = true;
    repo.startAttempt(problem.id, requestedMode).finally(() => {
      starting.current = false;
      setParams({}, { replace: true });
    });
  }, [attempts, active, review, requestedMode, problem.id, setParams]);

  /* ----------------------------- files ----------------------------- */
  const readonlyFiles = useMemo(() => Object.fromEntries(problem.files.readonly.map((p) => [p, problem.files.starter[p]])), [problem]);
  const [files, setFiles] = useState<FileMap | null>(null);
  const [activeFile, setActiveFile] = useState<string>('');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'idle'>('idle');
  const dirtySinceRun = useRef(true);

  useEffect(() => {
    let cancelled = false;
    db.drafts.get(problem.id).then((d) => {
      if (cancelled) return;
      const f = { ...(d?.files ?? problem.files.starter), ...readonlyFiles };
      setFiles(f);
      const editable = Object.keys(f).filter((p) => !problem.files.readonly.includes(p) && !p.endsWith('.css'));
      setActiveFile(editable.find((p) => p !== '/App.tsx') ?? editable[0] ?? Object.keys(f)[0]);
      setSaveState(d ? 'saved' : 'idle');
    });
    return () => {
      cancelled = true;
    };
  }, [problem, readonlyFiles]);

  const filesRef = useRef(files);
  filesRef.current = files;
  const saveNow = useCallback(async () => {
    if (!filesRef.current) return;
    setSaveState('saving');
    await repo.saveDraft(problem.id, filesRef.current);
    setSaveState('saved');
  }, [problem.id]);

  const skipFirstSave = useRef(true);
  useEffect(() => {
    if (!files) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    dirtySinceRun.current = true;
    setSaveState('saving');
    const t = setTimeout(saveNow, 600);
    return () => clearTimeout(t);
  }, [files, saveNow]);

  const updateFile = (path: string, value: string) => setFiles((f) => (f ? { ...f, [path]: value } : f));

  /* ---------------------------- runtime ---------------------------- */
  const submitted = attempt?.status === 'submitted';
  const project: RunnableProject | null = useMemo(() => {
    if (!files) return null;
    return {
      execution: problem.execution,
      files,
      entry: entryFor(problem, files),
      supportFiles: problem.files.support,
      testFiles: problem.tests.map((t) => ({ path: t.path, source: t.source, visibility: t.visibility, kind: t.kind })),
    };
  }, [files, problem]);

  const [consoleEntries, setConsole] = useState<ConsoleEntry[]>([]);
  const pushConsole = useCallback((e: ConsoleEntry) => setConsole((c) => (c.length > 500 ? [...c.slice(-400), e] : [...c, e])), []);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [previewDiagnostics, setPreviewDiagnostics] = useState<Diagnostic[]>([]);
  const testHostRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewHandle = useRef<PreviewHandle | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const hasVisualPreview = problem.execution === 'react' || problem.execution === 'dom';

  const refreshPreview = useCallback(async () => {
    if (!project || !previewRef.current) return;
    previewHandle.current?.dispose();
    setConsole([]);
    if (problem.execution === 'ts-types') return;
    const h = await startPreview(project, previewRef.current, pushConsole);
    previewHandle.current = h;
    setPreviewDiagnostics(h.diagnostics);
  }, [project, problem.execution, pushConsole]);

  useEffect(() => () => previewHandle.current?.dispose(), []);
  // Auto-refresh the visual preview (debounced) as you type.
  useEffect(() => {
    if (!hasVisualPreview || !autoRefresh || !project) return;
    const t = setTimeout(refreshPreview, 800);
    return () => clearTimeout(t);
  }, [project, autoRefresh, hasVisualPreview, refreshPreview]);

  const [rightTab, setRightTab] = useState<RightTab>(hasVisualPreview ? 'preview' : 'console');

  const runAllTests = useCallback(async (): Promise<RunResult | null> => {
    if (!project || !testHostRef.current) return null;
    setRunning(true);
    setRightTab('tests');
    try {
      await saveNow();
      const res = await runTests(project, testHostRef.current, () => {});
      setResult(res);
      dirtySinceRun.current = false;
      if (active) await repo.recordRun(active.id, res);
      return res;
    } finally {
      setRunning(false);
    }
  }, [project, active, saveNow]);

  const runEntry = useCallback(async () => {
    setRightTab(hasVisualPreview ? 'preview' : 'console');
    await saveNow();
    await refreshPreview();
  }, [hasVisualPreview, refreshPreview, saveNow]);

  /* ------------------------ active time + timer ------------------------ */
  useEffect(() => {
    if (!active) return;
    const id = active.id;
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      if (document.visibilityState === 'visible') repo.addActiveTime(id, now - last);
      last = now;
    };
    const iv = setInterval(tick, 15000);
    const onVis = () => {
      if (document.visibilityState === 'hidden') tick();
      else last = Date.now();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      tick();
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const setTimer = (t: TimerState) => active && repo.patchAttempt(active.id, { timer: t });

  /* ----------------------------- panels ----------------------------- */
  const leftRef = useRef<ImperativePanelHandle>(null);
  const rightRef = useRef<ImperativePanelHandle>(null);
  const bottomRef = useRef<ImperativePanelHandle>(null);
  const [maximized, setMaximized] = useState(false);
  const toggleMax = () => {
    const next = !maximized;
    setMaximized(next);
    for (const r of [leftRef, rightRef, bottomRef]) {
      if (next) r.current?.collapse();
      else r.current?.expand();
    }
  };
  const [leftTab, setLeftTab] = useState<LeftTab>('description');
  const [bottomTab, setBottomTab] = useState<BottomTab>('concepts');

  /* ---------------------------- shortcuts ---------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 's') {
        e.preventDefault();
        saveNow();
      } else if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        runEntry();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        runAllTests();
      } else if (e.shiftKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault();
        toggleMax();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  /* ---------------------------- submission ---------------------------- */
  const [submitOpen, setSubmitOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  if (!attempts || !files) return <div className="p-6 text-sm text-subtle">Loading workspace…</div>;

  if (!attempt) return <StartPanel problem={problem} attempts={attempts} onStart={(m) => repo.startAttempt(problem.id, m)} />;

  const mode = attempt.mode;
  const helpLocked = !submitted && (mode === 'interview') ? 'Hints are hidden in Interview Mode until you submit.' : undefined;
  const solutionLocked = !submitted && (mode === 'interview' || mode === 'revision') ? `The solution is hidden in ${MODE_INFO[mode].label} Mode until you submit.` : undefined;
  const independent = attempt.hintsRevealed === 0 && !attempt.solutionRevealed;
  const doneSet = new Set(attempt.requirementsDone);
  const fileList = [
    ...Object.keys(files).sort((a, b) => Number(problem.files.readonly.includes(a)) - Number(problem.files.readonly.includes(b)) || a.localeCompare(b)),
    ...problem.tests.filter((t) => t.visibility === 'public' || submitted).map((t) => t.path),
  ];
  const testSource = (p: string) => problem.tests.find((t) => t.path === p)?.source;
  const isReadonly = (p: string) => problem.files.readonly.includes(p) || !!testSource(p) || submitted;
  const fileValue = testSource(activeFile) ?? files[activeFile] ?? '';
  const previous = attempts.filter((a) => a.status === 'submitted' && a.id !== attempt.id);
  const siblingModels = Object.fromEntries(
    [...Object.entries({ ...problem.files.support, ...files }), ...problem.tests.filter((t) => t.visibility === 'public' || submitted).map((t) => [t.path, t.source] as const)]
      .filter(([p]) => /\.(tsx?|jsx?)$/.test(p))
      .map(([p, c]) => [`file:///${problem.id}${p}`, c]),
  );
  const canSwitchLanguage = problem.execution === 'js' && !submitted;
  const entry = entryFor(problem, files);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-panel px-3 py-1.5">
        <Link to={`/problems/${problem.id}`} className="mr-1 truncate text-sm font-semibold hover:underline">{problem.title}</Link>
        <Badge tone={mode === 'interview' ? 'warn' : mode === 'revision' ? 'accent' : 'neutral'} title={MODE_INFO[mode].description}>{MODE_INFO[mode].label} mode</Badge>
        {submitted ? <OutcomeBadge o={attempt.outcome} /> : !independent && <Badge tone="warn" data-testid="assisted-badge">assisted</Badge>}
        <Badge className="hidden md:inline-flex">{EXECUTION_LABEL[problem.execution]}</Badge>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {!submitted && <TimerControl timer={attempt.timer} onChange={setTimer} />}
          <span className="text-[11px] text-subtle" aria-live="polite">{saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : ''}</span>
          <Button size="sm" onClick={runEntry} title="Run / refresh preview (Ctrl+Shift+Enter)" disabled={problem.execution === 'ts-types'}>
            <Play className="h-3.5 w-3.5" aria-hidden /> Run
          </Button>
          <Button size="sm" onClick={runAllTests} disabled={running} title="Run all tests (Ctrl+Enter)">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden /> {running ? 'Running…' : 'Run tests'}
          </Button>
          {!submitted ? (
            <Button size="sm" variant="primary" onClick={() => setSubmitOpen(true)}><Send className="h-3.5 w-3.5" aria-hidden /> Submit</Button>
          ) : (
            <Button size="sm" variant="primary" onClick={() => { setReviewId(null); }}>New attempt</Button>
          )}
          <Button size="sm" variant="ghost" aria-label="Toggle problem panel" onClick={() => (leftRef.current?.isCollapsed() ? leftRef.current.expand() : leftRef.current?.collapse())}><PanelLeft className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" aria-label="Toggle reference panel" onClick={() => (bottomRef.current?.isCollapsed() ? bottomRef.current.expand() : bottomRef.current?.collapse())}><PanelBottom className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" aria-label="Toggle output panel" onClick={() => (rightRef.current?.isCollapsed() ? rightRef.current.expand() : rightRef.current?.collapse())}><PanelRight className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" aria-label={maximized ? 'Restore panels' : 'Maximise editor'} title="Maximise editor (Ctrl+Shift+M)" onClick={toggleMax}>
            {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {submitted && (
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-ok/5 px-3 py-2 text-sm" role="status">
          <CheckCircle2 className="h-4 w-4 text-ok" aria-hidden />
          <span>
            Final review — submitted {new Date(attempt.endedAt!).toLocaleString()} as <strong>{OUTCOME_LABEL[attempt.outcome!]}</strong>
            {attempt.lastRun ? ` (tests ${attempt.lastRun.passed}/${attempt.lastRun.total})` : ' (tests never run)'}. Solution, hints and hidden tests are now visible.
          </span>
        </div>
      )}

      <PanelGroup direction="vertical" autoSaveId="fil-ws-v" className="min-h-0 flex-1">
        <Panel defaultSize={70} minSize={25}>
          <PanelGroup direction="horizontal" autoSaveId="fil-ws-h">
            {/* Left: problem */}
            <Panel ref={leftRef} defaultSize={27} minSize={15} collapsible collapsedSize={0} className="flex flex-col bg-panel">
              <div className="border-b border-border px-2 py-1">
                <Tabs
                  size="sm"
                  label="Problem"
                  value={leftTab}
                  onChange={setLeftTab}
                  tabs={[
                    { id: 'description', label: 'Description' },
                    { id: 'clarify', label: 'Clarify' },
                    { id: 'requirements', label: `Requirements ${doneSet.size}/${problem.spec.requirements.length}` },
                    { id: 'testing', label: 'Testing' },
                    { id: 'previous', label: `Past attempts (${previous.length})`, hidden: mode !== 'revision' && !previous.length },
                  ]}
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {leftTab === 'description' && <DescriptionView problem={problem} />}
                {leftTab === 'clarify' && <ClarificationsView problem={problem} />}
                {leftTab === 'requirements' && (
                  <RequirementsChecklist problem={problem} done={doneSet} onToggle={submitted ? undefined : (rid, v) => repo.toggleRequirement(attempt.id, rid, v)} />
                )}
                {leftTab === 'testing' && <TestingPlanView problem={problem} />}
                {leftTab === 'previous' && <PreviousAttempts attempts={previous} />}
              </div>
            </Panel>
            <PanelResizeHandle className="w-1" />

            {/* Center: editor */}
            <Panel defaultSize={43} minSize={25} className="flex flex-col">
              <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-panel px-1.5 py-1" role="tablist" aria-label="Files">
                {fileList.map((p) => (
                  <button
                    key={p}
                    role="tab"
                    aria-selected={activeFile === p}
                    onClick={() => setActiveFile(p)}
                    className={cn('flex items-center gap-1 whitespace-nowrap rounded px-2 py-1 font-mono text-xs', activeFile === p ? 'bg-muted text-fg' : 'text-subtle hover:text-fg')}
                  >
                    {isReadonly(p) ? <Lock className="h-3 w-3" aria-label="read-only" /> : <FileCode2 className="h-3 w-3" aria-hidden />}
                    {p.slice(1)}
                    {testSource(p) && problem.tests.find((t) => t.path === p)?.visibility === 'hidden' && <span className="text-[10px] text-warn">hidden</span>}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-1 pl-2">
                  {canSwitchLanguage && (
                    <Select
                      aria-label="Language"
                      className="h-6 text-xs"
                      value={entry.endsWith('.ts') ? 'ts' : 'js'}
                      onChange={(e) => {
                        const to = e.target.value === 'ts' ? entry.replace(/\.js$/, '.ts') : entry.replace(/\.ts$/, '.js');
                        if (to === entry) return;
                        setFiles((f) => {
                          if (!f) return f;
                          const { [entry]: code, ...rest } = f;
                          return { ...rest, [to]: code };
                        });
                        setActiveFile(to);
                      }}
                    >
                      <option value="js">JavaScript</option>
                      <option value="ts">TypeScript</option>
                    </Select>
                  )}
                  {!submitted && (
                    <Button size="sm" variant="ghost" className="h-6" onClick={() => setResetOpen(true)} title="Reset files to the starter code">
                      <RotateCcw className="h-3 w-3" aria-hidden /> Reset
                    </Button>
                  )}
                </div>
              </div>
              <div className="min-h-0 flex-1">
                <Suspense fallback={<div className="p-4 text-sm text-subtle">Loading editor…</div>}>
                  <CodeEditor
                    key={activeFile + (isReadonly(activeFile) ? ':ro' : '')}
                    modelPath={`file:///${problem.id}${activeFile}`}
                    path={activeFile}
                    value={fileValue}
                    readOnly={isReadonly(activeFile)}
                    onChange={(v) => !isReadonly(activeFile) && updateFile(activeFile, v)}
                    siblingModels={siblingModels}
                  />
                </Suspense>
              </div>
            </Panel>
            <PanelResizeHandle className="w-1" />

            {/* Right: output */}
            <Panel ref={rightRef} defaultSize={30} minSize={15} collapsible collapsedSize={0} className="flex flex-col bg-panel">
              <div className="flex items-center gap-1 border-b border-border px-2 py-1">
                <Tabs
                  size="sm"
                  label="Output"
                  value={rightTab}
                  onChange={setRightTab}
                  tabs={[
                    { id: 'preview', label: 'Preview', hidden: !hasVisualPreview },
                    { id: 'console', label: `Console${consoleEntries.length ? ` (${consoleEntries.length})` : ''}` },
                    { id: 'tests', label: result ? `Tests ${result.tests.filter((t) => t.status === 'pass').length}/${result.tests.length}` : 'Tests' },
                    { id: 'problems', label: `Problems${(result?.diagnostics.length ?? 0) + previewDiagnostics.length ? ` (${(result?.diagnostics.length ?? 0) + previewDiagnostics.length})` : ''}` },
                  ]}
                />
                {hasVisualPreview && rightTab === 'preview' && (
                  <div className="ml-auto flex items-center gap-1">
                    <label className="flex items-center gap-1 text-[11px] text-subtle">
                      <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} /> auto
                    </label>
                    <Button size="sm" variant="ghost" className="h-6 px-1.5" aria-label="Refresh preview" onClick={refreshPreview}><RefreshCw className="h-3.5 w-3.5" /></Button>
                  </div>
                )}
                {rightTab === 'console' && (
                  <Button size="sm" variant="ghost" className="ml-auto h-6" onClick={() => setConsole([])}>Clear</Button>
                )}
              </div>
              <div className="relative min-h-0 flex-1">
                <div ref={previewRef} className={cn('absolute inset-0', rightTab === 'preview' && hasVisualPreview ? 'block' : 'hidden')} />
                {previewDiagnostics.length > 0 && rightTab === 'preview' && (
                  <div className="absolute inset-x-0 top-0 z-10 m-2 rounded border border-bad/40 bg-panel p-2 text-xs text-bad">Syntax errors — see Problems.</div>
                )}
                {rightTab === 'console' && <ConsoleView entries={consoleEntries} hint={problem.execution === 'js' ? 'Run executes your entry file; use console.log to experiment.' : undefined} />}
                {rightTab === 'tests' && <TestResultsView result={result} running={running} problem={problem} showHiddenErrors={submitted} />}
                {rightTab === 'problems' && <ProblemsView diagnostics={[...previewDiagnostics, ...(result?.diagnostics ?? [])]} runtimeErrors={result?.runtimeErrors ?? []} />}
              </div>
              <div ref={testHostRef} aria-hidden className="relative h-0 w-0 overflow-hidden" />
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle className="h-1" />

        {/* Bottom: reference */}
        <Panel ref={bottomRef} defaultSize={30} minSize={10} collapsible collapsedSize={0} className="flex flex-col bg-panel">
          <div className="border-b border-border px-2 py-1">
            <Tabs
              size="sm"
              label="Reference"
              value={bottomTab}
              onChange={setBottomTab}
              tabs={[
                { id: 'hints', label: `Hints${attempt.hintsRevealed ? ` (${attempt.hintsRevealed}/${problem.hints.length})` : ''}` },
                { id: 'solution', label: 'Solution' },
                { id: 'concepts', label: 'Concepts' },
                { id: 'notes', label: 'Notes' },
                { id: 'followups', label: 'Follow-ups' },
                { id: 'mcqs', label: 'MCQs' },
                { id: 'sources', label: 'Sources' },
              ]}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {bottomTab === 'hints' && (
              <HintsPanel hints={problem.hints} revealed={submitted ? problem.hints.length : attempt.hintsRevealed} locked={helpLocked} onReveal={(i) => repo.revealHint(attempt.id, i)} />
            )}
            {bottomTab === 'solution' && (
              <SolutionPanel
                problem={problem}
                revealed={submitted || attempt.solutionRevealed}
                lockedReason={solutionLocked}
                activeIndependent={!submitted && independent}
                onReveal={() => repo.revealSolution(attempt.id)}
              />
            )}
            {bottomTab === 'concepts' && <ConceptsPanel conceptIds={problem.conceptIds} />}
            {bottomTab === 'notes' && <NotesPanel problemId={problem.id} attemptId={attempt.id} title={problem.title} />}
            {bottomTab === 'followups' && <FollowUpsPanel problem={problem} />}
            {bottomTab === 'mcqs' && <McqPanel problem={problem} />}
            {bottomTab === 'sources' && <SourcesPanel q={problem} />}
          </div>
        </Panel>
      </PanelGroup>

      <SubmitDialog
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        attempt={attempt}
        problem={problem}
        needsRun={dirtySinceRun.current || !attempt.lastRun}
        onSubmit={async (input) => {
          // The outcome must reflect the final code: re-run the tests if anything changed since the last run.
          if (dirtySinceRun.current || !attempt.lastRun) await runAllTests();
          await saveNow();
          const done = await repo.submitCodingAttempt(attempt.id, { ...input, files: filesRef.current ?? files });
          setSubmitOpen(false);
          if (done) setReviewId(done.id);
          setBottomTab('solution');
        }}
      />
      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset to starter code?"
        footer={
          <>
            <Button onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                setFiles({ ...problem.files.starter });
                setResetOpen(false);
              }}
            >
              Reset files
            </Button>
          </>
        }
      >
        <p className="text-sm">Your current code for this problem will be replaced by the starter files. Code saved with previous submitted attempts is kept in Attempt History.</p>
      </Dialog>
    </div>
  );
}

function StartPanel({ problem, attempts, onStart }: { problem: CodingProblem; attempts: Attempt[]; onStart: (m: PracticeMode) => void }) {
  const hasHistory = attempts.some((a) => a.status === 'submitted');
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-semibold">{problem.title}</h1>
      <p className="mt-1 text-sm text-subtle">Choose how you want to practise. Your mode, hints, solution views, test runs and time are recorded with the attempt.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {(Object.keys(MODE_INFO) as PracticeMode[]).map((m) => (
          <button
            key={m}
            disabled={m === 'revision' && !hasHistory}
            onClick={() => onStart(m)}
            className="rounded-lg border border-border bg-panel p-4 text-left hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="font-semibold">{MODE_INFO[m].label} mode</div>
            <p className="mt-1 text-xs text-subtle">{MODE_INFO[m].description}</p>
            {m === 'revision' && !hasHistory && <p className="mt-1 text-xs text-warn">Available after your first submission.</p>}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm"><Link className="text-accent hover:underline" to={`/problems/${problem.id}`}>← Read the full requirement roadmap first</Link></p>
    </div>
  );
}

function PreviousAttempts({ attempts }: { attempts: Attempt[] }) {
  if (!attempts.length) return <p className="text-sm text-subtle">No previous submitted attempts.</p>;
  return (
    <ul className="space-y-3 text-sm">
      {attempts.slice().reverse().map((a) => (
        <li key={a.id} className="rounded-md border border-border p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-subtle">{new Date(a.startedAt).toLocaleDateString()} · {a.mode}</span>
            <OutcomeBadge o={a.outcome} />
          </div>
          <p className="mt-1 text-xs">Tests: {a.lastRun ? `${a.lastRun.passed}/${a.lastRun.total}` : 'not run'} · confidence {a.confidence ?? '—'}/5</p>
          {a.mistakes && <p className="mt-1 whitespace-pre-wrap"><span className="font-medium">Mistakes:</span> {a.mistakes}</p>}
        </li>
      ))}
      <li><Link to="/history" className="text-xs text-accent hover:underline">Compare code between attempts in Attempt History →</Link></li>
    </ul>
  );
}

function ConsoleView({ entries, hint }: { entries: ConsoleEntry[]; hint?: string }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [entries.length]);
  return (
    <div className="absolute inset-0 overflow-y-auto font-mono text-xs" role="log" aria-label="Console output">
      {!entries.length && <p className="p-3 font-sans text-subtle">No console output yet.{hint ? ` ${hint}` : ''}</p>}
      {entries.map((e, i) => (
        <div key={i} className={cn('whitespace-pre-wrap border-b border-border/60 px-3 py-1', e.level === 'error' && 'bg-bad/5 text-bad', e.level === 'warn' && 'bg-warn/5 text-warn')}>
          {e.text}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

function ProblemsView({ diagnostics, runtimeErrors }: { diagnostics: Diagnostic[]; runtimeErrors: { name: string; message: string; stack: string }[] }) {
  if (!diagnostics.length && !runtimeErrors.length) return <p className="p-3 text-sm text-subtle">No problems detected in the last run.</p>;
  return (
    <ul className="absolute inset-0 divide-y divide-border overflow-y-auto text-xs">
      {diagnostics.map((d, i) => (
        <li key={`d${i}`} className="px-3 py-1.5">
          <span className={d.category === 'error' ? 'text-bad' : 'text-warn'}>{d.category}</span> <span className="font-mono">{d.file}:{d.line}:{d.column}</span>
          {d.code ? <span className="text-subtle"> TS{d.code}</span> : null}
          <div className="whitespace-pre-wrap">{d.message}</div>
        </li>
      ))}
      {runtimeErrors.map((e, i) => (
        <li key={`r${i}`} className="px-3 py-1.5">
          <span className="text-bad">{e.name}</span>: {e.message}
          {e.stack && <pre className="mt-1 whitespace-pre-wrap text-subtle">{e.stack}</pre>}
        </li>
      ))}
    </ul>
  );
}

function TestResultsView({ result, running, problem, showHiddenErrors }: { result: RunResult | null; running: boolean; problem: CodingProblem; showHiddenErrors: boolean }) {
  if (running) return <p className="p-3 text-sm text-subtle" role="status">Running tests in an isolated sandbox…</p>;
  if (!result) return <p className="p-3 text-sm text-subtle">Tests have not been run in this session. Press <kbd className="rounded border border-border px-1">Ctrl</kbd>+<kbd className="rounded border border-border px-1">Enter</kbd>.</p>;
  const groups: [string, TestCaseResult[]][] = [];
  for (const t of result.tests) {
    const g = groups.find(([f]) => f === t.file);
    if (g) g[1].push(t);
    else groups.push([t.file, [t]]);
  }
  const passed = result.tests.filter((t) => t.status === 'pass').length;
  return (
    <div className="absolute inset-0 overflow-y-auto text-sm">
      <div className={cn('border-b border-border px-3 py-2', result.status === 'completed' && passed === result.tests.length && result.tests.length > 0 ? 'bg-ok/5' : 'bg-bad/5')} role="status">
        <p className="font-medium">
          {passed}/{result.tests.length} passed · {result.durationMs} ms · {new Date(result.startedAt).toLocaleTimeString()}
        </p>
        {result.message && <p className="mt-0.5 flex items-start gap-1 text-xs text-bad"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden /> {result.message}</p>}
        <p className="mt-0.5 text-[11px] text-subtle">Results are from an actual execution{problem.execution === 'ts-types' ? ' of the TypeScript compiler' : ' in the sandbox'}; nothing is inferred.</p>
      </div>
      {groups.map(([file, tests]) => {
        const hidden = tests[0]?.visibility === 'hidden';
        return (
          <section key={file} className="border-b border-border">
            <h3 className="flex items-center gap-2 bg-muted/50 px-3 py-1 font-mono text-xs">
              {file} {hidden && <Badge tone="warn">hidden</Badge>}
            </h3>
            <ul>
              {tests.map((t, i) => (
                <li key={i} className="px-3 py-1.5">
                  <div className="flex items-start gap-1.5">
                    {t.status === 'pass' ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" aria-label="passed" /> : t.status === 'fail' ? <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bad" aria-label="failed" /> : <CircleSlash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bad" aria-label="error" />}
                    <span className="flex-1">{t.name}</span>
                    {t.kind === 'runtime' && <span className="text-[11px] text-subtle">{t.durationMs}ms</span>}
                  </div>
                  {t.error && (!hidden || showHiddenErrors || t.kind === 'type') && (
                    <pre className="ml-5 mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-bad/5 p-1.5 font-mono text-[11px] text-bad">{t.error.message.slice(0, 2000)}{t.error.stack ? `\n${t.error.stack}` : ''}</pre>
                  )}
                  {t.error && hidden && !showHiddenErrors && t.kind !== 'type' && <p className="ml-5 text-[11px] text-subtle">Hidden test — details are shown after you submit.</p>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function SubmitDialog({
  open,
  onClose,
  attempt,
  problem,
  needsRun,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  attempt: Attempt;
  problem: CodingProblem;
  needsRun: boolean;
  onSubmit: (i: { confidence: 1 | 2 | 3 | 4 | 5; mistakes: string; nextRevisionAt?: number }) => Promise<void>;
}) {
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [mistakes, setMistakes] = useState('');
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const predicted = classifyCodingOutcome(attempt);
  const suggested = new Date(Date.now() + revisionIntervalDays(confidence, predicted) * 86_400_000).toISOString().slice(0, 10);
  const mustMissing = problem.spec.requirements.filter((r) => r.level === 'MUST' && !attempt.requirementsDone.includes(r.id)).length;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Submit attempt"
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            variant="primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSubmit({ confidence, mistakes, nextRevisionAt: new Date((date || suggested) + 'T09:00:00').getTime() });
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? (needsRun ? 'Running tests…' : 'Submitting…') : 'Submit'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="rounded-md border border-border p-2.5">
          <p>
            Hints used: <strong>{attempt.hintsRevealed}</strong> · Solution viewed: <strong>{attempt.solutionRevealed ? 'yes' : 'no'}</strong> · Last test run:{' '}
            <strong>{attempt.lastRun ? `${attempt.lastRun.passed}/${attempt.lastRun.total}` : 'none'}</strong>
          </p>
          {needsRun && <p className="mt-1 text-xs text-warn">Your code changed since the last test run — tests will be re-run before submitting so the result reflects your final code.</p>}
          {(attempt.hintsRevealed > 0 || attempt.solutionRevealed) && <p className="mt-1 text-xs text-warn">This attempt will be recorded as “{OUTCOME_LABEL.assisted}”.</p>}
          {mustMissing > 0 && <p className="mt-1 text-xs text-subtle">{mustMissing} MUST requirement(s) not checked off — interview-ready requires all of them.</p>}
        </div>
        <fieldset>
          <legend className="mb-1 font-medium">How confident are you that you could do this again in an interview?</legend>
          <div className="flex gap-1">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <label key={n} className={cn('flex cursor-pointer items-center gap-1 rounded border px-2.5 py-1', confidence === n ? 'border-accent bg-accent/10' : 'border-border')}>
                <input type="radio" name="confidence" className="sr-only" checked={confidence === n} onChange={() => setConfidence(n)} />
                {n}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-subtle">1 = could not do it again · 5 = could explain and implement it cold</p>
        </fieldset>
        <label className="block">
          <span className="mb-1 block font-medium">Mistakes and lessons (optional)</span>
          <Textarea value={mistakes} onChange={(e) => setMistakes(e.target.value)} placeholder="e.g. forgot to abort the previous request on unmount" className="min-h-[80px]" />
        </label>
        <label className="block">
          <span className="mb-1 block font-medium">Next revision date</span>
          <input type="date" className="h-8 rounded-md border border-border bg-panel px-2" value={date || suggested} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
    </Dialog>
  );
}
