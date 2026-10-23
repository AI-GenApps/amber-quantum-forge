export const ANNOUNCE_INTERVAL_MS = 5000;

export interface Announcer {
  /** Returns the text a polite live region should currently hold. */
  update(text: string): string;
}

/** Lets a live region change at most once per interval so a screen reader is not flooded. */
export function createAnnouncer(
  now: () => number,
  intervalMs: number = ANNOUNCE_INTERVAL_MS,
): Announcer {
  let announced = "";
  let at = Number.NEGATIVE_INFINITY;
  return {
    update(text) {
      const time = now();
      if (text !== announced && (announced === "" || time - at >= intervalMs)) {
        announced = text;
        at = time;
      }
      return announced;
    },
  };
}
