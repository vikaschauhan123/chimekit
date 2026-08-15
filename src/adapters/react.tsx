import { useEffect, type ReactNode } from 'react';
import { configure, notify } from 'chimekit';
import type { GlobalConfig, NotificationOptions } from 'chimekit';

export interface NotificationProviderProps {
  config?: GlobalConfig;
  children?: ReactNode;
}

/**
 * Optional wrapper for setting global config declaratively. The core engine mounts its own
 * DOM portal (`#notify-root` on `document.body`), so this is not required for rendering —
 * `notify.*` works anywhere without it.
 */
export function NotificationProvider({ config, children }: NotificationProviderProps) {
  useEffect(() => {
    if (config) configure(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(config)]);

  return children ?? null;
}

/** Returns the same imperative `notify` API used by vanilla JS/other frameworks. */
export function useNotify() {
  return notify;
}

export { configure };
export type { GlobalConfig, NotificationOptions };
