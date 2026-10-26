export const DEV_SPEED_MIN = 1;
export const DEV_SPEED_MAX = 600;

/**
 * Reads `?devspeed=N` (1 to 600) for the owner's QA. Production builds ignore it: pass
 * `isDev = import.meta.env.DEV`. Anything missing, invalid or out of range means normal speed.
 */
export function parseDevSpeed(search: string, isDev: boolean): number {
  if (!isDev) return 1;
  const raw = new URLSearchParams(search).get("devspeed");
  if (raw === null || raw.trim() === "") return 1;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < DEV_SPEED_MIN || value > DEV_SPEED_MAX) return 1;
  return value;
}
