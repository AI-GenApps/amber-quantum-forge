/** Small stable hash so tilt and layout offsets depend on ids and never on randomness. */
export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** A tilt in degrees between -max and +max, the same for the same id. */
export function tiltFor(id: string, max = 2): number {
  const unit = (hashString(id) % 2001) / 1000 - 1;
  return Math.round(unit * max * 100) / 100;
}
