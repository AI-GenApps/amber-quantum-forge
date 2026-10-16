import type { SaveStore } from "@city-drive/core";

const KEY = "city-drive.last-district.v1";

/**
 * Remembers which district the player last drove in, so Play continues there. It lives beside the
 * save (not inside it), and any trouble reading or writing just means "start in the first
 * district": a missing hint never blocks the game.
 */
export class LastDistrict {
  constructor(
    private readonly store: SaveStore,
    private readonly fallback: string,
  ) {}

  /** The remembered district if `isValid` accepts it, otherwise the fallback. */
  async get(isValid: (id: string) => boolean): Promise<string> {
    try {
      const value = await this.store.get(KEY);
      return value !== null && isValid(value) ? value : this.fallback;
    } catch {
      return this.fallback;
    }
  }

  async set(id: string): Promise<void> {
    try {
      await this.store.set(KEY, id);
    } catch {
      // Losing this hint only costs the player one tap on the map.
    }
  }

  async clear(): Promise<void> {
    try {
      await this.store.remove(KEY);
    } catch {
      // See set().
    }
  }
}
