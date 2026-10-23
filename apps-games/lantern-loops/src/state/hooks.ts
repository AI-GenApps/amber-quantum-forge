import type { Settings, SettingsStore } from "@web-games/kit";
import { useEffect, useState } from "preact/hooks";
import type { Profile } from "../save/profile";
import type { ProfileListener, Progression } from "../services/progression";
import type { Session, SessionState } from "./session";

/** Re-renders when the session changes. */
export function useSessionState(session: Session): SessionState {
  const [state, setState] = useState<SessionState>(() => session.state());
  useEffect(() => {
    setState(session.state());
    return session.subscribe(setState);
  }, [session]);
  return state;
}

/** Re-renders when the saved profile changes. */
export function useProfile(progression: Progression): Readonly<Profile> {
  const [profile, setProfile] = useState<Readonly<Profile>>(() => progression.current());
  useEffect(() => {
    const listener: ProfileListener = (next) => setProfile(next);
    setProfile(progression.current());
    return progression.subscribe(listener);
  }, [progression]);
  return profile;
}

/** Re-renders when a kit setting changes. */
export function useSettings(store: SettingsStore): Readonly<Settings> {
  const [settings, setSettings] = useState<Readonly<Settings>>(() => store.get());
  useEffect(() => {
    setSettings(store.get());
    return store.subscribe((next) => setSettings(next));
  }, [store]);
  return settings;
}
