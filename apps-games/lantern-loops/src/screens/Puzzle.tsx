import { Button, IconButton, localDateKey, Screen, Toast, useToast } from "@web-games/kit";
import { type Brush, formatDuration, pickHint } from "@web-games/lantern-loops-core";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { useApp } from "../app/AppContext";
import { type PuzzleSource, resolveSource } from "../app/source";
import { layoutBoard } from "../board/layout";
import { computeMarks } from "../board/marks";
import { PlayBoard } from "../board/PlayBoard";
import { playWinSequence, winTimeline } from "../board/winSequence";
import { Backdrop } from "../components/Backdrop";
import {
  CornerIcon,
  EmberIcon,
  EraseIcon,
  PauseIcon,
  RedoIcon,
  RestartIcon,
  StraightIcon,
  UndoIcon,
} from "../components/icons";
import { finishEvents, winEvent } from "../feedback/derive";
import { useBoardFeedback } from "../feedback/useBoardFeedback";
import { CoachCards, useCoachCard } from "../onboarding/CoachCards";
import { completes, highlightCells, reduce, routeFor, stateForPuzzle } from "../onboarding/machine";
import { finishOnboarding, TutorialBanner } from "../onboarding/Onboarding";
import { ConfirmSheet } from "../overlays/ConfirmSheet";
import { HintSheet } from "../overlays/HintSheet";
import { PauseSheet } from "../overlays/PauseSheet";
import { UnlockCelebration } from "../overlays/UnlockCelebration";
import { WinSheet } from "../overlays/WinSheet";
import { finishRun, type WinSummary } from "../state/finish";
import { useProfile, useSessionState, useSettings } from "../state/hooks";
import type { Session } from "../state/session";
import { useAutosave, usePuzzleSession, useRunTimer } from "../state/usePuzzleRun";
import { t } from "../strings";

type Overlay = "pause" | "restart" | "hint" | null;

const BRUSHES: ReadonlyArray<{
  brush: Brush;
  label: () => string;
  Icon: () => preact.JSX.Element;
}> = [
  { brush: "straight", label: () => t("puzzle.brushStraight"), Icon: StraightIcon },
  { brush: "corner", label: () => t("puzzle.brushCorner"), Icon: CornerIcon },
  { brush: "erase", label: () => t("puzzle.brushErase"), Icon: EraseIcon },
];

const readViewport = (): { w: number; h: number } => ({
  w: window.innerWidth,
  h: window.innerHeight,
});

function useViewport(): { w: number; h: number } {
  const [size, setSize] = useState(readViewport);
  useEffect(() => {
    const onResize = (): void => setSize(readViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

export function PuzzleScreen({ id }: { id: string }) {
  const { services } = useApp();
  const today = localDateKey(services.now());
  const source = useMemo(() => resolveSource(id, today), [id, today]);
  const [attempt, setAttempt] = useState(0);
  if (source === null) return <NotFound />;
  return (
    <PuzzleRun
      key={`${source.key}:${attempt}`}
      source={source}
      onReplay={() => setAttempt((n) => n + 1)}
    />
  );
}

function NotFound() {
  const { router } = useApp();
  return (
    <Screen name="puzzle" class="ll-screen">
      <p class="ll-body">{t("puzzle.unknown")}</p>
      <Button onClick={() => router.pop()}>{t("common.back")}</Button>
    </Screen>
  );
}

function PuzzleRun({ source, onReplay }: { source: PuzzleSource; onReplay: () => void }) {
  const env = useApp();
  const profile = useProfile(env.services.progression);
  const session = usePuzzleSession(env, source, profile.brush);
  useAutosave(env, source, session);
  if (session === null) {
    return (
      <Screen name="puzzle" class="ll-screen">
        {source.chapter ? <Backdrop chapter={source.chapter} /> : null}
      </Screen>
    );
  }
  return <PuzzlePlay source={source} session={session} onReplay={onReplay} />;
}

interface PlayProps {
  source: PuzzleSource;
  session: Session;
  onReplay: () => void;
}

function PuzzlePlay({ source, session, onReplay }: PlayProps) {
  const env = useApp();
  const { router, services } = env;
  const profile = useProfile(services.progression);
  const settings = useSettings(services.settings);
  const state = useSessionState(session);
  const toast = useToast();
  const viewport = useViewport();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [summary, setSummary] = useState<WinSummary | null>(null);
  const [pending, setPending] = useState<WinSummary | null>(null);
  const [coach, dismissCoach] = useCoachCard(source.key);
  const boardRef = useRef<HTMLDivElement>(null);
  const finishing = useRef(false);

  const tutorial = source.kind === "tutorial";
  const celebrating = pending !== null && pending.chaptersUnlocked.length > 0;
  const running =
    overlay === null && coach === null && !state.solved && summary === null && !celebrating;
  const seconds = useRunTimer(env, session, running);
  const cellPx = layoutBoard(viewport.w, viewport.h, source.puzzle.size).cell;

  useBoardFeedback(env.feedback, session, profile.showConflicts);

  useEffect(() => {
    env.feedback.setBoard(boardRef.current);
    return () => env.feedback.setBoard(null);
  }, [env.feedback]);

  useEffect(() => {
    if (!state.solved || finishing.current) return;
    finishing.current = true;
    env.feedback.emit(winEvent(state.hintCount));
    const run = async (): Promise<void> => {
      const marks = computeMarks(source.puzzle, state.tiles, state.evaluation, false);
      const timeline = winTimeline(marks.litLoops, env.motion.reduced);
      const root = boardRef.current;
      try {
        const [result] = await Promise.all([
          finishRun(env, source, state),
          root ? playWinSequence(root, timeline, env.motion) : Promise.resolve(),
        ]);
        if (result.kind === "tutorial") {
          const before = stateForPuzzle(source.key);
          if (completes(before, reduce(before, "solved"))) {
            await finishOnboarding(services.progression);
          }
        }
        for (const event of finishEvents(result)) env.feedback.emit(event);
        if (result.tokensCapped) toast.show(t("toast.tokenCap"));
        else if (result.events.some((event) => event.kind === "freeze-used"))
          toast.show(t("toast.freeze"));
        setPending(result);
        if (result.chaptersUnlocked.length === 0) setSummary(result);
      } catch {
        toast.show(t("error.title"), "danger");
      }
    };
    void run();
  }, [state, env, source, services, toast]);

  const goHome = (): void => {
    if (!router.popTo("home")) router.reset("home");
  };

  const chooseBrush = (brush: Brush): void => {
    session.setBrush(brush);
    void services.progression.patch({ brush });
  };

  const requestHint = (): void => {
    if (state.solved) return;
    if (tutorial) toast.show(t("hint.unavailable"));
    else setOverlay("hint");
  };

  const confirmHint = async (): Promise<void> => {
    setOverlay(null);
    const hint = pickHint(source.puzzle, state.tiles, source.solution, state.locked);
    if (hint === null) {
      toast.show(t("hint.done"));
      return;
    }
    const spent = await services.progression.spendHint();
    if (!spent.ok) {
      toast.show(t("toast.noToken"));
      return;
    }
    session.placeHint(hint);
    toast.show(t("hint.placed"), "success");
  };

  const share = async (): Promise<void> => {
    if (summary?.shareText == null) return;
    const result = await env.share({ text: summary.shareText });
    if (result.cancelled) return;
    if (!result.ok) toast.show(t("win.shareFailed"), "danger");
    else toast.show(result.path === "clipboard" ? t("win.copied") : t("win.shared"), "success");
  };

  const next = (): void => {
    if (tutorial) {
      const route = routeFor(reduce(stateForPuzzle(source.key), "solved"));
      if (route.name === "puzzle") router.replace("puzzle", { id: route.id });
      else goHome();
    } else if (summary?.nextId) router.replace("puzzle", { id: summary.nextId });
    else goHome();
  };

  const skipTutorial = (): void => {
    const before = stateForPuzzle(source.key);
    if (completes(before, reduce(before, "skip"))) void finishOnboarding(services.progression);
    router.reset("home");
  };

  const targets = useMemo(
    () => (tutorial ? highlightCells(source.puzzle) : []),
    [tutorial, source.puzzle],
  );

  return (
    <Screen name="puzzle" class="ll-screen ll-puzzle">
      {source.chapter ? <Backdrop chapter={source.chapter} /> : null}
      <header class="ll-hud">
        <IconButton label={t("puzzle.pause")} onClick={() => setOverlay("pause")}>
          <PauseIcon />
        </IconButton>
        <div class="ll-hud-title">
          <h1 class="ll-title">{source.title}</h1>
          <span class="ll-hud-sub">{source.subtitle}</span>
        </div>
        {profile.showTimer ? (
          <span
            class="ll-timer"
            data-testid="timer"
            role="timer"
            aria-label={t("puzzle.timer", { time: formatDuration(seconds) })}
          >
            {formatDuration(seconds)}
          </span>
        ) : null}
        <IconButton
          label={t("puzzle.hintCount", { count: profile.tokens })}
          variant="secondary"
          class="ll-hint-btn"
          disabled={state.solved}
          onClick={requestHint}
        >
          <EmberIcon />
          <span class="ll-hint-count">{profile.tokens}</span>
        </IconButton>
      </header>
      {tutorial ? (
        <TutorialBanner step={stateForPuzzle(source.key).step} onSkip={skipTutorial} />
      ) : null}
      <div class="ll-board-area" ref={boardRef}>
        <PlayBoard
          session={session}
          showConflicts={profile.showConflicts}
          highContrast={settings.highContrast}
          cellPx={cellPx}
          highlight={targets}
          disabled={overlay !== null || coach !== null}
          onCommand={(command) => (command === "hint" ? requestHint() : setOverlay("pause"))}
        />
      </div>
      <div class="ll-toolbar">
        <div class="ll-brushes" role="radiogroup" aria-label={t("puzzle.brush")}>
          {BRUSHES.map(({ brush, label, Icon }) => (
            // biome-ignore lint/a11y/useSemanticElements: a styled button group is the radio pattern used by the toolbar
            <button
              key={brush}
              type="button"
              role="radio"
              class="wg-btn wg-btn--secondary ll-brush"
              aria-checked={state.brush === brush}
              data-brush={brush}
              onClick={() => chooseBrush(brush)}
            >
              <Icon />
              <span>{label()}</span>
            </button>
          ))}
        </div>
        <div class="ll-tools">
          <IconButton
            label={t("puzzle.undo")}
            variant="secondary"
            disabled={!state.canUndo}
            onClick={() => session.undo()}
          >
            <UndoIcon />
          </IconButton>
          <IconButton
            label={t("puzzle.redo")}
            variant="secondary"
            disabled={!state.canRedo}
            onClick={() => session.redo()}
          >
            <RedoIcon />
          </IconButton>
          <IconButton
            label={t("puzzle.restart")}
            variant="secondary"
            disabled={state.clearable === 0 || state.solved}
            onClick={() => setOverlay("restart")}
          >
            <RestartIcon />
          </IconButton>
        </div>
      </div>
      <PauseSheet
        open={overlay === "pause"}
        canRestart={state.clearable > 0}
        onResume={() => setOverlay(null)}
        onRestart={() => setOverlay("restart")}
        onHowTo={() => {
          setOverlay(null);
          router.push("howto", { page: "basics" });
        }}
        onSettings={() => {
          setOverlay(null);
          router.push("settings");
        }}
        onLeave={() => {
          setOverlay(null);
          router.pop();
        }}
      />
      <ConfirmSheet
        open={overlay === "restart"}
        title={t("restart.title")}
        body={t("restart.body")}
        confirmLabel={t("restart.confirm")}
        danger
        onCancel={() => setOverlay(null)}
        onConfirm={() => {
          session.restart();
          setOverlay(null);
        }}
      />
      <HintSheet
        open={overlay === "hint"}
        tokens={profile.tokens}
        onCancel={() => setOverlay(null)}
        onConfirm={() => void confirmHint()}
      />
      <CoachCards kind={coach} onDismiss={dismissCoach} />
      <UnlockCelebration
        chapters={celebrating && summary === null ? (pending?.chaptersUnlocked ?? []) : []}
        onContinue={() => setSummary(pending)}
      />
      <WinSheet
        summary={summary}
        onNext={next}
        onReplay={onReplay}
        onShare={() => void share()}
        onHome={goHome}
      />
      {toast.toast ? (
        <Toast
          key={toast.toast.id}
          message={toast.toast.message}
          tone={toast.toast.tone}
          onDismiss={toast.dismiss}
        />
      ) : null}
    </Screen>
  );
}
