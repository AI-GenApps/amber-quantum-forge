import { Button, Screen } from "@web-games/kit";
import { useState } from "preact/hooks";
import { useApp } from "../app/AppContext";
import { HOWTO_PAGES, type HowToPage } from "../app/routes";
import { ScreenHeader } from "../components/ScreenHeader";
import { t } from "../strings";

function pageTitle(page: HowToPage): string {
  switch (page) {
    case "basics":
      return t("howto.basics");
    case "stones":
      return t("howto.stones");
    case "mirrors":
      return t("howto.mirrors");
    case "gates":
      return t("howto.gates");
    case "daily":
      return t("howto.daily");
    default:
      return t("howto.hints");
  }
}

function pageBody(page: HowToPage): string {
  switch (page) {
    case "basics":
      return t("howto.basicsBody");
    case "stones":
      return t("howto.stonesBody");
    case "mirrors":
      return t("howto.mirrorsBody");
    case "gates":
      return t("howto.gatesBody");
    case "daily":
      return t("howto.dailyBody");
    default:
      return t("howto.hintsBody");
  }
}

/** Shell with the six pages; the diagrams and final copy arrive with the onboarding task. */
export function HowToScreen({ page }: { page: HowToPage }) {
  const { router } = useApp();
  const [index, setIndex] = useState(Math.max(0, HOWTO_PAGES.indexOf(page)));
  const current = HOWTO_PAGES[index] ?? "basics";
  return (
    <Screen name="howto" class="ll-screen">
      <ScreenHeader title={t("howto.title")} onBack={() => router.pop()} />
      <article class="ll-howto" data-page={current}>
        <h2 class="ll-subtitle">{pageTitle(current)}</h2>
        <p class="ll-body">{pageBody(current)}</p>
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
