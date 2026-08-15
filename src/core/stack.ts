import type { NotificationElements } from './render';
import type { Position } from './types';

export interface StackRecord {
  id: string;
  elements: NotificationElements;
}

/**
 * Owns the DOM for one position's vertical stack: ordering, maxVisible collapse/expand
 * ("Show N more" / "Show less"), and "Clear All" — mirrors macOS grouped notifications (spec §9).
 */
export class Stack {
  readonly position: Position;
  readonly container: HTMLElement;
  private records: StackRecord[] = [];
  private expanded = false;
  private maxVisible = 3;
  private newestOn: 'top' | 'bottom' = 'top';
  private chrome: HTMLElement;
  private showMoreBtn: HTMLButtonElement;
  private clearAllBtn: HTMLButtonElement;
  private onClearAll: (() => void) | null = null;
  private onShowMoreToggle: (() => void) | null = null;

  constructor(position: Position, container: HTMLElement) {
    this.position = position;
    this.container = container;

    this.chrome = document.createElement('div');
    this.chrome.id = `notify-stack-chrome-${position}`;
    this.chrome.className = 'notify-stack__chrome';

    this.showMoreBtn = document.createElement('button');
    this.showMoreBtn.type = 'button';
    this.showMoreBtn.id = `notify-show-more-${position}`;
    this.showMoreBtn.className = 'notify-stack__show-more';
    this.showMoreBtn.addEventListener('click', () => {
      this.expanded = !this.expanded;
      this.onShowMoreToggle?.();
      this.render();
    });

    this.clearAllBtn = document.createElement('button');
    this.clearAllBtn.type = 'button';
    this.clearAllBtn.id = `notify-clear-all-${position}`;
    this.clearAllBtn.className = 'notify-stack__clear-all';
    this.clearAllBtn.textContent = 'Clear All';
    this.clearAllBtn.addEventListener('click', () => this.onClearAll?.());

    this.chrome.appendChild(this.showMoreBtn);
    this.chrome.appendChild(this.clearAllBtn);
  }

  configure(opts: { maxVisible: number; newestOn: 'top' | 'bottom' }): void {
    this.maxVisible = opts.maxVisible;
    this.newestOn = opts.newestOn;
  }

  setHandlers(handlers: { onClearAll: () => void; onShowMoreToggle?: () => void }): void {
    this.onClearAll = handlers.onClearAll;
    this.onShowMoreToggle = handlers.onShowMoreToggle ?? null;
  }

  add(record: StackRecord): void {
    if (this.newestOn === 'top') {
      this.records.unshift(record);
      this.container.prepend(record.elements.root);
    } else {
      this.records.push(record);
      this.container.appendChild(record.elements.root);
    }
    this.render();
  }

  /** Moves an existing record to the "newest" edge of the stack (duplicateStrategy: 'bump-to-top'). */
  bumpToFront(id: string): void {
    const index = this.records.findIndex((r) => r.id === id);
    if (index === -1) return;
    const [record] = this.records.splice(index, 1);
    if (this.newestOn === 'top') {
      this.records.unshift(record);
      this.container.prepend(record.elements.root);
    } else {
      this.records.push(record);
      this.container.appendChild(record.elements.root);
    }
    this.render();
  }

  remove(id: string, immediate = false): void {
    const index = this.records.findIndex((r) => r.id === id);
    if (index === -1) return;
    const [record] = this.records.splice(index, 1);
    const el = record.elements.root;
    if (immediate) {
      el.remove();
    } else {
      el.classList.add('is-leaving');
      el.classList.remove('notify-toast--collapsed');
      el.addEventListener('animationend', () => el.remove(), { once: true });
      setTimeout(() => el.remove(), 200); // fallback if the animation is skipped/disabled
    }
    this.render();
  }

  /** Returns ids for every visible/queued notification, newest first, for clearAll(). */
  allIds(): string[] {
    return this.records.map((r) => r.id);
  }

  isEmpty(): boolean {
    return this.records.length === 0;
  }

  private render(): void {
    const total = this.records.length;
    this.records.forEach((record, index) => {
      const collapsed = !this.expanded && index >= this.maxVisible;
      record.elements.root.classList.toggle('notify-toast--collapsed', collapsed);
      record.elements.root.setAttribute('aria-hidden', collapsed ? 'true' : 'false');
      record.elements.root.style.setProperty('--notify-stack-index', String(index));
    });

    const overflowCount = total - this.maxVisible;
    if (overflowCount > 0) {
      this.showMoreBtn.hidden = false;
      this.showMoreBtn.textContent = this.expanded ? 'Show less' : `Show ${overflowCount} more`;
    } else {
      this.showMoreBtn.hidden = true;
    }
    this.clearAllBtn.hidden = total <= 1;

    const wantsChrome = overflowCount > 0 || total > 1;
    if (wantsChrome && this.chrome.parentElement !== this.container) {
      this.container.appendChild(this.chrome);
    }
    if (!wantsChrome && this.chrome.parentElement === this.container) {
      this.chrome.remove();
    }
    // Chrome sits at the "outer" edge of the stack, away from the newest item.
    if (this.newestOn === 'top' && this.chrome.parentElement === this.container) {
      this.container.appendChild(this.chrome);
    } else if (this.newestOn === 'bottom' && this.chrome.parentElement === this.container) {
      this.container.prepend(this.chrome);
    }
  }
}
