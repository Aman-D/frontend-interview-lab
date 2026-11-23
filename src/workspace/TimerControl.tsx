import { Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Select, cn } from '@/components/ui';
import { elapsedMs, formatDuration, isExpired, pauseTimer, remainingMs, resetTimer, setCountdown, startTimer, TIMER_PRESETS_MIN, type TimerState } from '@/lib/timer';

export function TimerControl({ timer, onChange, disabled }: { timer: TimerState; onChange: (t: TimerState) => void; disabled?: boolean }) {
  const [now, setNow] = useState(Date.now());
  const running = timer.runningSince !== null;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [running]);
  const expired = isExpired(timer, now);
  const shown = timer.mode === 'countdown' ? remainingMs(timer, now) : elapsedMs(timer, now);
  const presetValue = timer.mode === 'stopwatch' ? 'stopwatch' : String(timer.durationMs / 60_000);

  return (
    <div className={cn('flex items-center gap-1 rounded-md border px-1.5 py-0.5', running ? 'border-accent/60 bg-accent/5' : 'border-border', expired && 'border-bad bg-bad/10')}>
      <Timer className={cn('h-3.5 w-3.5', running ? 'text-accent' : 'text-subtle')} aria-hidden />
      <span className="min-w-[52px] font-mono text-sm tabular-nums" role="timer" aria-label={`${timer.mode === 'countdown' ? 'Time remaining' : 'Elapsed time'} ${formatDuration(shown)}${running ? ', running' : ', paused'}`}>
        {formatDuration(shown)}
      </span>
      {expired && <span className="text-xs font-medium text-bad">Time's up</span>}
      {running && !expired && <span className="sr-only">Timer running</span>}
      <Select
        aria-label="Timer mode"
        className="h-6 border-0 bg-transparent px-1 text-xs"
        value={presetValue}
        disabled={disabled || running}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === 'stopwatch' ? { ...resetTimer(timer), mode: 'stopwatch' } : resetTimer(setCountdown(timer, Number(v))));
        }}
      >
        <option value="stopwatch">Stopwatch</option>
        {TIMER_PRESETS_MIN.map((m) => <option key={m} value={m}>{m} min</option>)}
      </Select>
      <Button size="sm" variant="ghost" className="h-6 px-1.5" disabled={disabled} aria-label={running ? 'Pause timer' : 'Start timer'} onClick={() => onChange(running ? pauseTimer(timer, Date.now()) : startTimer(timer, Date.now()))}>
        {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>
      <Button size="sm" variant="ghost" className="h-6 px-1.5" disabled={disabled} aria-label="Reset timer" onClick={() => onChange(resetTimer(timer))}>
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
