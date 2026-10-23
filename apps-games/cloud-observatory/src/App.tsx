import type { ResumeSummary } from "@web-games/cloud-observatory-core";
import {
  createMotion,
  type Lifecycle,
  Screen,
  systemPrefersReducedMotion,
  Toast,
  useBackInterceptor,
  useCurrentScreen,
} from "@web-games/kit";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { AppContext, type AppContextValue } from "./app/context";
import { browserFrames, createGameLoop, type FrameScheduler } from "./app/game-loop";
import { useQueues } from "./app/queues";
import { type AppRouter, createAppRouter, type TabId } from "./app/routes";
import { useBoot, useSessionSnapshot, useSettingsState } from "./app/useSessionState";
import { Btn } from "./components/Btn";
import { ManagedSheet } from "./components/ManagedSheet";
import { AchievementsScreen } from "./screens/AchievementsScreen";
import { ChapterCard } from "./screens/ChapterCard";
import { ChartTable } from "./screens/ChartTable";
import { CometScreen } from "./screens/CometScreen";
import { ECLIPSE_SEQUENCE_MS, EclipseSequence } from "./screens/EclipseSequence";
import { EntryReader } from "./screens/EntryReader";
import { HowToPlay } from "./screens/HowToPlay";
import { SettingsScreen } from "./screens/SettingsScreen";
import { Shell } from "./screens/Shell";
import { StatisticsScreen } from "./screens/StatisticsScreen";
import { TitleScreen } from "./screens/Title";
import { WelcomeBack } from "./screens/WelcomeBack";
import type { GameSession } from "./session/game-session";
import { t } from "./strings";
import { type Feedback, nullFeedback } from "./ui/feedback";
import { applyAppTheme } from "./ui/tokens";

export interface AppProps {
  session: GameSession;
  router?: AppRouter;
  feedback?: Feedback;
  frames?: FrameScheduler;
  lifecycle?: Pick<Lifecycle, "onPause" | "onResume" | "onBack">;
  /** Dev-only game time multiplier from `?devspeed=N`; 1 in production. */
  devSpeed?: number;
  now?: () => number;
  systemReducedMotion?: () => boolean;
  /** Called when the player confirms leaving from the Observe tab. */
  onExit?: () => void;
  eclipseMs?: number;
}

const defaultNow = (): number => Date.now();
const defaultSystemMotion = (): boolean => systemPrefersReducedMotion();

function ScreenSwitch({ router }: { router: AppRouter }) {
  const entry = useCurrentScreen(router);
  switch (entry.name) {
    case "title":
      return <TitleScreen />;
    case "shell":
      return <Shell />;
    case "chart":
      return <ChartTable key={entry.params.id} id={entry.params.id} />;
    case "comet":
      return <CometScreen />;
    case "achievements":
      return <AchievementsScreen />;
    case "statistics":
      return <StatisticsScreen />;
    case "settings":
      return <SettingsScreen />;
    case "howto":
      return <HowToPlay />;
  }
}

export function App(props: AppProps) {
  const { session, lifecycle, onExit } = props;
  const router = useMemo(() => props.router ?? createAppRouter(), [props.router]);
  const feedback = props.feedback ?? nullFeedback;
  const frames = props.frames ?? browserFrames;
  const devSpeed = props.devSpeed ?? 1;
  const now = props.now ?? defaultNow;
  const current = useCurrentScreen(router);

  const [tab, setTab] = useState<TabId>("observe");
  const [readerId, setReaderId] = useState<string | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const [sequence, setSequence] = useState<{ shards: number; eclipses: number } | null>(null);

  const queues = useQueues(useCallback((id) => feedback.sfx(id), [feedback]));
  const snapshot = useSessionSnapshot(session, queues.push);
  const settings = useSettingsState(session);
  const [boot, setWelcome] = useBoot(session);

  const reducedMotion =
    settings.reducedMotion || (props.systemReducedMotion ?? defaultSystemMotion)();
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;
  const motion = useMemo(() => createMotion(() => reducedRef.current), []);

  useEffect(() => {
    applyAppTheme(settings.highContrast);
  }, [settings.highContrast]);

  const onTitle = current.name === "title";
  const onShell = current.name === "shell";
  const active = boot.ready && !onTitle;
  const activeRef = useRef(active);
  activeRef.current = active;

  const loop = useMemo(
    () => createGameLoop({ tick: (dt) => session.tick(dt), frames, speed: devSpeed }),
    [session, frames, devSpeed],
  );
  useEffect(() => {
    if (active) loop.start();
    else loop.pause();
    return () => loop.stop();
  }, [loop, active]);

  useEffect(() => {
    if (!lifecycle) return undefined;
    const offPause = lifecycle.onPause(() => loop.pause());
    const offResume = lifecycle.onResume(() => {
      const summary: ResumeSummary | null = session.resume();
      if (summary?.worthShowing) setWelcome(summary);
      if (activeRef.current) loop.resume();
    });
    return () => {
      offPause();
      offResume();
    };
  }, [lifecycle, loop, session, setWelcome]);

  const backToObserve = useCallback(() => {
    setTab("observe");
    return true;
  }, []);
  useBackInterceptor(router, onShell && tab !== "observe", backToObserve);

  useEffect(() => {
    if (!lifecycle) return undefined;
    return lifecycle.onBack(() => {
      if (router.handleBack()) return true;
      if (router.current.name === "shell") {
        setExitOpen(true);
        return true;
      }
      return false;
    });
  }, [lifecycle, router]);

  const closeSequence = useCallback(() => setSequence(null), []);
  const closeReader = useCallback(() => setReaderId(null), []);
  const closeWelcome = useCallback(() => setWelcome(null), [setWelcome]);
  const closeExit = useCallback(() => setExitOpen(false), []);

  const value: AppContextValue = {
    session,
    router,
    feedback,
    motion,
    snapshot,
    settings,
    reducedMotion,
    tab,
    now,
    setTab,
    openEntry: setReaderId,
    notify: queues.message,
    playEclipse: (shards, eclipses) => setSequence({ shards, eclipses }),
  };

  const leave = async () => {
    setExitOpen(false);
    await session.flush();
    onExit?.();
    router.reset("title");
  };

  return (
    <AppContext.Provider value={value}>
      <div
        class={reducedMotion ? "co-app co-reduced" : "co-app"}
        data-reduced={reducedMotion ? "true" : "false"}
        data-contrast={settings.highContrast ? "high" : "normal"}
      >
        {boot.ready ? (
          <ScreenSwitch router={router} />
        ) : (
          <Screen name="loading" class="co-screen">
            <p role="status">{t("loading.text")}</p>
          </Screen>
        )}
        {devSpeed > 1 ? (
          <p class="co-dev" data-dev-speed={devSpeed}>
            {t("dev.speed", { n: devSpeed })}
          </p>
        ) : null}
        <EntryReader entryId={readerId} onClose={closeReader} />
        <WelcomeBack summary={onShell ? boot.welcome : null} onClose={closeWelcome} />
        <ChapterCard chapter={queues.chapter} onClose={queues.dismissChapter} />
        {sequence ? (
          <EclipseSequence
            shards={sequence.shards}
            eclipses={sequence.eclipses}
            durationMs={props.eclipseMs ?? ECLIPSE_SEQUENCE_MS}
            onDone={closeSequence}
          />
        ) : null}
        <ManagedSheet open={exitOpen} variant="modal" title={t("exit.title")} onClose={closeExit}>
          <div class="co-stack" data-sheet="exit">
            <p>{t("exit.body")}</p>
            <Btn fullWidth variant="secondary" onClick={closeExit}>
              {t("exit.stay")}
            </Btn>
            <Btn fullWidth onClick={leave}>
              {t("exit.leave")}
            </Btn>
          </div>
        </ManagedSheet>
        {queues.toast ? (
          <Toast
            key={queues.toast.id}
            message={queues.toast.message}
            tone={queues.toast.tone}
            onDismiss={queues.dismissToast}
          />
        ) : null}
      </div>
    </AppContext.Provider>
  );
}
