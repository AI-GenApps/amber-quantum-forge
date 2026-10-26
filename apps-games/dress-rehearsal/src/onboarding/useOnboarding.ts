import type { ChallengeDef, RuleCard } from "@web-games/dress-rehearsal-core";
import { useCallback, useEffect, useState } from "preact/hooks";
import { useApp, useProfile } from "../state/app";
import type { Session } from "../state/session";
import { cardFlag, pendingCards } from "./cards";
import {
  finishedTutorial,
  shouldRunTutorial,
  startTutorial,
  stepTutorial,
  TUTORIAL_FLAG,
  type TutorialAction,
  type TutorialState,
  targetsFor,
} from "./tutorial";

export interface Onboarding {
  /** Cards still to show before styling starts, in order; the first is the one on screen. */
  cards: readonly RuleCard[];
  dismissCard: () => void;
  /** Position of the card on screen (1-based) and how many cards this visit shows. */
  cardPosition: number;
  cardTotal: number;
  /** The running tutorial, or null when it is finished, skipped or not for this challenge. */
  tutorial: TutorialState | null;
  targets: string;
  notify: (action: TutorialAction) => void;
}

function challengeOf(session: Session): ChallengeDef | null {
  return session.kind === "campaign" ? session.challenge : null;
}

/** Rule cards and the riv-01 tutorial for one styling session, driven by the saved flags. */
export function useOnboarding(session: Session): Onboarding {
  const app = useApp();
  const profile = useProfile();
  const challengeId = challengeOf(session)?.id ?? null;
  const [dismissed, setDismissed] = useState<readonly RuleCard["id"][]>([]);
  const [tutorial, setTutorial] = useState<TutorialState | null>(() =>
    shouldRunTutorial(profile.flags, challengeId) ? startTutorial() : null,
  );

  const [cardTotal] = useState(() => pendingCards(profile.flags.ruleCards, challengeId).length);
  const cards = pendingCards(profile.flags.ruleCards, challengeId).filter(
    (card) => !dismissed.includes(card.id),
  );

  const dismissCard = useCallback((): void => {
    const first = cards[0];
    if (!first) return;
    setDismissed((current) => [...current, first.id]);
    void app.game.markFlag(cardFlag(first.id));
  }, [app.game, cards]);

  const notify = useCallback((action: TutorialAction): void => {
    setTutorial((current) => (current ? stepTutorial(current, action) : current));
  }, []);

  useEffect(() => {
    if (tutorial && finishedTutorial(tutorial)) void app.game.markFlag(TUTORIAL_FLAG);
  }, [tutorial, app.game]);

  const active = tutorial && !finishedTutorial(tutorial) ? tutorial : null;
  return {
    cards,
    dismissCard,
    cardPosition: Math.max(1, cardTotal - cards.length + 1),
    cardTotal,
    tutorial: active,
    targets: active ? targetsFor(active).join(" ") : "",
    notify,
  };
}
