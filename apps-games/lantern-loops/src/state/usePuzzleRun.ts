import type { Brush } from "@web-games/lantern-loops-core";
import { useEffect, useRef, useState } from "preact/hooks";
import type { AppEnv } from "../app/AppContext";
import type { PuzzleSource } from "../app/source";
import { createSession, type Session } from "./session";

/** Builds the session for a puzzle, restoring the autosaved board of campaign and daily runs. */
export function usePuzzleSession(env: AppEnv, source: PuzzleSource, brush: Brush): Session | null {
  const [session, setSession] = useState<Session | null>(null);
  const initialBrush = useRef(brush);
  useEffect(() => {
    let live = true;
    const start = async (): Promise<void> => {
      const saved = source.kind === "tutorial" ? null : await env.services.runs.get(source.key);
      if (!live) return;
      setSession(
        createSession({
          puzzle: source.puzzle,
          solution: source.solution,
          brush: initialBrush.current,
          saved,
        }),
      );
    };
    void start();
    return () => {
      live = false;
    };
  }, [env, source]);
  return session;
}

/** Saves the board after every move and when the app goes to the background or the screen closes. */
export function useAutosave(env: AppEnv, source: PuzzleSource, session: Session | null): void {
  useEffect(() => {
    if (session === null || source.kind === "tutorial") return undefined;
    let last = "";
    const save = (): void => {
      if (session.state().solved) return;
      void env.services.runs.put(session.toRun(source.key), env.services.now().getTime());
    };
    const stop = session.subscribe((state) => {
      const stamp = `${state.moves}:${state.hintCount}`;
      if (stamp === last) return;
      last = stamp;
      save();
    });
    const stopPause = env.lifecycle.onPause(save);
    return () => {
      stop();
      stopPause();
      if (last !== "") save();
    };
  }, [env, source, session]);
}

export const TICK_MS = 250;

/** Counts play time in the session while `running` and the app is in the foreground. */
export function useRunTimer(env: AppEnv, session: Session | null, running: boolean): number {
  const [seconds, setSeconds] = useState(0);
  const away = useRef(false);
  const last = useRef(0);

  useEffect(() => {
    if (session === null) return undefined;
    const offPause = env.lifecycle.onPause(() => {
      away.current = true;
    });
    const offResume = env.lifecycle.onResume(() => {
      away.current = false;
      last.current = env.services.now().getTime();
    });
    return () => {
      offPause();
      offResume();
    };
  }, [env, session]);

  useEffect(() => {
    if (session === null) return undefined;
    setSeconds(Math.floor(session.state().elapsedMs / 1000));
    if (!running) return undefined;
    last.current = env.services.now().getTime();
    const timer = setInterval(() => {
      const now = env.services.now().getTime();
      if (!away.current) {
        session.tick(now - last.current);
        setSeconds(Math.floor(session.state().elapsedMs / 1000));
      }
      last.current = now;
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [env, session, running]);

  return seconds;
}
