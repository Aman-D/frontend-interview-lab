/** Persistable timer state. Elapsed time is derived from wall-clock timestamps, so it survives reloads. */
export interface TimerState {
  mode: 'stopwatch' | 'countdown';
  /** Countdown length in ms (only for countdown). */
  durationMs: number;
  /** Time accumulated while running, excluding the current running segment. */
  accumulatedMs: number;
  /** Epoch ms when the current running segment started, or null when paused. */
  runningSince: number | null;
}

export const TIMER_PRESETS_MIN = [30, 45, 60, 90] as const;

export function createTimer(mode: TimerState['mode'] = 'stopwatch', durationMin = 45): TimerState {
  return { mode, durationMs: durationMin * 60_000, accumulatedMs: 0, runningSince: null };
}

export function elapsedMs(t: TimerState, now: number): number {
  return t.accumulatedMs + (t.runningSince !== null ? Math.max(0, now - t.runningSince) : 0);
}

export function remainingMs(t: TimerState, now: number): number {
  return Math.max(0, t.durationMs - elapsedMs(t, now));
}

export function isExpired(t: TimerState, now: number): boolean {
  return t.mode === 'countdown' && elapsedMs(t, now) >= t.durationMs;
}

export function startTimer(t: TimerState, now: number): TimerState {
  return t.runningSince !== null ? t : { ...t, runningSince: now };
}

export function pauseTimer(t: TimerState, now: number): TimerState {
  if (t.runningSince === null) return t;
  return { ...t, accumulatedMs: elapsedMs(t, now), runningSince: null };
}

export function resetTimer(t: TimerState): TimerState {
  return { ...t, accumulatedMs: 0, runningSince: null };
}

export function setCountdown(t: TimerState, minutes: number): TimerState {
  return { ...t, mode: 'countdown', durationMs: minutes * 60_000 };
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatHuman(ms: number): string {
  const min = Math.round(ms / 60_000);
  if (min < 1) return ms > 0 ? '<1 min' : '0 min';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${min % 60} min`;
}
