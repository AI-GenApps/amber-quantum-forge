import { Card, Screen } from "@web-games/kit";
import { useState } from "preact/hooks";
import { useApp } from "../app/context";
import { Btn } from "../components/Btn";
import { ScreenHeader } from "../components/ScreenHeader";
import { t } from "../strings";

const PAGES = [
  { title: t("howto.1.title"), body: t("howto.1.body") },
  { title: t("howto.2.title"), body: t("howto.2.body") },
  { title: t("howto.3.title"), body: t("howto.3.body") },
  { title: t("howto.4.title"), body: t("howto.4.body") },
] as const;

export function HowToPlay() {
  const { router } = useApp();
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
    </Screen>
  );
}
