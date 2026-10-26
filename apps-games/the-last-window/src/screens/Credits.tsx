import { Screen } from "@web-games/kit";
import { type CreditGroup, creditsFor } from "../data/credits";
import { t } from "../strings";
import { Header } from "../ui/Header";

const GROUPS: readonly { id: CreditGroup; title: () => string }[] = [
  { id: "fonts", title: () => t("creditsFonts") },
  { id: "audio", title: () => t("creditsAudio") },
  { id: "art", title: () => t("creditsArt") },
];

export function Credits() {
  return (
    <Screen name="credits" class="tlw-page">
      <Header title={t("creditsTitle")} />
      {GROUPS.map((group) => {
        const rows = creditsFor(group.id);
        return (
          <section key={group.id} class="wg-card tlw-card" aria-label={group.title()}>
            <h2 class="wg-card__title">{group.title()}</h2>
            {rows.length === 0 ? <p class="tlw-muted">{t("creditsPending")}</p> : null}
            <ul class="tlw-list">
              {rows.map((row) => (
                <li key={row.name}>
                  <strong>{row.name}</strong> - {row.author}
                  <br />
                  <span class="tlw-muted">{t("creditsLicence", { licence: row.licence })}</span>
                  <br />
                  <span class="tlw-muted">{t("creditsSource", { url: row.source })}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </Screen>
  );
}
