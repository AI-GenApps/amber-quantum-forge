import { chapterProgress, LORE, type LoreEntry } from "@web-games/cloud-observatory-core";
import { useApp } from "../app/context";
import { Icon } from "../components/Icon";
import { t } from "../strings";
import { ArtImage } from "../ui/ArtImage";
import { loreSlot } from "../ui/art-slots";
import { cx } from "../ui/cx";
import { loreHint } from "./lore-hints";

function EntryRow({
  entry,
  unlocked,
  seen,
}: {
  entry: LoreEntry;
  unlocked: boolean;
  seen: boolean;
}) {
  const { openEntry, feedback } = useApp();
  return (
    <li>
      <button
        type="button"
        class={cx(
          "co-entry",
          unlocked ? "co-entry--open" : "co-entry--locked",
          unlocked && !seen && "co-entry--new",
        )}
        data-entry={entry.id}
        data-state={unlocked ? (seen ? "read" : "unread") : "locked"}
        aria-disabled={unlocked ? undefined : "true"}
        onClick={() => {
          if (!unlocked) return;
          feedback.sfx("click");
          openEntry(entry.id);
        }}
      >
        <Icon name={unlocked ? "book" : "lock"} />
        <span class="co-entry__text">
          <span class="co-entry__title">{unlocked ? entry.title : t("journal.locked")}</span>
          <span class="co-entry__sub">
            {unlocked ? (seen ? t("journal.read") : t("journal.new")) : loreHint(entry)}
          </span>
        </span>
      </button>
    </li>
  );
}

export function JournalTab() {
  const { snapshot } = useApp();
  const { profile } = snapshot;
  const progress = chapterProgress(profile);
  const total = progress.reduce((sum, item) => sum + item.unlocked, 0);
  return (
    <div class="co-panel" data-tab="journal">
      <p class="co-journal-count" data-unlocked={total}>
        {t("journal.count", { count: total, total: LORE.length })}
      </p>
      {progress.map(({ chapter, unlocked, total: chapterTotal }) => (
        <section key={chapter.number} class="co-chapter" data-chapter={chapter.number}>
          <header class="co-chapter__head">
            <div class="co-chapter__art">
              <ArtImage slot={loreSlot(chapter.number)} />
            </div>
            <div>
              <p class="co-label">{t("journal.chapter", { number: chapter.number })}</p>
              <h2 class="co-chapter__title">{chapter.title}</h2>
              <p class="co-chapter__progress">
                {t("journal.progress", { count: unlocked, total: chapterTotal })}
              </p>
            </div>
          </header>
          <ul class="co-entries">
            {LORE.filter((entry) => entry.chapter === chapter.number).map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                unlocked={profile.loreUnlocked.includes(entry.id)}
                seen={profile.loreSeen.includes(entry.id)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
