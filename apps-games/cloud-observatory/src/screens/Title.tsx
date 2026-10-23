import { Screen } from "@web-games/kit";
import { useState } from "preact/hooks";
import { useApp } from "../app/context";
import { GAME_TITLE } from "../brand";
import { Btn } from "../components/Btn";
import { ManagedSheet } from "../components/ManagedSheet";
import { SaveNotice } from "../components/SaveNotice";
import { t } from "../strings";
import { ArtImage } from "../ui/ArtImage";
import { hasProgress } from "./derive";

export function TitleScreen() {
  const { session, router, snapshot, feedback } = useApp();
  const [confirm, setConfirm] = useState(false);
  const returning = hasProgress(snapshot.profile);

  const enter = () => {
    feedback.sfx("click");
    router.replace("shell");
  };
  const restart = async () => {
    setConfirm(false);
    await session.reset();
    router.replace("shell");
  };

  return (
    <Screen name="title" class="co-screen co-title">
      <div class="co-title__art">
        <ArtImage slot="key-art" />
        <div class="co-title__shade" aria-hidden="true" />
      </div>
      <div class="co-title__body">
        <h1 class="co-title__name">{GAME_TITLE}</h1>
        <p class="co-title__tag">{t("title.tagline")}</p>
        <SaveNotice />
        <div class="co-stack">
          <Btn size="large" fullWidth onClick={enter}>
            {returning ? t("title.continue") : t("title.begin")}
          </Btn>
          {returning ? (
            <Btn variant="secondary" fullWidth onClick={() => setConfirm(true)}>
              {t("title.newJourney")}
            </Btn>
          ) : null}
          <Btn variant="secondary" fullWidth onClick={() => router.push("howto")}>
            {t("title.howToPlay")}
          </Btn>
          <Btn variant="secondary" fullWidth onClick={() => router.push("settings")}>
            {t("title.settings")}
          </Btn>
        </div>
      </div>
      <ManagedSheet
        open={confirm}
        variant="modal"
        title={t("title.newJourneyTitle")}
        onClose={() => setConfirm(false)}
      >
        <p>{t("title.newJourneyBody")}</p>
        <div class="co-stack">
          <Btn variant="danger" fullWidth onClick={restart}>
            {t("title.newJourneyConfirm")}
          </Btn>
          <Btn variant="secondary" fullWidth onClick={() => setConfirm(false)}>
            {t("common.cancel")}
          </Btn>
        </div>
      </ManagedSheet>
    </Screen>
  );
}
