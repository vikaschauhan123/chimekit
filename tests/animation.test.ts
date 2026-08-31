import { beforeEach, describe, expect, it } from 'vitest';
import { NotificationManager } from '../src/core/manager';

describe('animation configuration', () => {
  let manager: NotificationManager;

  beforeEach(() => {
    document.getElementById('notify-root')?.remove();
    manager = new NotificationManager();
  });

  it('applies the configured global animation to opened toasts', () => {
    manager.configure({
      animation: {
        enter: 'slide-left',
        exit: 'zoom-out',
      },
    });

    manager.open('info', { message: 'hello', duration: 'infinite' });
    const toast = document.querySelector<HTMLElement>('.notify-toast');

    expect(toast?.dataset.animationEnter).toBe('slide-left');
    expect(toast?.dataset.animationExit).toBe('zoom-out');
  });

  it('allows a notification to override the global animation config', () => {
    manager.configure({ animation: { enter: 'fade-in', exit: 'fade-out' } });
    manager.open('success', {
      message: 'done',
      duration: 'infinite',
      animation: { enter: 'zoom-in', exit: 'slide-top' },
    });

    const toast = document.querySelector<HTMLElement>('.notify-toast');
    expect(toast?.dataset.animationEnter).toBe('zoom-in');
    expect(toast?.dataset.animationExit).toBe('slide-top');
  });
});
