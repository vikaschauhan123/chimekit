import { ensureBackdrop, ensureContainer, ensureRoot, hideBackdrop } from './dom';
import { EventEmitter } from './events';
import { generateId } from './id';
import { createNotificationElement, updateTimerUI, type NotificationElements } from './render';
import { Stack } from './stack';
import { Timer } from './timer';
import type {
  BackdropConfig,
  CloseReason,
  GlobalConfig,
  NotificationOptions,
  NotificationType,
  NotifyEventMap,
  Position,
  ResolvedNotificationOptions,
} from './types';

interface InternalRecord {
  options: ResolvedNotificationOptions;
  elements: NotificationElements;
  timer: Timer | null;
  uniqueKey: string | null;
  closed: boolean;
  backdropCloseOnClick: boolean;
}

type ResolvedGlobalConfig = Required<Omit<GlobalConfig, 'theme'>> & Pick<GlobalConfig, 'theme'>;

const DEFAULT_GLOBAL_CONFIG: ResolvedGlobalConfig = {
  position: 'top-right',
  backdrop: { enabled: false, closeOnClick: false, dismissBehavior: 'auto-and-manual' },
  singleAtATime: false,
  onOverflowBehavior: 'replace',
  maxVisible: 3,
  duplicateStrategy: 'ignore',
  animation: {},
  theme: 'auto',
  zIndex: 2147483000,
  rtl: false,
  newestOn: 'top',
  pauseOnHover: true,
};

function resolveUniqueKey(options: NotificationOptions): string | null {
  if (!options.unique) return null;
  if (typeof options.unique === 'string') return options.unique;
  const messageKey = typeof options.message === 'string' ? options.message : '';
  return `${options.type ?? ''}|${options.title ?? ''}|${messageKey}`;
}

function resolveBackdrop(
  perCall: boolean | BackdropConfig | undefined,
  global: BackdropConfig,
): { enabled: boolean; closeOnClick: boolean } {
  if (typeof perCall === 'boolean') {
    return { enabled: perCall, closeOnClick: global.closeOnClick ?? false };
  }
  if (perCall && typeof perCall === 'object') {
    return {
      enabled: perCall.enabled,
      closeOnClick: perCall.closeOnClick ?? global.closeOnClick ?? false,
    };
  }
  return { enabled: global.enabled, closeOnClick: global.closeOnClick ?? false };
}

/**
 * Singleton engine backing the `notify` API: owns global config, per-position stacks,
 * the shared backdrop, dedupe/singleAtATime bookkeeping, and the global event emitter.
 */
export class NotificationManager {
  private config: ResolvedGlobalConfig = structuredCloneConfig(DEFAULT_GLOBAL_CONFIG);
  private readonly emitter = new EventEmitter<NotifyEventMap>();
  private readonly stacks = new Map<Position, Stack>();
  private readonly records = new Map<string, InternalRecord>();
  private readonly uniqueIndex = new Map<string, string>();
  private readonly backdropRequesters = new Set<string>();
  private root: HTMLElement | null = null;
  private backdropEl: HTMLElement | null = null;
  private backdropClickBound = false;
  private keydownBound = false;
  private singleActiveId: string | null = null;

  configure(config: GlobalConfig): void {
    this.config = {
      ...this.config,
      ...config,
      backdrop: { ...this.config.backdrop, ...config.backdrop },
      animation: { ...this.config.animation, ...config.animation },
    };
    this.root = ensureRoot(this.config.zIndex);
    this.applyTheme();
    for (const stack of this.stacks.values()) {
      stack.configure({ maxVisible: this.config.maxVisible, newestOn: this.config.newestOn });
    }
  }

  on<K extends keyof NotifyEventMap>(event: K, handler: (payload: NotifyEventMap[K]) => void) {
    return this.emitter.on(event, handler);
  }

  off<K extends keyof NotifyEventMap>(event: K, handler: (payload: NotifyEventMap[K]) => void) {
    this.emitter.off(event, handler);
  }

  open(type: NotificationType, options: NotificationOptions = {}): string {
    const uniqueKey = resolveUniqueKey(options);
    if (uniqueKey) {
      const existingId = this.uniqueIndex.get(uniqueKey);
      const existing = existingId ? this.records.get(existingId) : undefined;
      if (existingId && existing && !existing.closed) {
        switch (this.config.duplicateStrategy) {
          case 'ignore':
            return existingId;
          case 'restart-timer':
            existing.timer?.restart();
            return existingId;
          case 'bump-to-top':
            this.stacks.get(existing.options.position)?.bumpToFront(existingId);
            return existingId;
        }
      }
    }

    if (this.config.singleAtATime && this.singleActiveId && this.records.has(this.singleActiveId)) {
      // 'replace': the old toast vanishes instantly. 'queue-and-close-previous': it plays its
      // own close animation while the new toast appears right away (spec §9).
      const immediate = this.config.onOverflowBehavior === 'replace';
      this.closeInternal(this.singleActiveId, 'replaced', immediate);
    }

    const id = options.id ?? generateId();
    const position = options.position ?? this.config.position;
    const duration: number | 'infinite' =
      options.duration === undefined || options.duration === 0 ? 'infinite' : options.duration;
    const backdrop = resolveBackdrop(options.backdrop, this.config.backdrop);

    const resolved: ResolvedNotificationOptions = {
      ...options,
      id,
      type,
      position,
      duration,
      timerStyle: options.timerStyle ?? 'none',
      showCloseButton: options.showCloseButton ?? true,
      pauseOnHover: options.pauseOnHover ?? this.config.pauseOnHover,
    };

    const elements = createNotificationElement(resolved, {
      onCloseClick: () => this.closeInternal(id, 'manual-close-icon'),
      onActionClick: (actionId) => {
        resolved.onAction?.(id, actionId);
        this.emitter.emit('action', { id, actionId });
      },
    });

    let timer: Timer | null = null;
    if (duration !== 'infinite') {
      timer = new Timer(duration, {
        onTick:
          resolved.timerStyle === 'none'
            ? undefined
            : (fraction, msRemaining) => updateTimerUI(elements, fraction, msRemaining),
        onComplete: () => this.closeInternal(id, 'timer'),
      });
      if (resolved.pauseOnHover) {
        elements.root.addEventListener('mouseenter', () => timer?.pause());
        elements.root.addEventListener('mouseleave', () => timer?.resume());
      }
    }

    const record: InternalRecord = {
      options: resolved,
      elements,
      timer,
      uniqueKey,
      closed: false,
      backdropCloseOnClick: backdrop.closeOnClick,
    };
    this.records.set(id, record);
    if (uniqueKey) this.uniqueIndex.set(uniqueKey, id);
    if (this.config.singleAtATime) this.singleActiveId = id;

    this.getStack(position).add({ id, elements });
    this.bindGlobalKeydown();

    if (backdrop.enabled) {
      this.showBackdrop(id);
    }

    timer?.start();
    resolved.onOpen?.(id);
    this.emitter.emit('open', { id, type });

    return id;
  }

  close(id: string, reason: CloseReason = 'programmatic'): void {
    this.closeInternal(id, reason);
  }

  clearAll(position?: Position): void {
    const ids = position
      ? this.stacks.get(position)?.allIds() ?? []
      : Array.from(this.records.keys());
    for (const id of ids) this.closeInternal(id, 'clear-all');
  }

  private applyTheme(): void {
    if (!this.root) return;
    const theme = this.config.theme;
    if (theme === 'light' || theme === 'dark') {
      this.root.dataset.theme = theme;
    } else {
      delete this.root.dataset.theme;
    }
    if (theme && typeof theme === 'object') {
      for (const [token, value] of Object.entries(theme)) {
        this.root.style.setProperty(token, value);
      }
    }
  }

  private getStack(position: Position): Stack {
    if (!this.root) {
      this.root = ensureRoot(this.config.zIndex);
      this.applyTheme();
    }
    let stack = this.stacks.get(position);
    if (!stack) {
      const container = ensureContainer(this.root, position, this.config.rtl);
      stack = new Stack(position, container);
      stack.configure({ maxVisible: this.config.maxVisible, newestOn: this.config.newestOn });
      stack.setHandlers({ onClearAll: () => this.clearAll(position) });
      this.stacks.set(position, stack);
    }
    return stack;
  }

  private showBackdrop(id: string): void {
    if (!this.root) return;
    this.backdropEl = ensureBackdrop(this.root);
    this.backdropRequesters.add(id);
    this.backdropEl.classList.add('is-visible');
    if (!this.backdropClickBound) {
      this.backdropClickBound = true;
      this.backdropEl.addEventListener('click', () => {
        for (const requesterId of Array.from(this.backdropRequesters)) {
          const record = this.records.get(requesterId);
          if (record?.backdropCloseOnClick) this.closeInternal(requesterId, 'backdrop-click');
        }
      });
    }
  }

  private bindGlobalKeydown(): void {
    if (this.keydownBound) return;
    this.keydownBound = true;
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const active = document.activeElement as HTMLElement | null;
      const focused = active?.closest<HTMLElement>('.notify-toast');
      const targetId = focused?.dataset.id ?? this.mostRecentId();
      if (targetId) this.closeInternal(targetId, 'manual-close-icon');
    });
  }

  private mostRecentId(): string | undefined {
    return Array.from(this.records.keys()).pop();
  }

  private closeInternal(id: string, reason: CloseReason, immediate = false): void {
    const record = this.records.get(id);
    if (!record || record.closed) return;
    record.closed = true;
    record.timer?.cancel();

    if (this.uniqueIndex.get(record.uniqueKey ?? '') === id) {
      this.uniqueIndex.delete(record.uniqueKey ?? '');
    }
    this.stacks.get(record.options.position)?.remove(id, immediate);

    if (this.backdropRequesters.delete(id) && this.backdropRequesters.size === 0 && this.root) {
      hideBackdrop(this.root);
    }
    if (this.singleActiveId === id) this.singleActiveId = null;
    this.records.delete(id);

    record.options.onClose?.(id, reason);
    this.emitter.emit('close', { id, reason, type: record.options.type });
  }
}

function structuredCloneConfig(config: ResolvedGlobalConfig): ResolvedGlobalConfig {
  return {
    ...config,
    backdrop: { ...config.backdrop },
    animation: { ...config.animation },
  };
}
