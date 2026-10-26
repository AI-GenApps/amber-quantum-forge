import { Button, Screen } from "@web-games/kit";
import {
  bestStamps,
  caseUnlocked,
  getCase,
  type MechanicCard,
} from "@web-games/lost-parcel-desk-core";
import { useState } from "preact/hooks";
import { Sprite } from "../art/Sprite";
import { dailyIntro } from "../lib/daily";
import { type CaseTarget, isDailyTarget } from "../nav";
import { cardFlag, pendingCards } from "../onboarding/cards";
import { useCoachStep } from "../onboarding/TutorialProvider";
import { CardSheet } from "../sheets/CardSheet";
import { useApp, useArtManifest, useFeedback, useProfile } from "../state/app";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { PaperCard } from "../ui/PaperCard";
import { StampRow } from "../ui/StampRow";

export function Intro({ target }: { target: CaseTarget }) {
  const { router, game, clock } = useApp();
  const profile = useProfile();
  const manifest = useArtManifest();
  const feedback = useFeedback();
  const coach = useCoachStep();
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState<MechanicCard[]>([]);
  const daily = isDailyTarget(target);
  const item = daily ? undefined : getCase(target.caseId);
  const meta = daily
    ? dailyIntro(clock(), profile.session?.kind === "daily" ? profile.session.id : undefined)
    : null;

  if (!daily && (item === undefined || !caseUnlocked(profile, item.id))) {
    return (
      <Screen name="intro" class="lp-intro">
        <Header title={t("introLockedTitle")} />
        <p class="lp-locknote">{t("introLocked")}</p>
      </Screen>
    );
  }

  const title = item ? item.title : (meta?.title ?? "");
  const label = item ? item.labelText : (meta?.label ?? "");
  const foundAt = item ? item.foundAt : (meta?.foundAt ?? "");
  const resumable = daily
    ? profile.session?.kind === "daily"
    : profile.session?.kind === "campaign" && profile.session.id === item?.id;
  const best = item ? bestStamps(profile, item.id) : 0;

  const begin = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    const outcome = daily ? await game.startDaily() : await game.startCase(item?.id ?? "");
    setBusy(false);
    if (outcome.ok) {
      feedback.fire({ type: "parcel-open" });
      router.replace("table", target);
    }
  };

  const open = (): void => {
    const cards = item ? pendingCards(profile.flags, item.id) : [];
    if (cards.length > 0) setQueue(cards);
    else void begin();
  };

  const closeCard = (): void => {
    const [shown, ...rest] = queue;
    if (shown) void game.markFlag(cardFlag(shown.id));
    setQueue(rest);
    if (rest.length === 0) void begin();
  };

  return (
    <Screen name="intro" class="lp-intro">
      <Header title={item ? t("caseNumber", { id: item.id }) : t("dailyTitle")} />
      <h2 class="lp-intro__title">{title}</h2>
      <div class="lp-intro__parcel">
        <Sprite slot="parcel-closed" size={180} {...(manifest ? { manifest } : {})} />
        <PaperCard
          id={`label-${title}`}
          tone="cream2"
          class="lp-tornlabel"
          label={t("introLabelName")}
        >
          <p class="lp-tornlabel__text" data-testid="label-text">
            {label}
          </p>
        </PaperCard>
      </div>
      <p class="lp-foundat" data-testid="found-at">
        {t("introFoundAt", { place: foundAt })}
      </p>
      {best > 0 ? (
        <p class="lp-bestline">
          {t("introBest")} <StampRow earned={best} size={18} />
        </p>
      ) : null}
      <Button
        size="large"
        fullWidth
        disabled={busy}
        class={`lp-own-sfx${coach === 1 ? " lp-coach-target" : ""}`}
        onClick={open}
      >
        {resumable ? t("introResume") : t("introOpen")}
      </Button>
      <CardSheet open={queue.length > 0} cardId={queue[0]?.id ?? ""} onClose={closeCard} />
    </Screen>
  );
}
