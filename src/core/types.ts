export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'custom';

export type Position =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type CloseReason =
  | 'timer'
  | 'manual-close-icon'
  | 'clear-all'
  | 'programmatic'
  | 'backdrop-click'
  | 'replaced';

export type TimerStyle = 'none' | 'progress-bar' | 'countdown-number';

export type DuplicateStrategy = 'ignore' | 'restart-timer' | 'bump-to-top';

export type OnOverflowBehavior = 'replace' | 'queue-and-close-previous';

export interface NotificationAction {
  id: string;
  label: string;
  onClick?: (id: string) => void;
  style?: 'default' | 'primary' | 'destructive';
}

export interface CustomThemeTokens {
  [cssVariable: string]: string;
}

export interface BackdropConfig {
  enabled: boolean;
  closeOnClick?: boolean;
  /** Backdrop always disappears whenever its notification closes, regardless of reason. */
  dismissBehavior?: 'auto-and-manual';
}

export interface AnimationConfig {
  enter?: string;
  exit?: string;
}

export interface GlobalConfig {
  position?: Position;
  backdrop?: BackdropConfig;
  singleAtATime?: boolean;
  onOverflowBehavior?: OnOverflowBehavior;
  maxVisible?: number;
  duplicateStrategy?: DuplicateStrategy;
  animation?: AnimationConfig;
  theme?: 'light' | 'dark' | 'auto' | CustomThemeTokens;
  zIndex?: number;
  rtl?: boolean;
  /** Newest notification rendered at the top (macOS default) or bottom of its stack. */
  newestOn?: 'top' | 'bottom';
  pauseOnHover?: boolean;
}

/** Raw HTML for the message body — caller is responsible for sanitizing untrusted content. */
export interface HtmlMessage {
  html: string;
}

export type MessageContent = string | HTMLElement | (() => HTMLElement) | HtmlMessage;

export interface NotificationOptions {
  id?: string;
  type?: NotificationType;
  title?: string;
  message?: MessageContent;
  icon?: string | HTMLElement | false;
  showCloseButton?: boolean;
  actions?: NotificationAction[];
  className?: string;
  /** Overrides the toast's background for this one notification (any valid CSS color). */
  backgroundColor?: string;
  /** Overrides title/message/icon color for this one notification (any valid CSS color). */
  textColor?: string;
  position?: Position;
  duration?: number | 'infinite';
  timerStyle?: TimerStyle;
  backdrop?: boolean | BackdropConfig;
  unique?: boolean | string;
  data?: Record<string, unknown>;
  pauseOnHover?: boolean;
  render?: (ctx: RenderContext) => HTMLElement;
  onOpen?: (id: string) => void;
  onClose?: (id: string, reason: CloseReason) => void;
  onAction?: (id: string, actionId: string) => void;
}

export interface RenderContext {
  id: string;
  options: ResolvedNotificationOptions;
  close: (reason?: CloseReason) => void;
}

/** NotificationOptions with all global defaults merged in. */
export interface ResolvedNotificationOptions extends NotificationOptions {
  id: string;
  type: NotificationType;
  position: Position;
  duration: number | 'infinite';
  timerStyle: TimerStyle;
  showCloseButton: boolean;
  pauseOnHover: boolean;
}

export interface OpenEventPayload {
  id: string;
  type: NotificationType;
}

export interface CloseEventPayload {
  id: string;
  reason: CloseReason;
  type: NotificationType;
}

export interface ActionEventPayload {
  id: string;
  actionId: string;
}

export interface NotifyEventMap {
  open: OpenEventPayload;
  close: CloseEventPayload;
  action: ActionEventPayload;
}
