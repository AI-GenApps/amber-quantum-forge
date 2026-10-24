import { Button, Sheet } from "@web-games/kit";
import { useCallback, useEffect, useState } from "preact/hooks";
import { useApp, useBack, useProfile } from "../state/app";
import { useGameStore } from "../state/useGame";
import { t } from "../strings";
import { CARDS } from "./cardText";
import { CARD_FLAGS, type CardId, hasFlag } from "./flags";

export interface FirstTime {
  /** True while the card is on screen. */
  open: boolean;
  /** Shows the card if it has never been seen. Returns whether it opened. */
  show(): boolean;
  dismiss(): void;
}

/** Each card shows once: the flag is saved as soon as the card opens. */
export function useFirstTime(id: CardId): FirstTime {
  const store = useGameStore();
  const profile = useProfile();
  const [open, setOpen] = useState(false);
  const flag = CARD_FLAGS[id];
  const seen = hasFlag(profile, flag);
  const show = useCallback((): boolean => {
    if (seen || hasFlag(store.getState().profile, flag)) return false;
    setOpen(true);
    void store.markFlag(flag);
    return true;
  }, [seen, store, flag]);
  const dismiss = useCallback(() => setOpen(false), []);
  return { open, show, dismiss };
}

/** Opens the card on mount when `when` is true. */
export function useFirstTimeOnMount(id: CardId, when = true): FirstTime {
  const card = useFirstTime(id);
  const { show } = card;
  useEffect(() => {
    if (when) show();
  }, [when, show]);
  return card;
}

export function FirstTimeCard({ id, card }: { id: CardId; card: FirstTime }) {
  const { router } = useApp();
  useBack(router, card.open, () => {
    card.dismiss();
    return true;
  });
  const def = CARDS[id];
  return (
    <Sheet open={card.open} onClose={card.dismiss} title={def.title} class="tlw-card-sheet">
      {def.lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
      <Button size="large" fullWidth onClick={card.dismiss}>
        {t("cardGotIt")}
      </Button>
    </Sheet>
  );
}
