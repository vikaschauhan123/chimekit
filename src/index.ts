import { NotificationManager } from './core/manager';
import { COUNTDOWN_SLOT_ATTR } from './core/render';
import type { CloseReason, GlobalConfig, NotificationOptions, NotifyEventMap, Position } from './core/types';

export { COUNTDOWN_SLOT_ATTR };

const manager = new NotificationManager();

export const notify = {
  success: (options: NotificationOptions = {}) => manager.open('success', options),
  error: (options: NotificationOptions = {}) => manager.open('error', options),
  warning: (options: NotificationOptions = {}) => manager.open('warning', options),
  info: (options: NotificationOptions = {}) => manager.open('info', options),
  custom: (options: NotificationOptions = {}) => manager.open(options.type ?? 'custom', options),
  close: (id: string, reason?: CloseReason) => manager.close(id, reason),
  clearAll: (position?: Position) => manager.clearAll(position),
  on: <K extends keyof NotifyEventMap>(event: K, handler: (payload: NotifyEventMap[K]) => void) =>
    manager.on(event, handler),
  off: <K extends keyof NotifyEventMap>(event: K, handler: (payload: NotifyEventMap[K]) => void) =>
    manager.off(event, handler),
};

export function configure(config: GlobalConfig): void {
  manager.configure(config);
}

export function clearAll(position?: Position): void {
  manager.clearAll(position);
}

export function closeAll(position?: Position): void {
  manager.clearAll(position);
}

export type {
  ActionEventPayload,
  CloseEventPayload,
  CloseReason,
  CustomThemeTokens,
  DuplicateStrategy,
  GlobalConfig,
  HtmlMessage,
  MessageContent,
  NotificationAction,
  NotificationOptions,
  NotificationType,
  NotifyEventMap,
  OnOverflowBehavior,
  OpenEventPayload,
  Position,
  RenderContext,
  ResolvedNotificationOptions,
  TimerStyle,
} from './core/types';

// Exposed for tests/adapters that need to reset global state between cases; not part of the
// documented public API surface.
export { NotificationManager };
