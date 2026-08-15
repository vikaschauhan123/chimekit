import type { Position } from './types';

const ROOT_ID = 'notify-root';

/** Core owns its own portal — no framework-specific mounting required (spec §14). */
export function ensureRoot(zIndex?: number): HTMLElement {
  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    document.body.appendChild(root);
  }
  if (zIndex !== undefined) {
    root.style.setProperty('--notify-z-index', String(zIndex));
  }
  return root;
}

export function ensureContainer(root: HTMLElement, position: Position, rtl?: boolean): HTMLElement {
  const id = `notify-stack-${position}`;
  let container = document.getElementById(id);
  if (!container) {
    container = document.createElement('div');
    container.id = id;
    container.className = 'notify-stack';
    container.dataset.position = position;
    container.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    root.appendChild(container);
  }
  return container;
}

export function ensureBackdrop(root: HTMLElement): HTMLElement {
  const id = 'notify-backdrop';
  let backdrop = document.getElementById(id);
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = id;
    backdrop.className = 'notify-backdrop';
    root.appendChild(backdrop);
  }
  return backdrop;
}

export function hideBackdrop(root: HTMLElement): void {
  root.querySelector<HTMLElement>('.notify-backdrop')?.classList.remove('is-visible');
}
