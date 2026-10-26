import type { SlotId } from "../src/art/slots";

export type SlotStatus = "accepted" | "rejected" | "missing";

export interface UnacceptedSlot {
  readonly status: Exclude<SlotStatus, "accepted">;
  /** Designer batch and round of the last review that covered the slot. */
  readonly batch: string;
  readonly round: number;
  readonly reason: string;
}

/**
 * Slots the orchestrator's final review did not accept. They get no runtime file and no master;
 * the game keeps the code-drawn placeholder. Any other slot missing from `accepted/` is "missing".
 */
export const UNACCEPTED: Readonly<Partial<Record<SlotId, UnacceptedSlot>>> = {
  "key-art": {
    status: "missing",
    batch: "retry",
    round: 3,
    reason:
      "Rejected as missing: no key-art.png was delivered because the cover attempts failed (the assembled retry cover was also rejected for style drift)",
  },
  "item-rainy-city-5": {
    status: "missing",
    batch: "b2",
    round: 4,
    reason:
      "Rejected as missing: no file was delivered because all four candidates failed the designer's own self-review",
  },
  "item-studio-3": {
    status: "rejected",
    batch: "retry",
    round: 3,
    reason:
      "Rejected for a flat vector-sticker style, a ruler-straight cone skirt, an unreadable wrap band, airbrushed grey ribbons and a thin outline at small sizes",
  },
};

export function unacceptedFor(slot: SlotId): UnacceptedSlot {
  return (
    UNACCEPTED[slot] ?? {
      status: "missing",
      batch: "-",
      round: 0,
      reason: "Not delivered",
    }
  );
}
