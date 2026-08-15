import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Timer } from '../src/core/timer';

describe('Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires onComplete once the full duration elapses', () => {
    const onComplete = vi.fn();
    const timer = new Timer(1000, { onComplete });
    timer.start();

    vi.advanceTimersByTime(999);
    expect(onComplete).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not advance while paused, and resumes from where it left off', () => {
    const onComplete = vi.fn();
    const timer = new Timer(1000, { onComplete });
    timer.start();

    vi.advanceTimersByTime(400);
    timer.pause();
    vi.advanceTimersByTime(5000); // plenty of time — should not fire while paused
    expect(onComplete).not.toHaveBeenCalled();

    timer.resume();
    vi.advanceTimersByTime(599);
    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('cancel() prevents onComplete from ever firing', () => {
    const onComplete = vi.fn();
    const timer = new Timer(1000, { onComplete });
    timer.start();
    timer.cancel();
    vi.advanceTimersByTime(2000);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('restart() resets the countdown to the full original duration', () => {
    const onComplete = vi.fn();
    const timer = new Timer(1000, { onComplete });
    timer.start();
    vi.advanceTimersByTime(900);
    timer.restart();
    vi.advanceTimersByTime(900);
    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
