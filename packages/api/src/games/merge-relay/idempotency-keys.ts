const serverKeyPrefixes = [
  "retire:",
  "cancel:",
  "save:",
  "result:",
  "return:",
  "abandoned:",
  "attempt:",
  "challenge:",
] as const;

export function isClientIdempotencyKey(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 128) return false;
  if (!/^[A-Za-z0-9._:-]+$/.test(value)) return false;
  const lowered = value.toLowerCase();
  return !serverKeyPrefixes.some((prefix) => lowered.startsWith(prefix));
}
