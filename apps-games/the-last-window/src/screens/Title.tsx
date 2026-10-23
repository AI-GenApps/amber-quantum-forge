import { Button, ProgressBar, Screen } from "@web-games/kit";
import { GAME_TITLE, TAGLINE } from "@web-games/the-last-window-core";
import { useEffect, useState } from "preact/hooks";
import { Backdrop } from "../art/Backdrop";
import { useApp } from "../state/app";
import { useGame } from "../state/useGame";
import { t } from "../strings";

export function Title() {
  const { router, preload } = useApp();
  const game = useGame();
  const [fraction, setFraction] = useState(preload ? 0 : 1);

  useEffect(() => {
    if (!preload) return undefined;
    let live = true;
    void preload((value) => {
      if (live) setFraction(value);
    }).then(() => {
      if (live) setFraction(1);
    });
    return () => {
      live = false;
    };
  }, [preload]);

  const ready = game.ready && fraction >= 1;
  const percent = Math.round(Math.min(1, fraction) * 100);
  return (
    <Screen name="title" class="tlw-title">
      <Backdrop slot="key-art" />
      <div class="tlw-title__veil" />
      <div class="tlw-title__body">
        <h1 class="tlw-title__name">{GAME_TITLE}</h1>
        <p class="tlw-title__tag">{TAGLINE}</p>
        {ready ? (
          <Button size="large" fullWidth onClick={() => router.reset("home")}>
            {t("titleBegin")}
          </Button>
        ) : (
          <div class="tlw-title__load">
            <ProgressBar value={percent} label={t("titleLoading", { percent })} />
            <p role="status">{t("titleLoading", { percent })}</p>
          </div>
        )}
        <p class="tlw-title__hint">{t("titleHint")}</p>
      </div>
    </Screen>
  );
}
