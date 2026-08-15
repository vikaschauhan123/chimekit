import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NotificationManager } from '../src/core/manager';

describe('per-notification custom background/text color', () => {
  let manager: NotificationManager;

  beforeEach(() => {
    document.getElementById('notify-root')?.remove();
    manager = new NotificationManager();
  });

  afterEach(() => {
    document.getElementById('notify-root')?.remove();
  });

  it('applies backgroundColor as the --notify-bg override on the toast', () => {
    manager.open('info', { message: 'x', duration: 'infinite', backgroundColor: '#111827' });
    const toast = document.querySelector<HTMLElement>('.notify-toast')!;
    expect(toast.style.getPropertyValue('--notify-bg')).toBe('#111827');
  });

  it('applies textColor to the toast and to the message via --notify-muted', () => {
    manager.open('info', { message: 'x', duration: 'infinite', textColor: '#fde68a' });
    const toast = document.querySelector<HTMLElement>('.notify-toast')!;
    expect(toast.style.color).toBe('rgb(253, 230, 138)');
    expect(toast.style.getPropertyValue('--notify-muted')).toBe('#fde68a');
  });

  it('leaves default theme colors untouched when no override is given', () => {
    manager.open('info', { message: 'x', duration: 'infinite' });
    const toast = document.querySelector<HTMLElement>('.notify-toast')!;
    expect(toast.style.getPropertyValue('--notify-bg')).toBe('');
    expect(toast.style.color).toBe('');
  });
});
