import { ProgressBar, Screen } from "@web-games/kit";
import { TITLE } from "@web-games/lost-parcel-desk-core";
import { useEffect, useState } from "preact/hooks";
import { Sprite } from "../art/Sprite";
import { useApp, useArtManifest } from "../state/app";
import { useGame } from "../state/useGame";
import { t } from "../strings";

export function Boot() {
  const app = useApp();
  const game = useGame();
  const manifest = useArtManifest();
  const [fraction, setFraction] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const run = async (): Promise<void> => {
      try {
        await app.preload?.((value) => {
          if (alive) setFraction(value);
        });
      } catch {
        // a missing font or image never blocks the game; the code-drawn fallbacks cover it
      } finally {
        if (alive) {
          setFraction(1);
          setLoaded(true);
        }
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, [app]);

  useEffect(() => {
    if (loaded && game.ready) app.router.reset("home");
  }, [app, loaded, game.ready]);

  return (
    <Screen name="boot" class="lp-boot">
      <Sprite slot="icon" size={96} label={TITLE} {...(manifest ? { manifest } : {})} />
      <h1 class="lp-title">{TITLE}</h1>
      <p role="status">{t("bootLoading")}</p>
      <ProgressBar value={Math.round(fraction * 100)} label={t("bootProgress")} />
    </Screen>
  );
}
