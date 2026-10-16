/**
 * Where raw save strings live. The app provides the real one (device preferences or browser
 * storage); core only needs these three calls. Every call may reject, and callers must cope.
 */
export interface SaveStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/** Keeps everything in a Map. Used by tests and as the fallback when no storage is available. */
export class MemorySaveStore implements SaveStore {
  readonly entries = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.entries.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.entries.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.entries.delete(key);
  }
}
