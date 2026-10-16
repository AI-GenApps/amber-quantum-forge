import { Capacitor } from "@capacitor/core";
import { ImpactStyle as CapImpact, Haptics, NotificationType } from "@capacitor/haptics";
import type { HapticsDriver, ImpactStyle, NotificationKind } from "./haptics";

/** Does nothing: browsers without the Vibration API, tests, desktop. */
export const noopDriver: HapticsDriver = {
  impact: () => undefined,
  notification: () => undefined,
};

const IMPACT: Record<ImpactStyle, CapImpact> = {
  light: CapImpact.Light,
  medium: CapImpact.Medium,
  heavy: CapImpact.Heavy,
};

const NOTIFICATION: Record<NotificationKind, NotificationType> = {
  success: NotificationType.Success,
  warning: NotificationType.Warning,
  error: NotificationType.Error,
};

/** The slice of the Capacitor plugin the driver calls. */
export interface HapticsPlugin {
  impact(options: { style: CapImpact }): Promise<void>;
  notification(options: { type: NotificationType }): Promise<void>;
}

export function capacitorDriver(plugin: HapticsPlugin = Haptics): HapticsDriver {
  return {
    impact: (style) => plugin.impact({ style: IMPACT[style] }),
    notification: (kind) => plugin.notification({ type: NOTIFICATION[kind] }),
  };
}

/** Vibration pattern in milliseconds for each call; `navigator.vibrate` has no strengths. */
export const VIBRATE_MS: Readonly<Record<ImpactStyle | NotificationKind, number | number[]>> = {
  light: 10,
  medium: 25,
  heavy: 45,
  success: [15, 40, 25],
  warning: [30, 40, 30],
  error: [45, 50, 45],
};

export interface VibrateLike {
  vibrate(pattern: number | number[]): boolean;
}

export function vibrationDriver(nav: VibrateLike): HapticsDriver {
  return {
    impact: (style) => void nav.vibrate(VIBRATE_MS[style]),
    notification: (kind) => void nav.vibrate(VIBRATE_MS[kind]),
  };
}

export interface DriverEnv {
  isNative(): boolean;
  navigator(): Partial<VibrateLike> | undefined;
  plugin?: HapticsPlugin;
}

const defaultEnv: DriverEnv = {
  isNative: () => Capacitor.isNativePlatform(),
  navigator: () => (typeof navigator === "undefined" ? undefined : navigator),
};

/** The Capacitor plugin on a device, `navigator.vibrate` in a browser that has it, otherwise a no-op. */
export function createDriver(env: DriverEnv = defaultEnv): HapticsDriver {
  if (env.isNative()) return capacitorDriver(env.plugin);
  const nav = env.navigator();
  if (nav && typeof nav.vibrate === "function") return vibrationDriver(nav as VibrateLike);
  return noopDriver;
}
