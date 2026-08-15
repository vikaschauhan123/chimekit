export interface TimerCallbacks {
  /** Fired roughly every animation frame with the fraction of time remaining, 1 -> 0. */
  onTick?: (fractionRemaining: number, msRemaining: number) => void;
  onComplete: () => void;
}

/**
 * Countdown timer supporting pause/resume (hover) and cancellation.
 * Drives both the 'progress-bar' and 'countdown-number' timerStyle visuals via onTick,
 * and 'none' simply ignores onTick and still fires onComplete.
 */
export class Timer {
  private readonly duration: number;
  private remaining: number;
  private startedAt = 0;
  private rafId: number | null = null;
  private tickIntervalId: ReturnType<typeof setInterval> | null = null;
  private completeTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private paused = false;
  private done = false;

  constructor(durationMs: number, private readonly callbacks: TimerCallbacks) {
    this.duration = durationMs;
    this.remaining = durationMs;
  }

  start(): void {
    if (this.done || this.duration <= 0) return;
    this.startedAt = Date.now();
    this.completeTimeoutId = setTimeout(() => this.complete(), this.remaining);
    if (this.callbacks.onTick) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  private tick = (): void => {
    if (this.paused || this.done) return;
    const elapsed = Date.now() - this.startedAt;
    const msRemaining = Math.max(0, this.remaining - elapsed);
    this.callbacks.onTick?.(msRemaining / this.duration, msRemaining);
    if (msRemaining > 0) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };

  pause(): void {
    if (this.done || this.paused || this.duration <= 0) return;
    this.paused = true;
    const elapsed = Date.now() - this.startedAt;
    this.remaining = Math.max(0, this.remaining - elapsed);
    if (this.completeTimeoutId !== null) clearTimeout(this.completeTimeoutId);
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  resume(): void {
    if (this.done || !this.paused || this.duration <= 0) return;
    this.paused = false;
    this.start();
  }

  cancel(): void {
    this.done = true;
    if (this.completeTimeoutId !== null) clearTimeout(this.completeTimeoutId);
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.tickIntervalId !== null) clearInterval(this.tickIntervalId);
  }

  /** Restarts the countdown from the full original duration (used by duplicateStrategy: 'restart-timer'). */
  restart(): void {
    this.cancel();
    this.done = false;
    this.paused = false;
    this.remaining = this.duration;
    this.start();
  }

  private complete(): void {
    if (this.done) return;
    this.done = true;
    this.callbacks.onTick?.(0, 0);
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.callbacks.onComplete();
  }
}
