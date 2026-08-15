type Listener<T> = (payload: T) => void;

/** Minimal typed event emitter — no dependency on Node's EventEmitter so it runs in any DOM environment. */
export class EventEmitter<EventMap extends object> {
  private listeners: { [K in keyof EventMap]?: Set<Listener<EventMap[K]>> } = {};

  on<K extends keyof EventMap>(event: K, handler: Listener<EventMap[K]>): Listener<EventMap[K]> {
    const set = this.listeners[event] ?? new Set();
    set.add(handler);
    this.listeners[event] = set;
    return handler;
  }

  off<K extends keyof EventMap>(event: K, handler: Listener<EventMap[K]>): void {
    this.listeners[event]?.delete(handler);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    this.listeners[event]?.forEach((handler) => handler(payload));
  }

  clear(): void {
    this.listeners = {};
  }
}
