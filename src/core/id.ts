let counter = 0;

/** Generates a unique, sortable-ish id without depending on crypto.randomUUID for older environments. */
export function generateId(): string {
  counter += 1;
  const random = Math.random().toString(36).slice(2, 9);
  return `nt-${Date.now().toString(36)}-${counter}-${random}`;
}
