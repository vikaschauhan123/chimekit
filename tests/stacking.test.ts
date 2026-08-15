import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NotificationManager } from '../src/core/manager';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('stacking / overflow (maxVisible, show more/less, clear all)', () => {
  let manager: NotificationManager;

  beforeEach(() => {
    document.getElementById('notify-root')?.remove();
    manager = new NotificationManager();
    manager.configure({ maxVisible: 3, position: 'top-right' });
  });

  afterEach(() => {
    document.getElementById('notify-root')?.remove();
  });

  it('collapses everything beyond maxVisible and exposes a "Show N more" control', () => {
    for (let i = 0; i < 5; i++) {
      manager.open('info', { message: `toast ${i}`, duration: 'infinite' });
    }

    const toasts = document.querySelectorAll('.notify-toast');
    expect(toasts.length).toBe(5);

    const collapsed = document.querySelectorAll('.notify-toast--collapsed');
    expect(collapsed.length).toBe(2);

    const showMore = document.querySelector<HTMLButtonElement>('.notify-stack__show-more');
    expect(showMore?.hidden).toBe(false);
    expect(showMore?.textContent).toBe('Show 2 more');
  });

  it('expands the full stack on "Show more" and re-collapses on "Show less"', () => {
    for (let i = 0; i < 5; i++) {
      manager.open('info', { message: `toast ${i}`, duration: 'infinite' });
    }
    const showMore = document.querySelector<HTMLButtonElement>('.notify-stack__show-more')!;

    showMore.click();
    expect(document.querySelectorAll('.notify-toast--collapsed').length).toBe(0);
    expect(showMore.textContent).toBe('Show less');

    showMore.click();
    expect(document.querySelectorAll('.notify-toast--collapsed').length).toBe(2);
  });

  it('"Clear All" dismisses every visible notification and fires clear-all for each', async () => {
    const closedReasons: string[] = [];
    for (let i = 0; i < 4; i++) {
      manager.open('info', {
        message: `toast ${i}`,
        duration: 'infinite',
        onClose: (_id, reason) => closedReasons.push(reason),
      });
    }

    const clearAllBtn = document.querySelector<HTMLButtonElement>('.notify-stack__clear-all')!;
    clearAllBtn.click();

    expect(closedReasons).toEqual(['clear-all', 'clear-all', 'clear-all', 'clear-all']);
    await wait(250);
    expect(document.querySelectorAll('.notify-toast').length).toBe(0);
  });

  it('keeps positions independent — top-right and bottom-left stack separately', () => {
    manager.open('info', { message: 'a', duration: 'infinite', position: 'top-right' });
    manager.open('info', { message: 'b', duration: 'infinite', position: 'bottom-left' });

    expect(document.querySelectorAll('.notify-stack[data-position="top-right"] .notify-toast').length).toBe(1);
    expect(document.querySelectorAll('.notify-stack[data-position="bottom-left"] .notify-toast').length).toBe(1);
  });
});
