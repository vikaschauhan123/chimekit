import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NotificationManager } from '../src/core/manager';

describe('singleAtATime', () => {
  let manager: NotificationManager;

  beforeEach(() => {
    document.getElementById('notify-root')?.remove();
    manager = new NotificationManager();
    manager.configure({ singleAtATime: true });
  });

  afterEach(() => {
    document.getElementById('notify-root')?.remove();
  });

  it('replace: only one notification is ever visible; the old one closes with reason "replaced"', () => {
    manager.configure({ onOverflowBehavior: 'replace' });
    const closed: Array<[string, string]> = [];
    const firstId = manager.open('info', {
      message: 'first',
      duration: 'infinite',
      onClose: (id, reason) => closed.push([id, reason]),
    });
    const secondId = manager.open('info', { message: 'second', duration: 'infinite' });

    expect(document.querySelectorAll('.notify-toast').length).toBe(1);
    expect(closed).toEqual([[firstId, 'replaced']]);
    expect(secondId).not.toBe(firstId);
  });

  it('queue-and-close-previous: the previous toast plays its close animation while the new one shows immediately', async () => {
    manager.configure({ onOverflowBehavior: 'queue-and-close-previous' });
    const closed: string[] = [];
    manager.open('info', {
      message: 'first',
      duration: 'infinite',
      onClose: (_id, reason) => closed.push(reason),
    });
    manager.open('info', { message: 'second', duration: 'infinite' });

    expect(closed).toEqual(['replaced']);
    // The new toast is already visible even before the old one finishes its exit animation.
    expect(
      Array.from(document.querySelectorAll('.notify-message')).some((el) => el.textContent === 'second'),
    ).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(document.querySelectorAll('.notify-toast').length).toBe(1);
    expect(document.querySelector('.notify-message')?.textContent).toBe('second');
  });
});
