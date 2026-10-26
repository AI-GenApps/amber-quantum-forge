import { Button, Screen } from "@web-games/kit";
import { useEffect, useState } from "preact/hooks";
import { HOW_TO } from "../data/howto";
import { useApp, useProfile } from "../state/app";
import { t } from "../strings";
import { Header } from "../ui/Header";

export function HowTo() {
  const app = useApp();
  const seen = useProfile().flags.howTo;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!seen) void app.game.markFlag("howTo");
  }, [seen, app.game]);

  const page = HOW_TO[index];
  return (
    <Screen name="howto">
      <Header title={t("howtoTitle")} showCoins={false} />
      <section
        class="dr-panel"
        aria-label={page?.title}
        data-testid="howto-page"
        data-page={page?.id}
      >
        <p class="dr-eyebrow">{t("howtoPage", { page: index + 1, total: HOW_TO.length })}</p>
        <h2 class="dr-panel__title">{page?.title}</h2>
        <div class="dr-howto__body">
          {(page?.paragraphs ?? []).map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
      </section>
      <div class="dr-sheet__actions">
        <Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          {t("howtoPrev")}
        </Button>
        <Button
          variant="secondary"
          disabled={index >= HOW_TO.length - 1}
          onClick={() => setIndex(index + 1)}
        >
          {t("howtoNext")}
        </Button>
      </div>
    </Screen>
  );
}
