import { Screen } from "@web-games/kit";
import { ART_CREDITS, AUDIO_CREDITS, type CreditEntry, FONT_CREDITS } from "../data/credits";
import { t } from "../strings";
import { Header } from "../ui/Header";

function Section({ title, entries }: { title: string; entries: readonly CreditEntry[] }) {
  return (
    <section class="fd-panel" aria-label={title}>
      <h2 class="fd-panel__title">{title}</h2>
      {entries.length === 0 ? (
        <p>{t("creditsNone")}</p>
      ) : (
        <ul class="fd-list">
          {entries.map((entry) => (
            <li key={entry.name}>
              <strong>{t("creditsLicence", { name: entry.name, licence: entry.licence })}</strong>
              {entry.note ? <span class="fd-sub"> {entry.note}</span> : null}
              <span class="fd-sub fd-credit__source"> {entry.source}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Credits() {
  return (
    <Screen name="credits">
      <Header title={t("creditsTitle")} />
      <Section title={t("creditsFonts")} entries={FONT_CREDITS} />
      <Section title={t("creditsAudio")} entries={AUDIO_CREDITS} />
      <Section title={t("creditsArt")} entries={ART_CREDITS} />
    </Screen>
  );
}
