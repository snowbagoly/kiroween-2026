// Tiny event bus. No framework [design 3].
export function createBus() {
  const handlers = new Map();
  return {
    on(name, fn) {
      if (!handlers.has(name)) handlers.set(name, new Set());
      handlers.get(name).add(fn);
      return () => handlers.get(name).delete(fn);
    },
    emit(name, payload) {
      for (const fn of [...(handlers.get(name) ?? [])]) fn(payload);
    },
  };
}
