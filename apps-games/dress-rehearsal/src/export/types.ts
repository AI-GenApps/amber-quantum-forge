import type { FrameId, Look, Slot, Stars } from "@web-games/dress-rehearsal-core";

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** 4:5 export image, 1080 x 1350 px. */
export const EXPORT_SIZE: Size = { width: 1080, height: 1350 };

export interface ExportInput {
  readonly look: Look;
  /** Slots drawn on the board, in any order; the layout is the same as the screen board. */
  readonly slots: readonly Slot[];
  readonly frame: FrameId;
  /** Headline: "Gala Night - Cloakroom" or "Daily Fitting". */
  readonly title: string;
  /** Second line: the date or the chapter title. */
  readonly subtitle: string;
  readonly clientName: string | null;
  readonly stars: Stars;
  readonly harmony: number;
  readonly accent: string;
  readonly gameTitle: string;
  /** Backdrop slot id of the chapter, drawn when its decoded image is available. */
  readonly backdropSlot: string;
  /** Decoded designer art by slot id; pieces without an image use the code-drawn garment. */
  readonly images?: Readonly<Record<string, unknown>>;
}

export interface FrameLayout {
  readonly board: Rect;
  readonly footer: Rect;
}
