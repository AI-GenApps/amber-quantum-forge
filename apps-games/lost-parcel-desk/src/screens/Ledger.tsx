import { Screen } from "@web-games/kit";
import { isClosed, LEDGER } from "@web-games/lost-parcel-desk-core";
import { useEffect } from "preact/hooks";
import { useApp, useProfile } from "../state/app";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { Icon } from "../ui/Icon";
import { PaperCard } from "../ui/PaperCard";

export function Ledger() {
  const { game } = useApp();
  const profile = useProfile();
  const open = LEDGER.filter((fragment) => isClosed(profile, fragment.caseId));
  const unseenKey = open
    .filter((fragment) => profile.ledgerSeen[fragment.caseId] !== true)
    .map((fragment) => fragment.caseId)
    .join(",");

  useEffect(() => {
    void (async () => {
      for (const caseId of unseenKey.split(",").filter(Boolean)) await game.markLedgerSeen(caseId);
    })();
  }, [game, unseenKey]);

  return (
    <Screen name="ledger" class="lp-ledger">
      <Header title={t("ledgerTitle")} />
      <p class="lp-subnote" data-testid="ledger-count">
        {t("ledgerCount", { open: open.length, total: LEDGER.length })}
      </p>
      <ol class="lp-fragments">
        {LEDGER.map((fragment) => {
          const unlocked = isClosed(profile, fragment.caseId);
          const isNew = unlocked && profile.ledgerSeen[fragment.caseId] !== true;
          return (
            <li key={fragment.id}>
              <PaperCard
                id={`ledger-${fragment.id}`}
                tone={unlocked ? "cream" : "cream2"}
                as="article"
                class={unlocked ? "lp-fragment" : "lp-fragment lp-fragment--sealed"}
              >
                {unlocked ? (
                  <>
                    <h2 class="lp-fragment__title">
                      {t("ledgerFragment", { n: fragment.id, title: fragment.title })}
                      {isNew ? <span class="lp-new"> {t("ledgerNew")}</span> : null}
                    </h2>
                    <p>{fragment.text}</p>
                  </>
                ) : (
                  <p class="lp-locknote">
                    <Icon name="lock" size={16} />{" "}
                    {t("ledgerSealed", { n: fragment.id, id: fragment.caseId })}
                  </p>
                )}
              </PaperCard>
            </li>
          );
        })}
      </ol>
    </Screen>
  );
}
