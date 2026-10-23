import { findMap, mapUnlocked, REGIONS } from "@web-games/floodplain-dispatch-core";
import { Button, localDateKey, Screen } from "@web-games/kit";
import { useEffect, useMemo, useState } from "preact/hooks";
import { type BoardTarget, isDailyTarget } from "../nav";
import type { SessionSource } from "../session/types";
import { useApp, useProfile } from "../state/app";
import { dailyPuzzle } from "../state/dailyInfo";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { BoardSessionView } from "./BoardSession";

function Notice({ title, message }: { title: string; message: string }) {
  const { router } = useApp();
  return (
    <Screen name="board-notice">
      <Header title={title} />
      <p class="fd-notice" role="status">
        {message}
      </p>
      <Button onClick={() => void router.pop()}>{t("back")}</Button>
    </Screen>
  );
}

function CampaignBoard({ mapId }: { mapId: string }) {
  const profile = useProfile();
  const map = findMap(mapId);
  if (!map) return <Notice title={t("appName")} message={t("boardMissing")} />;
  if (!mapUnlocked(profile, mapId)) return <Notice title={map.name} message={t("boardLocked")} />;
  const region = REGIONS.find((entry) => entry.id === map.region);
  const ordinal = (region?.mapIds.indexOf(mapId) ?? 0) + 1;
  const source: SessionSource = {
    kind: "campaign",
    key: mapId,
    def: map,
    reference: map.reference,
    title: `${ordinal}. ${map.name}`,
    region: map.region,
    mapId,
  };
  return <BoardSessionView key={source.key} source={source} />;
}

function DailyBoard() {
  const { clock } = useApp();
  const dateKey = useMemo(() => localDateKey(clock()), [clock]);
  const [ready, setReady] = useState<SessionSource | null>(null);
  useEffect(() => {
    let alive = true;
    const id = setTimeout(() => {
      const puzzle = dailyPuzzle(dateKey);
      if (!alive) return;
      setReady({
        kind: "daily",
        key: `daily-${dateKey}`,
        def: puzzle.map,
        reference: puzzle.map.reference,
        title: t("boardDailyTitle", { date: dateKey }),
        region: "daily",
        dateKey,
      });
    }, 0);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [dateKey]);
  if (!ready) {
    return (
      <Screen name="board-preparing">
        <Header title={t("dailyTitle")} />
        <p class="fd-notice" role="status">
          {t("boardPreparing")}
        </p>
      </Screen>
    );
  }
  return <BoardSessionView key={ready.key} source={ready} />;
}

export function BoardScreen({ target }: { target: BoardTarget }) {
  return isDailyTarget(target) ? <DailyBoard /> : <CampaignBoard mapId={target.mapId} />;
}
