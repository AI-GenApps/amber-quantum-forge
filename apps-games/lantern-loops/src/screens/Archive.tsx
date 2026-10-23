import { localDateKey, Screen, StarRating, Tabs } from "@web-games/kit";
import { useState } from "preact/hooks";
import { useApp } from "../app/AppContext";
import { dayName } from "../app/format";
import { dailyKeyOf } from "../app/source";
import { ArtImage } from "../art/ArtImage";
import { ScreenHeader } from "../components/ScreenHeader";
import { type ArchiveEntry, archiveList } from "../services/daily";
import { useProfile } from "../state/hooks";
import { t } from "../strings";

type Tab = "to-play" | "completed";

export function ArchiveScreen() {
  const { router, services } = useApp();
  const profile = useProfile(services.progression);
  const [tab, setTab] = useState<Tab>("to-play");
  const today = localDateKey(services.now());
  const entries = archiveList(today, profile);
  const shown = entries.filter((entry) => entry.status === tab);

  const row = (entry: ArchiveEntry) => (
    <li key={entry.dateKey}>
      <button
        type="button"
        class="ll-archive-row"
        data-date={entry.dateKey}
        aria-label={t("archive.row", {
          date: entry.dateKey,
          day: dayName(entry.weekday),
          size: entry.tier.size,
        })}
        onClick={() => router.push("puzzle", { id: dailyKeyOf(entry.dateKey) })}
      >
        <span class="ll-archive-date">{entry.dateKey}</span>
        <span class="ll-muted">
          {dayName(entry.weekday)}
          {" · "}
          {t("common.boardSize", { size: entry.tier.size })}
        </span>
        {entry.status === "completed" ? <StarRating value={entry.stars} /> : null}
      </button>
    </li>
  );

  return (
    <Screen name="archive" class="ll-screen">
      <ScreenHeader title={t("archive.title")} onBack={() => router.pop()} />
      <Tabs
        label={t("archive.tabs")}
        selected={tab}
        onChange={(id) => setTab(id === "completed" ? "completed" : "to-play")}
        tabs={[
          { id: "to-play", label: t("archive.toPlay") },
          { id: "completed", label: t("archive.completed") },
        ]}
      >
        {shown.length > 0 ? (
          <ul class="ll-list" data-testid="archive-list">
            {shown.map(row)}
          </ul>
        ) : (
          <div class="ll-empty" data-testid="archive-empty">
            {tab === "completed" ? (
              <>
                <ArtImage slot="empty-archive" />
                <h2 class="ll-subtitle">{t("archive.emptyTitle")}</h2>
                <p class="ll-body">{t("archive.emptyBody")}</p>
              </>
            ) : (
              <p class="ll-body">{t("archive.allDone")}</p>
            )}
          </div>
        )}
      </Tabs>
    </Screen>
  );
}
