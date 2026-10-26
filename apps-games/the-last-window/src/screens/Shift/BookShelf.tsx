import { type BookId, bookRule, type ShiftState } from "@web-games/the-last-window-core";
import { useState } from "preact/hooks";
import { ItemIcon } from "../../art/ItemIcon";
import { bookTitle, moodLine } from "../../labels";
import { t } from "../../strings";
import { MoodChip } from "../../ui/MoodChip";

export interface BookShelfProps {
  state: ShiftState;
  guide: boolean;
  onPick: (id: BookId) => void;
}

export function BookShelf({ state, guide, onPick }: BookShelfProps) {
  const [open, setOpen] = useState(false);
  const seat = state.active === null ? null : state.seats[state.active];
  const wanted = seat?.order?.mood ?? null;
  const glow = guide && wanted !== null && seat?.tray.book === null;
  if (state.shelfBooks.length === 0) return null;
  return (
    <section class="tlw-station" aria-label={t("shiftBookShelf")} data-testid="book-shelf">
      <h2 class="tlw-station__title">{t("shiftBookShelf")}</h2>
      <button
        type="button"
        class={`tlw-step tlw-step--wide${glow ? " tlw-step--guide" : ""}`}
        aria-expanded={open}
        aria-label={open ? t("shiftBookClose") : t("shiftBookOpen")}
        data-testid="shelf-toggle"
        onClick={() => setOpen(!open)}
      >
        {t("shiftBookShelf")}
      </button>
      {open ? (
        <ul class="tlw-books">
          {state.shelfBooks.map((id) => {
            const rule = bookRule(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  class="tlw-book"
                  aria-label={t("shiftBookPick", {
                    title: bookTitle(id),
                    moods: moodLine(rule.moods),
                  })}
                  data-book={id}
                  onClick={() => {
                    onPick(id);
                    setOpen(false);
                  }}
                >
                  <ItemIcon slot={id} />
                  <span class="tlw-book__title">{rule.title}</span>
                  <span class="tlw-book__moods">
                    {rule.moods.map((mood) => (
                      <MoodChip key={mood} mood={mood} />
                    ))}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
