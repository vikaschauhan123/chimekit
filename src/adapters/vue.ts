import { configure, notify } from 'chimekit';
import type { GlobalConfig, NotificationOptions } from 'chimekit';
import type { Plugin } from 'vue';

/** Returns the same imperative `notify` API used by vanilla JS/other frameworks. */
export function useNotify() {
  return notify;
}

/**
 * Optional Vue plugin for setting global config declaratively via `app.use()`. The core engine
 * mounts its own DOM portal (`#notify-root` on `document.body`), so this is not required for
 * rendering — `notify.*` works anywhere without it.
 */
export const NotificationPlugin: Plugin<[GlobalConfig?]> = {
  install(_app, config) {
    if (config) configure(config);
  },
};

export { configure, notify };
export type { GlobalConfig, NotificationOptions };
