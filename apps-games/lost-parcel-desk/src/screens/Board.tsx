import { Button, Screen } from "@web-games/kit";
import {
  canAccuse,
  fitsCount,
  type LinkKind,
  PEOPLE_BY_ID,
  summarizeBoard,
} from "@web-games/lost-parcel-desk-core";
import { useState } from "preact/hooks";
import { cardLinks, chipState, clueById, linkOf, liveSummary, pairBrackets } from "../lib/board";
import { openAlmanac } from "../lib/openAlmanac";
import { caseTitle } from "../lib/titles";
import { wrongNote } from "../lib/wrong";
import { type CaseTarget, isDailyTarget, leaveCaseTo } from "../nav";
import { useCoachStep } from "../onboarding/TutorialProvider";
import { AccuseConfirm } from "../sheets/AccuseConfirm";
import { WrongNote } from "../sheets/WrongNote";
import { useApp, useFeedback } from "../state/app";
import type { ActiveCase } from "../state/game";
import { useCase } from "../state/useCase";
import { t } from "../strings";
import { ClueChip } from "../ui/ClueChip";
import { Header } from "../ui/Header";
import { HintControl } from "../ui/HintControl";
import { LinkMenu } from "../ui/LinkMenu";
import { ProfileCard } from "../ui/ProfileCard";
import { useHotkeys } from "../ui/useHotkeys";

interface WrongState {
  name: string;
  text: string;
  stamps: number;
}

export function BoardScreen({ target }: { target: CaseTarget }) {
  const { active, failed } = useCase(target);
  if (active === null) {
    return (
      <Screen name="board" class="lp-board">
        <Header title={t("boardTitle")} />
        <p role={failed ? "alert" : "status"}>{failed ? t("introLocked") : t("tableOpening")}</p>
      </Screen>
    );
  }
  return <BoardBody target={target} active={active} />;
}

function BoardBody({ target, active }: { target: CaseTarget; active: ActiveCase }) {
  const app = useApp();
  const { router, game } = app;
  const feedback = useFeedback();
  const coach = useCoachStep();
  const [clueId, setClueId] = useState<string | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [wrong, setWrong] = useState<WrongState | null>(null);

  const { def, state } = active;
  const pinned = state.pinnedClueIds.flatMap((id) => {
    const clue = clueById(def, id);
    return clue ? [clue] : [];
  });
  const summaries = summarizeBoard(def, state);
  const nameOf = (id: string): string => PEOPLE_BY_ID[id]?.name ?? id;

  function openMenu(): void {
    if (clueId === null || cardId === null) {
      setNotice(clueId === null ? t("linkNeedClue") : t("linkNeedCard"));
      return;
    }
    setNotice(null);
    setMenu(true);
  }

  function ask(): void {
    if (state.closed) return;
    if (cardId === null) {
      setNotice(t("accuseNeedCard"));
      return;
    }
    const check = canAccuse(state, cardId);
    if (!check.ok) {
      setNotice(
        check.reason === "NEEDS_MORE_FITS"
          ? t("accuseNeedFits", {
              name: nameOf(cardId),
              needed: check.needed,
              have: fitsCount(state, cardId),
            })
          : check.reason === "ALREADY_RETURNED"
            ? t("accuseReturned", { name: nameOf(cardId) })
            : t("accuseUnavailable"),
      );
      return;
    }
    setNotice(null);
    setConfirming(true);
  }

  useHotkeys({ a: ask, l: openMenu });

  const choose = (kind: LinkKind | null): void => {
    if (clueId === null || cardId === null) return;
    setMenu(false);
    setClueId(null);
    void (kind === null ? game.unlink(clueId, cardId) : game.link(clueId, cardId, kind));
  };

  const accuse = async (): Promise<void> => {
    const personId = cardId;
    setConfirming(false);
    if (personId === null) return;
    feedback.fire({ type: "accuse" });
    const outcome = await game.accuse(personId);
    if (!outcome.ok) {
      setNotice(t("accuseUnavailable"));
      return;
    }
    if (outcome.closed) {
      app.outcome.last = outcome;
      leaveCaseTo(router, "reveal", target);
      return;
    }
    setWrong({
      name: nameOf(personId),
      text: wrongNote(def, outcome.state, personId),
      stamps: outcome.stamps,
    });
    setCardId(null);
    setClueId(null);
  };

  const onSelectCard = (id: string): void => {
    setCardId(id);
    setNotice(null);
    if (clueId !== null) setMenu(true);
  };

  const selectedName = cardId === null ? null : nameOf(cardId);

  return (
    <Screen name="board" class="lp-board">
      <Header title={caseTitle(def, isDailyTarget(target))} />
      <p class="lp-sr-only" role="status" aria-live="polite" data-testid="board-live">
        {liveSummary(def, state)}
      </p>
      <section class="lp-pinned" aria-label={t("boardPinned")}>
        <h2 class="lp-section">{t("boardPinned")}</h2>
        <div class="lp-tray__chips" data-navgroup="pinned">
          {pinned.length === 0 ? <p class="lp-empty">{t("boardNoPins")}</p> : null}
          {pinned.map((clue) => {
            return (
              <ClueChip
                key={clue.id}
                clueId={clue.id}
                tag={clue.tag}
                state={chipState(state, clue.id)}
                selected={clueId === clue.id}
                onClick={() => setClueId(clueId === clue.id ? null : clue.id)}
                onAlmanac={() => openAlmanac(router, clue)}
              />
            );
          })}
        </div>
        <p class="lp-subnote">{clueId === null ? t("boardTapClue") : t("boardTapCard")}</p>
      </section>
      <section class="lp-cards" aria-label={t("boardCards")} data-navgroup="cards">
        {def.candidateIds.map((id) => {
          const person = PEOPLE_BY_ID[id];
          const summary = summaries.find((entry) => entry.personId === id);
          if (!person || !summary) return null;
          return (
            <ProfileCard
              key={id}
              person={person}
              fits={summary.fits}
              rulesOut={summary.rulesOut}
              returned={summary.returned}
              selected={cardId === id}
              linking={clueId !== null}
              links={cardLinks(def, state, id)}
              brackets={pairBrackets(def, state, id)}
              onSelect={() => onSelectCard(id)}
            />
          );
        })}
      </section>
      {notice !== null ? (
        <p class="lp-notice" role="status" data-testid="board-notice">
          {notice}
        </p>
      ) : null}
      <div class="lp-actions lp-actions--board">
        <HintControl active={active} />
        <Button
          size="large"
          variant="danger"
          disabled={state.closed}
          onClick={ask}
          class={`lp-accuse${coach === 6 ? " lp-coach-target" : ""}`}
        >
          {selectedName
            ? t("accuseNamed", { name: selectedName.split(" ")[0] ?? selectedName })
            : t("accuse")}
        </Button>
      </div>
      <LinkMenu
        open={menu && clueId !== null && cardId !== null}
        clueTag={clueId ? (clueById(def, clueId)?.tag ?? "") : ""}
        personName={selectedName ?? ""}
        current={clueId && cardId ? linkOf(state, clueId, cardId) : null}
        onChoose={choose}
        onClose={() => setMenu(false)}
      />
      <AccuseConfirm
        open={confirming}
        name={selectedName ?? ""}
        wrongSoFar={state.wrongAccusations}
        onConfirm={() => void accuse()}
        onCancel={() => setConfirming(false)}
      />
      <WrongNote
        open={wrong !== null}
        name={wrong?.name ?? ""}
        note={wrong?.text ?? ""}
        stampsLeft={wrong?.stamps ?? 0}
        onClose={() => setWrong(null)}
      />
    </Screen>
  );
}
