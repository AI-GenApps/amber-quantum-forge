import { GAME_TITLE } from "@web-games/dress-rehearsal-core";
import { Screen } from "@web-games/kit";
import { ART_CREDITS, AUDIO_CREDITS, type CreditEntry, FONT_CREDITS } from "../data/credits";
import { t } from "../strings";
import { Header } from "../ui/Header";

function Section({
  title,
  entries,
  none,
}: {
  title: string;
  entries: readonly CreditEntry[];
  none: string;
}) {
  return (
    <section class="dr-panel" aria-label={title}>
      <h2 class="dr-panel__title">{title}</h2>
      {entries.length === 0 ? (
        <p class="dr-note">{none}</p>
      ) : (
        <ul class="dr-bullets">
          {entries.map((entry) => (
            <li key={`${entry.name}-${entry.source}`}>
              <strong>{entry.name}</strong>
              {` - ${entry.role}. ${entry.licence}. `}
              <span class="dr-credit__source">{entry.source}</span>
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
      <Header title={t("creditsTitle")} showCoins={false} />
      <p class="dr-note">{t("creditsIntro", { title: GAME_TITLE })}</p>
      <Section title={t("creditsFonts")} entries={FONT_CREDITS} none={t("creditsNone")} />
      <Section title={t("creditsAudio")} entries={AUDIO_CREDITS} none={t("creditsAudioNone")} />
      <Section title={t("creditsArt")} entries={ART_CREDITS} none={t("creditsArtNone")} />
    </Screen>
  );
}
