import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationManager } from '../src/core/manager';

describe('close reasons and events', () => {
  let manager: NotificationManager;

  beforeEach(() => {
    document.getElementById('notify-root')?.remove();
    manager = new NotificationManager();
  });

  afterEach(() => {
    document.getElementById('notify-root')?.remove();
    vi.useRealTimers();
  });

  it('fires "timer" when the duration elapses', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    manager.open('info', { message: 'x', duration: 1000, onClose });
    vi.advanceTimersByTime(1000);
    expect(onClose).toHaveBeenCalledWith(expect.any(String), 'timer');
  });

  it('fires "manual-close-icon" when the close (X) button is clicked', () => {
    const onClose = vi.fn();
    manager.open('info', { message: 'x', duration: 'infinite', onClose });
    document.querySelector<HTMLButtonElement>('.notify-close')!.click();
    expect(onClose).toHaveBeenCalledWith(expect.any(String), 'manual-close-icon');
  });

  it('fires "clear-all" for every notification when clearAll() is called', () => {
    const reasons: string[] = [];
    manager.open('info', { message: 'a', duration: 'infinite', onClose: (_id, r) => reasons.push(r) });
    manager.open('info', { message: 'b', duration: 'infinite', onClose: (_id, r) => reasons.push(r) });
    manager.clearAll();
    expect(reasons).toEqual(['clear-all', 'clear-all']);
  });

  it('fires "programmatic" when close(id) is called directly', () => {
    const onClose = vi.fn();
    const id = manager.open('info', { message: 'x', duration: 'infinite', onClose });
    manager.close(id);
    expect(onClose).toHaveBeenCalledWith(id, 'programmatic');
  });

  it('does NOT close on backdrop click by default (closeOnClick defaults to false)', () => {
    const onClose = vi.fn();
    manager.open('info', { message: 'x', duration: 'infinite', onClose, backdrop: { enabled: true } });
    const backdrop = document.querySelector<HTMLElement>('.notify-backdrop')!;
    expect(backdrop.classList.contains('is-visible')).toBe(true);
    backdrop.click();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('fires "backdrop-click" when the shared backdrop is clicked with closeOnClick enabled', () => {
    const onClose = vi.fn();
    manager.open('info', {
      message: 'x',
      duration: 'infinite',
      onClose,
      backdrop: { enabled: true, closeOnClick: true },
    });
    const backdrop = document.querySelector<HTMLElement>('.notify-backdrop')!;
    expect(backdrop.classList.contains('is-visible')).toBe(true);
    backdrop.click();
    expect(onClose).toHaveBeenCalledWith(expect.any(String), 'backdrop-click');
  });

  it('the backdrop disappears once its notification is gone, regardless of how it closed', () => {
    const id = manager.open('info', {
      message: 'x',
      duration: 'infinite',
      backdrop: { enabled: true },
    });
    manager.close(id); // programmatic close, not a backdrop click
    const backdrop = document.querySelector<HTMLElement>('.notify-backdrop')!;
    expect(backdrop.classList.contains('is-visible')).toBe(false);
  });

  it('also emits every event on the global emitter', () => {
    const openHandler = vi.fn();
    const closeHandler = vi.fn();
    manager.on('open', openHandler);
    manager.on('close', closeHandler);

    const id = manager.open('success', { message: 'x', duration: 'infinite' });
    expect(openHandler).toHaveBeenCalledWith({ id, type: 'success' });

    manager.close(id);
    expect(closeHandler).toHaveBeenCalledWith({ id, reason: 'programmatic', type: 'success' });
  });
});
