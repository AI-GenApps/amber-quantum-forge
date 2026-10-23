import { Button, Screen } from "@web-games/kit";
import { bestStamps, caseUnlocked, getCase } from "@web-games/lost-parcel-desk-core";
import { useState } from "preact/hooks";
import { Sprite } from "../art/Sprite";
import { dailyIntro } from "../lib/daily";
import { type CaseTarget, isDailyTarget } from "../nav";
import { useApp, useArtManifest, useProfile } from "../state/app";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { PaperCard } from "../ui/PaperCard";
import { StampRow } from "../ui/StampRow";

export function Intro({ target }: { target: CaseTarget }) {
  const { router, game, clock } = useApp();
  const profile = useProfile();
  const manifest = useArtManifest();
  const [busy, setBusy] = useState(false);
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

  const open = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    const outcome = daily ? await game.startDaily() : await game.startCase(item?.id ?? "");
    setBusy(false);
    if (outcome.ok) router.replace("table", target);
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
      <Button size="large" fullWidth disabled={busy} onClick={() => void open()}>
        {resumable ? t("introResume") : t("introOpen")}
      </Button>
    </Screen>
  );
}
