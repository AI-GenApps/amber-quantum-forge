import { t } from "../strings";
import { Icon } from "./Icon";
import { arrowNav } from "./useHotkeys";

export type ChipState = "found" | "pinned" | "linked";

export interface ClueChipProps {
  clueId: string;
  tag: string;
  state: ChipState;
  /** On the board a chip is selected for linking; in the tray it toggles the pin. */
  selected?: boolean;
  onClick: () => void;
  /** Opens the Almanac entry that explains the tag. */
  onAlmanac?: (() => void) | undefined;
}

const STATE_WORD: Record<ChipState, "chipFound" | "chipPinned" | "chipLinked"> = {
  found: "chipFound",
  pinned: "chipPinned",
  linked: "chipLinked",
};

export function ClueChip({ clueId, tag, state, selected, onClick, onAlmanac }: ClueChipProps) {
  const pressed = selected ?? state !== "found";
  return (
    <div class="lp-chipwrap">
      <button
        type="button"
        class={`lp-chip lp-chip--${state}${selected ? " lp-chip--selected" : ""}`}
        aria-pressed={pressed}
        data-nav="true"
        data-clue={clueId}
        data-state={state}
        onClick={onClick}
        onKeyDown={arrowNav}
      >
        <Icon
          name={state === "found" ? "question" : state === "pinned" ? "pin" : "link"}
          size={18}
        />
        <span class="lp-chip__tag">{tag}</span>
        <span class="lp-chip__state">{t(STATE_WORD[state])}</span>
      </button>
      {onAlmanac ? (
        <button
          type="button"
          class="lp-chip__more"
          aria-label={t("almanacFor", { tag })}
          data-almanac={clueId}
          onClick={onAlmanac}
        >
          <Icon name="book" size={18} />
        </button>
      ) : null}
    </div>
  );
}
