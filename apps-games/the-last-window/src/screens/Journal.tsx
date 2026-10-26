import { Screen, Tabs } from "@web-games/kit";
import {
  diaryEntries,
  getRegular,
  journalEntries,
  levelForFp,
  regularOf,
} from "@web-games/the-last-window-core";
import { useState } from "preact/hooks";
import { Portrait } from "../art/Portrait";
import { useApp, useProfile } from "../state/app";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { Hearts } from "../ui/Hearts";

type TabId = "stories" | "diary";

export function Journal() {
  const { router } = useApp();
  const profile = useProfile();
  const [tab, setTab] = useState<TabId>("stories");
  const entries = journalEntries(profile);
  const diary = diaryEntries(profile);
  return (
    <Screen name="journal" class="tlw-page">
      <Header title={t("journalTitle")} />
      <Tabs
        label={t("journalTabs")}
        selected={tab}
        onChange={(id) => setTab(id as TabId)}
        tabs={[
          { id: "stories", label: t("journalStories") },
          { id: "diary", label: t("journalDiary") },
        ]}
      >
        {tab === "stories" ? (
          <ul class="tlw-list tlw-stories" data-testid="stories">
            {entries.map((entry) => {
              const regular = getRegular(entry.regularId);
              const level = levelForFp(regularOf(profile, entry.regularId).fp);
              return (
                <li key={entry.regularId} class="wg-card tlw-card" data-regular={entry.regularId}>
                  <div class="tlw-story__head">
                    <Portrait slot={regular.artPrefix} class="tlw-due__face" />
                    <div>
                      <h2 class="wg-card__title">{entry.storyTitle}</h2>
                      <p>{entry.name}</p>
                      <Hearts level={level} name={regular.shortName} />
                    </div>
                  </div>
                  <p>{t("journalProgress", { done: entry.scenesDone })}</p>
                  <p data-testid="story-ending">
                    {entry.finished && entry.endingTitle
                      ? t("journalEnding", { title: entry.endingTitle })
                      : t("journalOngoing")}
                  </p>
                  <ul class="tlw-list">
                    {entry.scenes.map((scene) => (
                      <li key={scene.id}>
                        {scene.available ? (
                          <button
                            type="button"
                            class="tlw-link"
                            data-scene={scene.id}
                            onClick={() =>
                              router.push("scene", {
                                ids: [scene.id],
                                index: 0,
                                after: "pop",
                                replay: true,
                              })
                            }
                          >
                            {t("journalReplay", { index: scene.index, title: scene.title })}
                          </button>
                        ) : (
                          <span class="tlw-muted">
                            {t("journalLockedScene", { index: scene.index })}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        ) : diary.length === 0 ? (
          <p>{t("journalDiaryEmpty")}</p>
        ) : (
          <ul class="tlw-list tlw-diary" data-testid="diary">
            {diary.map((entry) => (
              <li key={entry.day} class="wg-card tlw-card">
                <h2 class="wg-card__title">
                  {t("journalDay", { day: entry.day, title: entry.title })}
                </h2>
                <p>{entry.text}</p>
              </li>
            ))}
          </ul>
        )}
      </Tabs>
    </Screen>
  );
}
