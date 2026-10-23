import type { MechanicCard } from "@web-games/floodplain-dispatch-core";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { CellPos } from "../board/geometry";
import type { Tool } from "../session/tools";
import type { SessionSource } from "../session/types";
import { useApp, useProfile } from "../state/app";
import { cardFlag, pendingCard } from "./cards";
import {
  canalConnected,
  finishedTutorial,
  highlightFor,
  startTutorial,
  stepTutorial,
  TUTORIAL_FLAG,
  TUTORIAL_MAP,
  type TutorialAction,
  type TutorialHighlight,
  type TutorialState,
} from "./tutorial";

export interface OnboardingInput {
  tool: Tool;
  placements: Parameters<typeof canalConnected>[1];
  phase: "plan" | "playback";
  houseCells: readonly CellPos[];
  inletCells: readonly CellPos[];
}

export interface Onboarding {
  card: MechanicCard | null;
  dismissCard: () => void;
  /** Present while the tutorial is running and no card is in the way. */
  tutorial: TutorialState | null;
  highlight: TutorialHighlight;
  highlightCells: CellPos[];
  notify: (action: TutorialAction) => void;
  skip: () => void;
}

const NO_HIGHLIGHT = highlightFor({ status: "done", step: 5 });

export function useOnboarding(source: SessionSource, input: OnboardingInput): Onboarding {
  const app = useApp();
  const profile = useProfile();
  const mapId = source.kind === "campaign" ? source.mapId : undefined;
  const [cardDone, setCardDone] = useState(false);
  const [tutorial, setTutorial] = useState<TutorialState | null>(() =>
    mapId === TUTORIAL_MAP && profile.flags[TUTORIAL_FLAG] !== true ? startTutorial() : null,
  );
  const card = cardDone ? null : pendingCard(profile.flags, mapId);

  const notify = useCallback((action: TutorialAction): void => {
    setTutorial((current) => (current ? stepTutorial(current, action) : current));
  }, []);

  const dismissCard = useCallback((): void => {
    const current = pendingCard(app.game.getState().profile.flags, mapId);
    setCardDone(true);
    if (current) void app.game.markFlag(cardFlag(current.id));
  }, [app.game, mapId]);

  const lastTool = useRef(input.tool);
  useEffect(() => {
    if (input.tool !== lastTool.current) notify({ type: "tool", tool: input.tool });
    lastTool.current = input.tool;
  }, [input.tool, notify]);

  useEffect(() => {
    if (tutorial?.status === "active" && tutorial.step === 3) {
      notify({ type: "plan", connected: canalConnected(source.def, input.placements) });
    }
  }, [tutorial, input.placements, source.def, notify]);

  useEffect(() => {
    if (input.phase === "playback") notify({ type: "run" });
  }, [input.phase, notify]);

  useEffect(() => {
    if (tutorial && finishedTutorial(tutorial)) void app.game.markFlag(TUTORIAL_FLAG);
  }, [tutorial, app.game]);

  const active = tutorial && !finishedTutorial(tutorial) && !card ? tutorial : null;
  const highlight = active ? highlightFor(active) : NO_HIGHLIGHT;
  const highlightCells = useMemo(() => {
    const cells: CellPos[] = [];
    if (highlight.inlet) cells.push(...input.inletCells);
    if (highlight.houses) cells.push(...input.houseCells);
    return cells;
  }, [highlight.inlet, highlight.houses, input.inletCells, input.houseCells]);

  return {
    card,
    dismissCard,
    tutorial: active,
    highlight,
    highlightCells,
    notify,
    skip: useCallback(() => notify({ type: "skip" }), [notify]),
  };
}
