import { createTimer, elapsedMs, formatDuration, isExpired, pauseTimer, remainingMs, resetTimer, setCountdown, startTimer } from './timer';

describe('timer', () => {
  it('accumulates only while running and survives pause/resume', () => {
    let t = createTimer('stopwatch');
    expect(elapsedMs(t, 1000)).toBe(0);
    t = startTimer(t, 1000);
    expect(elapsedMs(t, 4000)).toBe(3000);
    t = pauseTimer(t, 4000);
    expect(elapsedMs(t, 100000)).toBe(3000); // paused: no growth
    t = startTimer(t, 200000);
    expect(elapsedMs(t, 201000)).toBe(4000);
  });

  it('is serialisable: elapsed time is derived from timestamps (persists across reloads)', () => {
    const running = startTimer(createTimer('stopwatch'), 0);
    const restored = JSON.parse(JSON.stringify(running));
    expect(elapsedMs(restored, 5000)).toBe(5000);
  });

  it('start is idempotent, pause on a paused timer is a no-op', () => {
    const t = startTimer(createTimer(), 10);
    expect(startTimer(t, 999)).toBe(t);
    const p = pauseTimer(t, 20);
    expect(pauseTimer(p, 50)).toBe(p);
  });

  it('countdown presets, remaining time and expiry', () => {
    let t = setCountdown(createTimer('stopwatch'), 30);
    expect(t.mode).toBe('countdown');
    t = startTimer(t, 0);
    expect(remainingMs(t, 10 * 60_000)).toBe(20 * 60_000);
    expect(isExpired(t, 29 * 60_000)).toBe(false);
    expect(isExpired(t, 30 * 60_000)).toBe(true);
    expect(remainingMs(t, 40 * 60_000)).toBe(0);
  });

  it('reset clears time and stops', () => {
    const t = resetTimer(startTimer(createTimer(), 0));
    expect(t.runningSince).toBeNull();
    expect(elapsedMs(t, 99999)).toBe(0);
  });

  it('formats durations', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(61_000)).toBe('01:01');
    expect(formatDuration(3_723_000)).toBe('1:02:03');
  });
});
