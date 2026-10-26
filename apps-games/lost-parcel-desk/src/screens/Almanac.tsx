import { Screen, Tabs } from "@web-games/kit";
import { ALMANAC, FACET_LABELS, FACETS, PEOPLE } from "@web-games/lost-parcel-desk-core";
import { useEffect, useState } from "preact/hooks";
import { Sprite } from "../art/Sprite";
import { FACET_NOTE } from "../data/facetNotes";
import { almanacKey } from "../lib/almanacLink";
import { metPeople } from "../lib/met";
import type { AlmanacTarget } from "../nav";
import { useArtManifest, useProfile } from "../state/app";
import { useGame } from "../state/useGame";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { PaperCard } from "../ui/PaperCard";

export function Almanac({ target }: { target: AlmanacTarget }) {
  const profile = useProfile();
  const { active } = useGame();
  const manifest = useArtManifest();
  const [tab, setTab] = useState(target.tab);
  const met = metPeople(profile, active?.state.candidateIds);

  useEffect(() => {
    if (target.entry === undefined) return;
    const node = document.querySelector<HTMLElement>(`[data-entry="${target.entry}"]`);
    node?.scrollIntoView?.({ block: "center" });
  }, [target.entry]);

  return (
    <Screen name="almanac" class="lp-almanac">
      <Header title={t("almanacTitle")} />
      <Tabs
        label={t("almanacTabs")}
        selected={tab}
        onChange={(id) => setTab(id === "townsfolk" ? "townsfolk" : "clues")}
        tabs={[
          { id: "clues", label: t("almanacClues") },
          {
            id: "townsfolk",
            label: t("almanacTownsfolk", { met: met.size, total: PEOPLE.length }),
          },
        ]}
      >
        {tab === "clues" ? (
          <div class="lp-entries">
            <p class="lp-subnote">{t("almanacIntro")}</p>
            {FACETS.map((facet) => (
              <section key={facet} aria-label={FACET_LABELS[facet]}>
                <h2 class="lp-section">
                  {FACET_LABELS[facet]} <span class="lp-section__note">{FACET_NOTE[facet]}</span>
                </h2>
                {ALMANAC.filter((entry) => entry.facet === facet).map((entry) => {
                  const key = almanacKey(entry);
                  const focused = target.entry === key;
                  return (
                    <PaperCard
                      key={key}
                      id={key}
                      as="article"
                      class={focused ? "lp-entry lp-entry--focus" : "lp-entry"}
                      tilt={0}
                    >
                      <div data-entry={key} data-focused={focused ? "true" : "false"}>
                        <h3 class="lp-entry__value">{entry.value}</h3>
                        <p class="lp-entry__keys">
                          {t("almanacLookFor", { words: entry.keywords.join(", ") })}
                        </p>
                      </div>
                    </PaperCard>
                  );
                })}
              </section>
            ))}
          </div>
        ) : (
          <ul class="lp-book">
            {PEOPLE.map((person) => {
              const known = met.has(person.id);
              return (
                <li key={person.id}>
                  <PaperCard
                    id={person.id}
                    as="article"
                    class="lp-person"
                    tilt={0}
                    label={known ? person.name : t("almanacUnmet")}
                  >
                    {known ? (
                      <>
                        <Sprite
                          slot={person.portraitSlot}
                          size={54}
                          label={t("portraitOf", { name: person.name })}
                          {...(manifest ? { manifest } : {})}
                        />
                        <div class="lp-person__body">
                          <h3 class="lp-person__name">{person.name}</h3>
                          <p class="lp-person__trade">{person.trade}</p>
                          <p>{person.bio}</p>
                          <dl class="lp-person__facts">
                            {FACETS.map((facet) => (
                              <div key={facet} class="lp-pcard__fact">
                                <dt>{FACET_LABELS[facet]}</dt>
                                <dd>{person.facets[facet]}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      </>
                    ) : (
                      <p class="lp-person__unmet" data-testid="unmet">
                        {t("almanacUnmet")}
                      </p>
                    )}
                  </PaperCard>
                </li>
              );
            })}
          </ul>
        )}
      </Tabs>
    </Screen>
  );
}
