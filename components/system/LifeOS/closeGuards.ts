const guards = new Map<string, () => boolean>();
export const canCloseLifeOSApp = (id: string): boolean =>
  guards.get(id)?.() ?? true;
export const registerCloseGuard = (
  id: string,
  guard: () => boolean
): (() => void) => {
  guards.set(id, guard);
  return () => {
    if (guards.get(id) === guard) guards.delete(id);
  };
};
