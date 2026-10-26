import { Button, Screen } from "@web-games/kit";
import { useState } from "preact/hooks";
import { HOWTO_PAGES } from "../data/howto";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { PaperCard } from "../ui/PaperCard";

export function HowTo() {
  const [page, setPage] = useState(0);
  const current = HOWTO_PAGES[page];
  if (!current) return null;
  const lines = current.lines.length > 0 ? current.lines : [t("howtoSoon")];
  return (
    <Screen name="howto" class="lp-howto">
      <Header title={t("howtoTitle")} />
      <p class="lp-subnote" data-testid="howto-page">
        {t("howtoPage", { n: page + 1, total: HOWTO_PAGES.length })}
      </p>
      <PaperCard id={current.id} class="lp-howto__page">
        <h2 class="lp-howto__title">{current.title}</h2>
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </PaperCard>
      <div class="lp-actions">
        <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>
          {t("howtoPrev")}
        </Button>
        <Button disabled={page === HOWTO_PAGES.length - 1} onClick={() => setPage(page + 1)}>
          {t("howtoNext")}
        </Button>
      </div>
    </Screen>
  );
}
