export function startSyncScheduler(syncFn: () => Promise<void>): () => void {
  const INTERVAL_MS = 5 * 60 * 1000;
  const id = setInterval(() => {
    syncFn().catch(() => undefined);
  }, INTERVAL_MS);
  return () => clearInterval(id);
}
