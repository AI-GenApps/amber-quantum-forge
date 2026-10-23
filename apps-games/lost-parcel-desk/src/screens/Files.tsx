import { Screen } from "@web-games/kit";
import {
  bestStamps,
  CASES,
  CHAPTERS,
  caseUnlocked,
  chapterUnlocked,
  isClosed,
  totalStamps,
} from "@web-games/lost-parcel-desk-core";
import { useState } from "preact/hooks";
import { ChapterSheet } from "../sheets/ChapterSheet";
import { useApp, useProfile } from "../state/app";
import { useGame } from "../state/useGame";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { Icon } from "../ui/Icon";
import { StampRow } from "../ui/StampRow";

const introFlag = (chapter: number): string => `chapter-${chapter}-intro`;

export function Files() {
  const { router, game } = useApp();
  const profile = useProfile();
  const { active } = useGame();
  const total = totalStamps(profile);
  const pending = CHAPTERS.find(
    (chapter) =>
      chapterUnlocked(profile, chapter.id) && profile.flags[introFlag(chapter.id)] !== true,
  );
  const [reading, setReading] = useState<number | null>(null);
  const shown = reading ?? pending?.id ?? null;

  const close = (): void => {
    if (shown !== null) void game.markFlag(introFlag(shown));
    setReading(null);
  };

  return (
    <Screen name="files" class="lp-files">
      <Header title={t("filesTitle")} />
      {CHAPTERS.map((chapter) => {
        const open = chapterUnlocked(profile, chapter.id);
        return (
          <section key={chapter.id} class="lp-chapter" aria-labelledby={`chapter-${chapter.id}`}>
            <h2 id={`chapter-${chapter.id}`} class="lp-chapter__title">
              {t("chapterHeading", { n: chapter.id, title: chapter.title })}
            </h2>
            {open ? (
              <button type="button" class="lp-linkbutton" onClick={() => setReading(chapter.id)}>
                {t("chapterStory")}
              </button>
            ) : (
              <p class="lp-locknote" data-testid={`chapter-lock-${chapter.id}`}>
                <Icon name="lock" size={16} />{" "}
                {t("chapterLocked", { stamps: chapter.unlockStamps, have: total })}
              </p>
            )}
            <ul class="lp-folders">
              {chapter.caseIds.map((caseId) => {
                const item = CASES.find((candidate) => candidate.id === caseId);
                if (!item) return null;
                const unlocked = caseUnlocked(profile, caseId);
                const closed = isClosed(profile, caseId);
                const inProgress =
                  active?.kind === "campaign" && active.id === caseId && !active.state.closed;
                const status = !unlocked
                  ? t("folderLocked")
                  : closed
                    ? t("folderDelivered")
                    : inProgress || profile.session?.id === caseId
                      ? t("folderInProgress")
                      : t("folderNew");
                return (
                  <li key={caseId}>
                    <button
                      type="button"
                      class={`lp-folder${unlocked ? "" : " lp-folder--locked"}${closed ? " lp-folder--done" : ""}`}
                      disabled={!unlocked}
                      data-case={caseId}
                      onClick={() => router.push("intro", { caseId })}
                    >
                      <span class="lp-folder__no">{t("caseNumber", { id: caseId })}</span>
                      <span class="lp-folder__title">{item.title}</span>
                      <span class="lp-folder__status">
                        {!unlocked ? <Icon name="lock" size={16} /> : null} {status}
                      </span>
                      <StampRow earned={bestStamps(profile, caseId)} size={18} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {shown !== null ? <ChapterSheet open chapter={shown} part="intro" onClose={close} /> : null}
    </Screen>
  );
}
