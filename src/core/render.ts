import { defaultIconMarkup } from './icons';
import type { MessageContent, NotificationAction, ResolvedNotificationOptions } from './types';

/**
 * Attribute a `{ html }` (or custom `HTMLElement`/function) message can include on any element to
 * mark exactly where the countdown-number timer should render — anything after that marker in the
 * markup ends up after the countdown. Falls back to appending the countdown at the end when absent.
 */
export const COUNTDOWN_SLOT_ATTR = 'data-notify-countdown';

export interface NotificationHandlers {
  onCloseClick: () => void;
  onActionClick: (actionId: string) => void;
}

export interface NotificationElements {
  root: HTMLElement;
  progressBarFill?: HTMLElement;
  countdownNumber?: HTMLElement;
}

function appendMessage(container: HTMLElement, message: MessageContent): void {
  if (typeof message === 'string') {
    container.textContent = message;
  } else if (typeof message === 'function') {
    container.appendChild(message());
  } else if (message instanceof HTMLElement) {
    container.appendChild(message);
  } else {
    // { html: string } — caller-supplied markup, inserted as-is; sanitize untrusted input yourself.
    container.innerHTML = message.html;
  }
}

function appendIcon(container: HTMLElement, icon: string | HTMLElement): void {
  if (icon instanceof HTMLElement) {
    container.appendChild(icon);
    return;
  }
  const trimmed = icon.trim();
  if (trimmed.startsWith('<svg')) {
    container.innerHTML = trimmed;
  } else if (/^(https?:|data:|\.\/|\/|\.\.\/)/.test(trimmed) || /\.(png|jpe?g|gif|svg|webp)$/i.test(trimmed)) {
    const img = document.createElement('img');
    img.src = trimmed;
    img.alt = '';
    container.appendChild(img);
  } else {
    const i = document.createElement('i');
    i.className = trimmed;
    container.appendChild(i);
  }
}

function buildActions(
  notificationId: string,
  actions: NotificationAction[],
  onActionClick: (actionId: string) => void,
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'notify-actions';
  wrap.id = `notify-actions-${notificationId}`;
  for (const action of actions) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = `notify-action-${notificationId}-${action.id}`;
    btn.className = `notify-action notify-action--${action.style ?? 'default'}`;
    btn.textContent = action.label;
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      action.onClick?.(action.id);
      onActionClick(action.id);
    });
    wrap.appendChild(btn);
  }
  return wrap;
}

/** Builds the DOM for one toast. Every visual piece (icon/title/message/close/actions/timer) is independently optional. */
export function createNotificationElement(
  options: ResolvedNotificationOptions,
  handlers: NotificationHandlers,
): NotificationElements {
  if (options.render) {
    const root = options.render({
      id: options.id,
      options,
      close: () => handlers.onCloseClick(),
    });
    return { root };
  }

  const root = document.createElement('div');
  root.id = `notify-toast-${options.id}`;
  root.className = `notify-toast notify-toast--${options.type}${
    options.className ? ` ${options.className}` : ''
  }`;
  root.dataset.id = options.id;
  root.setAttribute('tabindex', '-1');
  root.setAttribute(
    'role',
    options.type === 'error' || options.type === 'warning' ? 'alert' : 'status',
  );
  root.setAttribute('aria-live', options.type === 'error' || options.type === 'warning' ? 'assertive' : 'polite');
  root.setAttribute('aria-atomic', 'true');

  if (options.backgroundColor) {
    root.style.setProperty('--notify-bg', options.backgroundColor);
  }
  if (options.textColor) {
    root.style.color = options.textColor;
    root.style.setProperty('--notify-muted', options.textColor);
  }

  const resolvedIcon = options.icon === undefined ? defaultIconMarkup(options.type) : options.icon;
  if (resolvedIcon !== false && resolvedIcon !== undefined) {
    const iconEl = document.createElement('div');
    iconEl.id = `notify-icon-${options.id}`;
    iconEl.className = 'notify-icon';
    appendIcon(iconEl, resolvedIcon);
    root.appendChild(iconEl);
  }

  const body = document.createElement('div');
  body.id = `notify-body-${options.id}`;
  body.className = 'notify-body';
  root.appendChild(body);

  if (options.title) {
    const titleEl = document.createElement('div');
    titleEl.id = `notify-title-${options.id}`;
    titleEl.className = 'notify-title';
    titleEl.textContent = options.title;
    body.appendChild(titleEl);
  }

  const hasCountdown =
    options.duration !== 'infinite' && options.duration > 0 && options.timerStyle === 'countdown-number';
  let countdownNumber: HTMLElement | undefined;
  if (hasCountdown) {
    countdownNumber = document.createElement('span');
    countdownNumber.id = `notify-countdown-${options.id}`;
    countdownNumber.className = 'notify-countdown';
    countdownNumber.setAttribute('aria-hidden', 'true');
  }

  if (options.message !== undefined) {
    const messageEl = document.createElement('div');
    messageEl.id = `notify-message-${options.id}`;
    messageEl.className = 'notify-message';
    appendMessage(messageEl, options.message);
    if (countdownNumber) {
      // A `{ html }`/element message can mark exactly where the countdown goes via
      // [data-notify-countdown] — anything after that marker in the markup stays after it.
      // Otherwise it's appended right after the message content, in normal flow.
      const slot = messageEl.querySelector(`[${COUNTDOWN_SLOT_ATTR}]`);
      if (slot) {
        slot.replaceWith(countdownNumber);
      } else {
        messageEl.appendChild(countdownNumber);
      }
    }
    body.appendChild(messageEl);
  } else if (countdownNumber) {
    body.appendChild(countdownNumber);
  }

  if (options.actions && options.actions.length > 0) {
    body.appendChild(buildActions(options.id, options.actions, handlers.onActionClick));
  }

  let progressBarFill: HTMLElement | undefined;
  if (options.duration !== 'infinite' && options.duration > 0 && options.timerStyle === 'progress-bar') {
    const track = document.createElement('div');
    track.id = `notify-progress-${options.id}`;
    track.className = 'notify-progress';
    progressBarFill = document.createElement('div');
    progressBarFill.id = `notify-progress-fill-${options.id}`;
    progressBarFill.className = 'notify-progress__fill';
    track.appendChild(progressBarFill);
    root.appendChild(track);
  }

  if (options.showCloseButton) {
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.id = `notify-close-${options.id}`;
    closeBtn.className = 'notify-close';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.innerHTML =
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    closeBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      handlers.onCloseClick();
    });
    root.appendChild(closeBtn);
  }

  return { root, progressBarFill, countdownNumber };
}

export function updateTimerUI(
  elements: NotificationElements,
  fractionRemaining: number,
  msRemaining: number,
): void {
  if (elements.progressBarFill) {
    elements.progressBarFill.style.width = `${Math.max(0, Math.min(1, fractionRemaining)) * 100}%`;
  }
  if (elements.countdownNumber) {
    elements.countdownNumber.textContent = `${Math.ceil(msRemaining / 1000)}s`;
  }
}
