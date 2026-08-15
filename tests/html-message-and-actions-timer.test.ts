import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NotificationManager } from '../src/core/manager';
import { COUNTDOWN_SLOT_ATTR } from '../src/core/render';

describe('custom HTML message', () => {
  let manager: NotificationManager;

  beforeEach(() => {
    document.getElementById('notify-root')?.remove();
    manager = new NotificationManager();
  });

  afterEach(() => {
    document.getElementById('notify-root')?.remove();
  });

  it('renders a { html } message as markup, not escaped text', () => {
    const id = manager.open('info', {
      message: { html: '<strong>Bold</strong> and <a href="#">a link</a>' },
      duration: 'infinite',
    });
    const messageEl = document.getElementById(`notify-message-${id}`)!;
    expect(messageEl.innerHTML).toBe('<strong>Bold</strong> and <a href="#">a link</a>');
    expect(messageEl.querySelector('strong')?.textContent).toBe('Bold');
    expect(messageEl.querySelector('a')?.getAttribute('href')).toBe('#');
  });

  it('still treats a plain string message as text, not markup', () => {
    const id = manager.open('info', { message: '<strong>not bold</strong>', duration: 'infinite' });
    const messageEl = document.getElementById(`notify-message-${id}`)!;
    expect(messageEl.textContent).toBe('<strong>not bold</strong>');
    expect(messageEl.querySelector('strong')).toBeNull();
  });

  it('inserts the countdown at a [data-notify-countdown] marker instead of at the end', () => {
    const id = manager.open('info', {
      message: { html: `<b>Before</b> <span ${COUNTDOWN_SLOT_ATTR}></span> <em>after the countdown</em>` },
      duration: 5000,
      timerStyle: 'countdown-number',
    });
    const messageEl = document.getElementById(`notify-message-${id}`)!;
    const countdown = document.getElementById(`notify-countdown-${id}`)!;

    expect(messageEl.querySelector(`[${COUNTDOWN_SLOT_ATTR}]`)).toBeNull(); // marker was replaced
    expect(countdown.previousElementSibling?.tagName).toBe('B');
    expect(countdown.nextElementSibling?.tagName).toBe('EM');
    expect(countdown.nextElementSibling?.textContent).toBe('after the countdown');
  });

  it('falls back to appending the countdown at the end when no marker is present', () => {
    const id = manager.open('info', {
      message: { html: '<b>No marker here</b>' },
      duration: 5000,
      timerStyle: 'countdown-number',
    });
    const messageEl = document.getElementById(`notify-message-${id}`)!;
    const countdown = document.getElementById(`notify-countdown-${id}`)!;
    expect(messageEl.lastElementChild).toBe(countdown);
  });
});

describe('actions notifications can also show a timer', () => {
  let manager: NotificationManager;

  beforeEach(() => {
    document.getElementById('notify-root')?.remove();
    manager = new NotificationManager();
  });

  afterEach(() => {
    document.getElementById('notify-root')?.remove();
  });

  it('renders both the actions row and a progress bar when both are configured', () => {
    const id = manager.open('error', {
      message: 'Upload failed',
      duration: 6000,
      timerStyle: 'progress-bar',
      actions: [{ id: 'retry', label: 'Retry' }],
    });
    expect(document.getElementById(`notify-actions-${id}`)).not.toBeNull();
    expect(document.getElementById(`notify-progress-${id}`)).not.toBeNull();
    expect(document.getElementById(`notify-progress-fill-${id}`)).not.toBeNull();
  });

  it('renders both the actions row and a countdown number when both are configured', () => {
    const id = manager.open('error', {
      message: 'Upload failed',
      duration: 6000,
      timerStyle: 'countdown-number',
      actions: [{ id: 'retry', label: 'Retry' }],
    });
    expect(document.getElementById(`notify-actions-${id}`)).not.toBeNull();
    expect(document.getElementById(`notify-countdown-${id}`)).not.toBeNull();
  });
});
