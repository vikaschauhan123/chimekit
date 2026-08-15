import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NotificationManager } from '../src/core/manager';

describe('DOM ids for CSS/JS targeting', () => {
  let manager: NotificationManager;

  beforeEach(() => {
    document.getElementById('notify-root')?.remove();
    manager = new NotificationManager();
  });

  afterEach(() => {
    document.getElementById('notify-root')?.remove();
  });

  it('gives every part of a full-featured toast a stable, unique id', () => {
    const id = manager.open('error', {
      title: 'Upload failed',
      message: 'Please retry.',
      duration: 5000,
      timerStyle: 'countdown-number',
      actions: [{ id: 'retry', label: 'Retry' }],
    });

    expect(document.getElementById(`notify-toast-${id}`)).not.toBeNull();
    expect(document.getElementById(`notify-icon-${id}`)).not.toBeNull();
    expect(document.getElementById(`notify-body-${id}`)).not.toBeNull();
    expect(document.getElementById(`notify-title-${id}`)).not.toBeNull();
    expect(document.getElementById(`notify-message-${id}`)).not.toBeNull();
    expect(document.getElementById(`notify-countdown-${id}`)).not.toBeNull();
    expect(document.getElementById(`notify-actions-${id}`)).not.toBeNull();
    expect(document.getElementById(`notify-action-${id}-retry`)).not.toBeNull();
    expect(document.getElementById(`notify-close-${id}`)).not.toBeNull();

    // The countdown lives inside the message so it renders right after the text, not on its own line.
    const message = document.getElementById(`notify-message-${id}`)!;
    const countdown = document.getElementById(`notify-countdown-${id}`)!;
    expect(countdown.parentElement).toBe(message);
  });

  it('ids stay unique across multiple simultaneous toasts', () => {
    const idA = manager.open('info', { message: 'a', duration: 'infinite' });
    const idB = manager.open('info', { message: 'b', duration: 'infinite' });

    expect(idA).not.toBe(idB);
    expect(document.getElementById(`notify-toast-${idA}`)).not.toBeNull();
    expect(document.getElementById(`notify-toast-${idB}`)).not.toBeNull();
    expect(document.getElementById(`notify-message-${idA}`)!.textContent).toBe('a');
    expect(document.getElementById(`notify-message-${idB}`)!.textContent).toBe('b');
  });

  it('gives the progress bar track/fill an id when timerStyle is progress-bar', () => {
    const id = manager.open('info', { message: 'x', duration: 4000, timerStyle: 'progress-bar' });
    expect(document.getElementById(`notify-progress-${id}`)).not.toBeNull();
    expect(document.getElementById(`notify-progress-fill-${id}`)).not.toBeNull();
  });

  it('gives shared structural elements (root, backdrop, per-position stack/chrome) stable ids', () => {
    manager.configure({ backdrop: { enabled: true } });
    manager.open('info', { message: 'a', duration: 'infinite', position: 'top-right' });
    manager.open('info', { message: 'a2', duration: 'infinite', position: 'top-right' });
    manager.open('info', { message: 'b', duration: 'infinite', position: 'bottom-left' });

    expect(document.getElementById('notify-root')).not.toBeNull();
    expect(document.getElementById('notify-backdrop')).not.toBeNull();
    expect(document.getElementById('notify-stack-top-right')).not.toBeNull();
    expect(document.getElementById('notify-stack-bottom-left')).not.toBeNull();
    expect(document.getElementById('notify-show-more-top-right')).not.toBeNull();
    expect(document.getElementById('notify-clear-all-top-right')).not.toBeNull();
  });
});
