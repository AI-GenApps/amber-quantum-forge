import { AFFINITY_THRESHOLDS, affinityProgress, CLIENTS } from "@web-games/dress-rehearsal-core";
import { ProgressBar, Screen } from "@web-games/kit";
import { Sprite } from "../art/Sprite";
import { clientSlot } from "../art/slots";
import { useApp, useProfile } from "../state/app";
import { t } from "../strings";
import { Header } from "../ui/Header";

export function Clients() {
  const { artManifest } = useApp();
  const profile = useProfile();
  return (
    <Screen name="clients">
      <Header title={t("clientsTitle")} />
      <ul class="dr-list" data-testid="client-list">
        {CLIENTS.map((client, index) => {
          const progress = affinityProgress(profile, client.id);
          const target =
            progress.nextAt ?? AFFINITY_THRESHOLDS[AFFINITY_THRESHOLDS.length - 1] ?? 1;
          const lines = [client.lines.level1, client.lines.level2, client.lines.level3];
          return (
            <li key={client.id}>
              <article
                class="dr-card dr-client"
                data-client={client.id}
                data-level={progress.level}
              >
                <div class="dr-client__head">
                  <Sprite
                    slot={clientSlot(index)}
                    size={72}
                    label={client.name}
                    {...(artManifest ? { manifest: artManifest } : {})}
                  />
                  <div>
                    <h2 class="dr-client__name">{client.name}</h2>
                    <p class="dr-note">{client.role}</p>
                  </div>
                </div>
                <p>{client.bio}</p>
                <p class="dr-client__level" data-testid={`affinity-${client.id}`}>
                  {t("clientLevel", { level: progress.level, max: AFFINITY_THRESHOLDS.length })}
                  {" - "}
                  {progress.nextAt === null
                    ? t("clientMaxed", { stars: progress.stars })
                    : t("clientNext", { stars: progress.stars, next: progress.nextAt })}
                </p>
                <ProgressBar
                  value={Math.min(progress.stars, target)}
                  max={target}
                  label={t("clientProgress", { name: client.name })}
                />
                <ul class="dr-lines" aria-label={t("clientLines", { name: client.name })}>
                  <li class="dr-quote">{client.lines.intro}</li>
                  {lines.map((line, i) =>
                    progress.level >= i + 1 ? (
                      <li key={line} class="dr-quote">
                        {line}
                      </li>
                    ) : (
                      <li key={line} class="dr-note dr-lines__locked">
                        {t("clientLineLocked", {
                          level: i + 1,
                          stars: AFFINITY_THRESHOLDS[i] ?? 0,
                        })}
                      </li>
                    ),
                  )}
                </ul>
              </article>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
