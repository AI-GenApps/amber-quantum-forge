import { Button, Screen } from "@web-games/kit";
import { useState } from "preact/hooks";
import { useApp } from "../app/AppContext";
import { HOWTO_PAGES, type HowToPage } from "../app/routes";
import { ScreenHeader } from "../components/ScreenHeader";
import { Diagram } from "../howto/diagrams";
import { HOWTO_COPY, pageIndex } from "../howto/pages";
import { t } from "../strings";

/** Six short pages, each with a code-drawn diagram, reached from Home and the pause sheet. */
export function HowToScreen({ page }: { page: HowToPage }) {
  const { router } = useApp();
  const [index, setIndex] = useState(pageIndex(page));
  const current = HOWTO_PAGES[index] ?? "basics";
  const copy = HOWTO_COPY[current];
  return (
    <Screen name="howto" class="ll-screen">
      <ScreenHeader title={t("howto.title")} onBack={() => router.pop()} />
      <article class="ll-howto" data-page={current}>
        <h2 class="ll-subtitle">{copy.title()}</h2>
        <Diagram page={current} label={copy.diagram()} />
        <p class="ll-body">{copy.body()}</p>
      </article>
      <p class="ll-muted" aria-live="polite" data-testid="howto-position">
        {t("howto.position", { page: index + 1, total: HOWTO_PAGES.length })}
      </p>
      <div class="ll-actions">
        <Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          {t("howto.previous")}
        </Button>
        <Button disabled={index === HOWTO_PAGES.length - 1} onClick={() => setIndex(index + 1)}>
          {t("howto.next")}
        </Button>
      </div>
    </Screen>
  );
}
