import { Injectable } from '@angular/core';
import { clearAll, configure, notify } from 'chimekit';
import type { GlobalConfig, NotificationOptions, NotifyEventMap, Position } from 'chimekit';

/** Thin injectable wrapper around the framework-agnostic core — Angular never touches the DOM directly. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  success(options?: NotificationOptions): string {
    return notify.success(options);
  }

  error(options?: NotificationOptions): string {
    return notify.error(options);
  }

  warning(options?: NotificationOptions): string {
    return notify.warning(options);
  }

  info(options?: NotificationOptions): string {
    return notify.info(options);
  }

  custom(options?: NotificationOptions): string {
    return notify.custom(options);
  }

  close(id: string): void {
    notify.close(id);
  }

  clearAll(position?: Position): void {
    clearAll(position);
  }

  configure(config: GlobalConfig): void {
    configure(config);
  }

  on<K extends keyof NotifyEventMap>(event: K, handler: (payload: NotifyEventMap[K]) => void) {
    return notify.on(event, handler);
  }

  off<K extends keyof NotifyEventMap>(event: K, handler: (payload: NotifyEventMap[K]) => void) {
    notify.off(event, handler);
  }
}
