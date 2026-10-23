import { GAME_TITLE } from "@web-games/dress-rehearsal-core";
import { ProgressBar, Screen } from "@web-games/kit";
import { useEffect, useState } from "preact/hooks";
import { Sprite } from "../art/Sprite";
import { useApp, useGameState } from "../state/app";
import { t } from "../strings";

export function Boot() {
  const app = useApp();
  const game = useGameState();
  const [fraction, setFraction] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const run = async (): Promise<void> => {
      try {
        await app.preload?.((value) => {
          if (alive) setFraction(value);
        });
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
    if (loaded && game.status === "ready") app.router.reset("home");
  }, [app, loaded, game.status]);

  return (
    <Screen name="boot" class="dr-boot">
      <div class="dr-hero dr-hero--boot">
        <Sprite
          slot="icon"
          size={96}
          label={GAME_TITLE}
          {...(app.artManifest ? { manifest: app.artManifest } : {})}
        />
      </div>
      <h1 class="dr-title">{GAME_TITLE}</h1>
      <p role="status">{t("bootLoading")}</p>
      <ProgressBar value={Math.round(fraction * 100)} label={t("bootProgress")} />
    </Screen>
  );
}
