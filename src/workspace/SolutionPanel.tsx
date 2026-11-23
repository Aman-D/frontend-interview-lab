import { EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Markdown } from '@/components/Markdown';
import { Button, Dialog, Tabs } from '@/components/ui';
import type { CodingProblem } from '@/content/schema';

const SECTIONS: [keyof CodingProblem['solution'], string][] = [
  ['initialApproach', '1. Initial approach'],
  ['bruteForce', '2. Brute-force approach'],
  ['optimizedApproach', '3. Optimised approach'],
  ['walkthrough', '5. Step-by-step explanation'],
  ['complexity', '6. Complexity analysis'],
  ['edgeCases', '7. Edge-case handling'],
  ['alternatives', '8. Alternative designs'],
  ['tradeoffs', '9. Trade-offs'],
  ['commonMistakes', '10. Common mistakes'],
  ['testingStrategy', '11. Testing strategy'],
  ['seniorFollowUps', '12. Senior-level follow-ups'],
];

export function SolutionPanel({
  problem,
  revealed,
  lockedReason,
  activeIndependent,
  onReveal,
}: {
  problem: CodingProblem;
  revealed: boolean;
  /** When set, the solution cannot be revealed (e.g. Interview Mode before submission). */
  lockedReason?: string;
  /** True during an active attempt that is still independent — reveal requires confirmation. */
  activeIndependent: boolean;
  onReveal: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const files = Object.keys(problem.files.solution).filter((p) => !problem.files.readonly.includes(p) && !p.endsWith('.css'));
  const [file, setFile] = useState(files[0] ?? '');

  if (lockedReason) {
    return (
      <div className="flex items-center gap-2 text-sm text-subtle">
        <EyeOff className="h-4 w-4" aria-hidden /> {lockedReason}
      </div>
    );
  }
  if (!revealed) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-subtle">The solution is hidden. Try the hints first — revealing the solution marks this attempt as <strong>assisted</strong>.</p>
        <Button variant="danger" onClick={() => (activeIndependent ? setConfirm(true) : onReveal())}>Reveal solution</Button>
        <Dialog
          open={confirm}
          onClose={() => setConfirm(false)}
          title="Reveal the solution?"
          footer={
            <>
              <Button onClick={() => setConfirm(false)}>Keep practising</Button>
              <Button variant="danger" onClick={() => { setConfirm(false); onReveal(); }}>Reveal solution</Button>
            </>
          }
        >
          <p className="text-sm">You are in an active independent attempt. Revealing the solution is recorded and this attempt will be classified as <strong>completed with help</strong>, not independently solved.</p>
        </Dialog>
      </div>
    );
  }
  return (
    <div className="space-y-5 text-sm">
      {SECTIONS.slice(0, 3).map(([k, label]) =>
        problem.solution[k] ? (
          <section key={k}>
            <h3 className="mb-1 font-semibold">{label}</h3>
            <Markdown>{problem.solution[k] as string}</Markdown>
          </section>
        ) : null,
      )}
      <section>
        <h3 className="mb-1 font-semibold">4. Complete working code</h3>
        <p className="mb-2 text-xs text-subtle">Reference solution — validated by running the full public + hidden test-suite in the in-app runner.</p>
        {files.length > 1 && <Tabs size="sm" label="Solution files" value={file} onChange={setFile} tabs={files.map((f) => ({ id: f, label: f.slice(1) }))} />}
        <pre className="mt-2 max-h-[480px] overflow-auto rounded-md border border-border bg-muted p-3 font-mono text-xs leading-relaxed">{problem.files.solution[file]}</pre>
      </section>
      {SECTIONS.slice(3).map(([k, label]) =>
        problem.solution[k] ? (
          <section key={k}>
            <h3 className="mb-1 font-semibold">{label}</h3>
            <Markdown>{problem.solution[k] as string}</Markdown>
          </section>
        ) : null,
      )}
    </div>
  );
}
