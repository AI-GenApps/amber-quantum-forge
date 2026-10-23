import { Card, Screen } from "@web-games/kit";
import { useState } from "preact/hooks";
import { useApp } from "../app/context";
import { Btn } from "../components/Btn";
import { ScreenHeader } from "../components/ScreenHeader";
import { t } from "../strings";
import { ChartDiagram, CometDiagram, EclipseDiagram, GatherDiagram } from "./howto-diagrams";

const PAGES = [
  { title: t("howto.1.title"), body: t("howto.1.body"), diagram: t("howto.1.diagram") },
  { title: t("howto.2.title"), body: t("howto.2.body"), diagram: t("howto.2.diagram") },
  { title: t("howto.3.title"), body: t("howto.3.body"), diagram: t("howto.3.diagram") },
  { title: t("howto.4.title"), body: t("howto.4.body"), diagram: t("howto.4.diagram") },
] as const;

function Diagram({ page, label }: { page: number; label: string }) {
  switch (page) {
    case 0:
      return <GatherDiagram label={label} />;
    case 1:
      return <ChartDiagram label={label} />;
    case 2:
      return <EclipseDiagram label={label} />;
    default:
      return <CometDiagram label={label} />;
  }
}

export function HowToPlay() {
  const { router, onboarding, notify, feedback } = useApp();
  const [page, setPage] = useState(0);
  const last = page === PAGES.length - 1;
  const current = PAGES[page] ?? PAGES[0];
  return (
    <Screen name="howto" class="co-screen">
      <ScreenHeader title={t("howto.title")} />
      <Card tone="raised" class="co-howto">
        <p class="co-label" data-page={page + 1}>
          {t("howto.page", { page: page + 1, total: PAGES.length })}
        </p>
        <Diagram page={page} label={current.diagram} />
        <h2 class="co-card__title">{current.title}</h2>
        <p class="co-howto__body">{current.body}</p>
      </Card>
      <div class="co-row-actions">
        <Btn variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>
          {t("howto.previous")}
        </Btn>
        <Btn
          onClick={() => {
            if (last) {
              if (!router.pop()) router.reset("title");
            } else setPage(page + 1);
          }}
        >
          {last ? t("howto.done") : t("howto.next")}
        </Btn>
      </div>
      <Btn
        variant="ghost"
        class="co-howto__replay"
        onClick={() => {
          feedback.sfx("click");
          onboarding.replay();
          notify(t("howto.replayed"));
        }}
      >
        {t("howto.replay")}
      </Btn>
    </Screen>
  );
}
