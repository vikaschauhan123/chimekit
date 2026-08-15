import { afterEach, describe, expect, it } from 'vitest';
import { notify } from 'chimekit';
import { NotificationPlugin, useNotify } from '../src/adapters/vue';

describe('vue adapter', () => {
  afterEach(() => {
    document.getElementById('notify-root')?.remove();
  });

  it('useNotify() returns the same singleton as the core notify API', () => {
    expect(useNotify()).toBe(notify);
  });

  it('NotificationPlugin.install() applies global config', () => {
    const id = (() => {
      NotificationPlugin.install?.({} as never, { position: 'bottom-left' });
      return notify.info({ message: 'x', duration: 'infinite' });
    })();

    const stack = document.getElementById('notify-stack-bottom-left');
    expect(stack?.querySelector(`#notify-toast-${id}`)).not.toBeNull();
  });
});
