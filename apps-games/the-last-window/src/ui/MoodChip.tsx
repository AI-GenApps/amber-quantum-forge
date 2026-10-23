import type { MoodId } from "@web-games/the-last-window-core";
import { moodName } from "../labels";
import { Glyph } from "./Glyph";

/** Mood tag: icon plus word, never colour alone. */
export function MoodChip({ mood }: { mood: MoodId }) {
  return (
    <span class="tlw-chip" data-mood={mood}>
      <Glyph name={mood} size={16} />
      <span>{moodName(mood)}</span>
    </span>
  );
}
