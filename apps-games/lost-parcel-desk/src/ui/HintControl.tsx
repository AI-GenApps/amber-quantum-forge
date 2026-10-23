import { Button } from "@web-games/kit";
import { HINT_PRICE, MAX_HINTS_PER_CASE } from "@web-games/lost-parcel-desk-core";
import { useState } from "preact/hooks";
import { HintConfirm } from "../sheets/HintConfirm";
import { useApp, useProfile } from "../state/app";
import type { ActiveCase } from "../state/game";
import { t } from "../strings";
import { Icon } from "./Icon";
import { useHotkeys } from "./useHotkeys";

const FAILURES = {
  INSUFFICIENT_POSTAGE: "hintFailShort",
  NOTHING_TO_HINT: "hintFailNothing",
  HINT_LIMIT: "hintFailLimit",
  CASE_CLOSED: "hintFailLimit",
  NO_ACTIVE_CASE: "hintFailLimit",
} as const;

/** The Hint button, its confirmation sheet (price and postage left) and the explanation it returns. */
export function HintControl({ active }: { active: ActiveCase }) {
  const { game } = useApp();
  const profile = useProfile();
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const price = HINT_PRICE[active.kind];
  const left = Math.max(0, MAX_HINTS_PER_CASE - active.state.hintsUsed);
  const ask = (): void => {
    if (!active.state.closed) setAsking(true);
  };
  useHotkeys({ h: ask });

  const buy = async (): Promise<void> => {
    const result = await game.buyHint();
    setAsking(false);
    setNote(result.ok ? result.hint.explanation : t(FAILURES[result.reason]));
  };

  return (
    <>
      <Button variant="secondary" disabled={active.state.closed} onClick={ask}>
        <Icon name="hint" size={18} /> {t("hintButton")}
      </Button>
      <HintConfirm
        open={asking}
        price={price}
        postage={profile.postage}
        hintsLeft={left}
        onConfirm={() => void buy()}
        onCancel={() => setAsking(false)}
      />
      {note !== null ? (
        <p class="lp-hintnote" role="status" data-testid="hint-note">
          {note}
        </p>
      ) : null}
    </>
  );
}
