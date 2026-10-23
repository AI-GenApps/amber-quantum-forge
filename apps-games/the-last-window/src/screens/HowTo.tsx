import { Button, Screen } from "@web-games/kit";
import { useState } from "preact/hooks";
import { HOWTO_PAGES } from "../data/howto";
import { t } from "../strings";
import { Header } from "../ui/Header";

export function HowTo() {
  const [page, setPage] = useState(0);
  const entry = HOWTO_PAGES[page] ?? HOWTO_PAGES[0];
  if (!entry) return null;
  return (
    <Screen name="howto" class="tlw-page">
      <Header title={t("howtoTitle")} />
      <p class="tlw-muted" data-testid="howto-page">
        {t("howtoPage", { page: page + 1, total: HOWTO_PAGES.length })}
      </p>
      <article class="wg-card tlw-card">
        <h2 class="wg-card__title">{entry.title}</h2>
        {entry.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </article>
      <div class="tlw-actions">
        <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>
          {t("howtoPrev")}
        </Button>
        <Button disabled={page >= HOWTO_PAGES.length - 1} onClick={() => setPage(page + 1)}>
          {t("howtoNext")}
        </Button>
      </div>
    </Screen>
  );
}
