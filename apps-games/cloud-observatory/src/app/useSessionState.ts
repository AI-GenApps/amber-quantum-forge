import type { ResumeSummary } from "@web-games/cloud-observatory-core";
import type { Settings } from "@web-games/kit";
import { useEffect, useState } from "preact/hooks";
import type { GameSession } from "../session/game-session";
import type { SessionSnapshot, Toast } from "../session/types";

/** The session snapshot, kept in step with the controller, plus the toasts of each change. */
export function useSessionSnapshot(
  session: GameSession,
  onToasts: (toasts: readonly Toast[]) => void,
): SessionSnapshot {
  const [snapshot, setSnapshot] = useState<SessionSnapshot>(() => session.snapshot());
  useEffect(() => {
    setSnapshot(session.snapshot());
    return session.subscribe((next, toasts) => {
      setSnapshot(next);
      if (toasts.length > 0) onToasts(toasts);
    });
  }, [session, onToasts]);
  return snapshot;
}

export function useSettingsState(session: GameSession): Readonly<Settings> {
  const [settings, setSettings] = useState<Readonly<Settings>>(() => session.settings.get());
  useEffect(() => {
    setSettings(session.settings.get());
    return session.settings.subscribe((next) => setSettings(next));
  }, [session]);
  return settings;
}

export interface Boot {
  readonly ready: boolean;
  readonly welcome: ResumeSummary | null;
}

/** Loads the save once, applies offline progress and reports whether the Welcome Back sheet is due. */
export function useBoot(session: GameSession): [Boot, (welcome: ResumeSummary | null) => void] {
  const [boot, setBoot] = useState<Boot>(() => ({
    ready: session.snapshot().loaded,
    welcome: null,
  }));
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!session.snapshot().loaded) await session.load();
      const summary = session.resume();
      if (!cancelled) {
        setBoot({ ready: true, welcome: summary?.worthShowing ? summary : null });
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [session]);
  return [boot, (welcome) => setBoot((previous) => ({ ...previous, welcome }))];
}
