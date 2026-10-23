import { Button, Screen } from "@web-games/kit";
import { useState } from "preact/hooks";
import { HOWTO_PAGES } from "../data/howto";
import { t } from "../strings";
import { Header } from "../ui/Header";

export function HowTo() {
  const [index, setIndex] = useState(0);
  const page = HOWTO_PAGES[index];
  const last = HOWTO_PAGES.length - 1;
  return (
    <Screen name="howto">
      <Header title={t("howtoTitle")} />
      <article class="fd-panel" aria-live="polite" data-testid="howto-page">
        <h2 class="fd-panel__title">{page?.title}</h2>
        {page?.body.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </article>
      <p class="fd-sub" data-testid="howto-count">
        {t("howtoPage", { page: index + 1, total: HOWTO_PAGES.length })}
      </p>
      <div class="fd-actions">
        <Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          {t("howtoPrev")}
        </Button>
        <Button disabled={index === last} onClick={() => setIndex(index + 1)}>
          {t("howtoNext")}
        </Button>
      </div>
    </Screen>
  );
}
