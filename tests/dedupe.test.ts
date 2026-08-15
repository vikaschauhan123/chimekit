import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationManager } from '../src/core/manager';

describe('deduplication (unique + duplicateStrategy)', () => {
  let manager: NotificationManager;

  beforeEach(() => {
    document.getElementById('notify-root')?.remove();
    manager = new NotificationManager();
  });

  afterEach(() => {
    document.getElementById('notify-root')?.remove();
  });

  it('"ignore": a duplicate call is a no-op and returns the existing id', () => {
    manager.configure({ duplicateStrategy: 'ignore' });
    const firstId = manager.open('info', { message: 'Syncing…', unique: 'sync', duration: 'infinite' });
    const secondId = manager.open('info', { message: 'Syncing…', unique: 'sync', duration: 'infinite' });

    expect(secondId).toBe(firstId);
    expect(document.querySelectorAll('.notify-toast').length).toBe(1);
  });

  it('"restart-timer": the existing toast\'s countdown restarts instead of adding a new one', () => {
    vi.useFakeTimers();
    manager.configure({ duplicateStrategy: 'restart-timer' });
    const onClose = vi.fn();
    const id = manager.open('info', { message: 'Syncing…', unique: 'sync', duration: 1000, onClose });

    vi.advanceTimersByTime(900);
    const secondId = manager.open('info', { message: 'Syncing…', unique: 'sync', duration: 1000 });
    expect(secondId).toBe(id);

    vi.advanceTimersByTime(900);
    expect(onClose).not.toHaveBeenCalled(); // would have fired by now if the timer hadn't restarted

    vi.advanceTimersByTime(100);
    expect(onClose).toHaveBeenCalledWith(id, 'timer');
    vi.useRealTimers();
  });

  it('"bump-to-top": the existing toast moves to the front instead of duplicating', () => {
    manager.configure({ duplicateStrategy: 'bump-to-top' });
    const firstId = manager.open('info', { message: 'first', unique: 'a', duration: 'infinite' });
    manager.open('info', { message: 'second', unique: 'b', duration: 'infinite' });
    manager.open('info', { message: 'third', unique: 'c', duration: 'infinite' });

    // Re-triggering 'a' should bump it back to the front (newest-on-top default) without duplicating.
    manager.open('info', { message: 'first', unique: 'a', duration: 'infinite' });

    const toasts = Array.from(document.querySelectorAll<HTMLElement>('.notify-toast'));
    expect(toasts.length).toBe(3);
    expect(toasts[0].dataset.id).toBe(firstId);
  });
});
