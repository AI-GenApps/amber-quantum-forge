import { Screen } from "@web-games/kit";
import { TITLE } from "@web-games/lost-parcel-desk-core";
import { ART_CREDITS, AUDIO_CREDITS, type CreditEntry, FONT_CREDITS } from "../data/credits";
import { t } from "../strings";
import { Header } from "../ui/Header";

function Section({
  title,
  empty,
  entries,
}: {
  title: string;
  empty: string;
  entries: readonly CreditEntry[];
}) {
  return (
    <section class="lp-creditsection" aria-label={title}>
      <h2 class="lp-section">{title}</h2>
      {entries.length === 0 ? <p class="lp-empty">{empty}</p> : null}
      <ul>
        {entries.map((entry) => (
          <li key={entry.name} class="lp-credit">
            <strong>{entry.name}</strong>
            <span>{entry.author}</span>
            <span>{entry.licence}</span>
            <span class="lp-credit__src">{entry.source}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Credits() {
  return (
    <Screen name="credits" class="lp-credits">
      <Header title={t("creditsTitle")} />
      <p>{t("creditsIntro", { title: TITLE })}</p>
      <Section title={t("creditsFonts")} empty={t("creditsNone")} entries={FONT_CREDITS} />
      <Section title={t("creditsAudio")} empty={t("creditsAudioNone")} entries={AUDIO_CREDITS} />
      <Section title={t("creditsArt")} empty={t("creditsArtNone")} entries={ART_CREDITS} />
      <p class="lp-subnote">{t("creditsPrivacy")}</p>
    </Screen>
  );
}
