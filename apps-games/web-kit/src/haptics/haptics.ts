import { Capacitor } from "@capacitor/core";
import {
  Haptics as CapHaptics,
  ImpactStyle as CapImpact,
  NotificationType,
} from "@capacitor/haptics";

export type ImpactStyle = "light" | "medium" | "heavy";
export type NotificationKind = "success" | "warning" | "error";

export interface HapticsDriver {
  readonly name: string;
  impact(style: ImpactStyle): Promise<void> | void;
  notification(kind: NotificationKind): Promise<void> | void;
  selection(): Promise<void> | void;
}

/** The slice of the Capacitor Haptics plugin the driver calls. */
export interface HapticsPlugin {
  impact(options: { style: CapImpact }): Promise<void>;
  notification(options: { type: NotificationType }): Promise<void>;
  selectionStart(): Promise<void>;
  selectionChanged(): Promise<void>;
  selectionEnd(): Promise<void>;
}

/** Web, tests, desktop: nothing happens. */
export const noopDriver: HapticsDriver = {
  name: "noop",
  impact: () => undefined,
  notification: () => undefined,
  selection: () => undefined,
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

export function capacitorDriver(plugin: HapticsPlugin = CapHaptics): HapticsDriver {
  return {
    name: "capacitor",
    impact: (style) => plugin.impact({ style: IMPACT[style] }),
    notification: (kind) => plugin.notification({ type: NOTIFICATION[kind] }),
    selection: () => plugin.selectionChanged(),
  };
}

export interface DriverEnv {
  isNative(): boolean;
  pluginAvailable(): boolean;
}

const realEnv: DriverEnv = {
  isNative: () => Capacitor.isNativePlatform(),
  pluginAvailable: () => Capacitor.isPluginAvailable("Haptics"),
};

/** The Capacitor driver on a device that has the plugin, otherwise the no-op driver. */
export function createDefaultDriver(env: DriverEnv = realEnv): HapticsDriver {
  return env.isNative() && env.pluginAvailable() ? capacitorDriver() : noopDriver;
}

export interface HapticsOptions {
  driver?: HapticsDriver;
  /** Initial on/off state (default on). Wire this to the player's haptics setting. */
  enabled?: boolean;
  /** Called when the driver throws or rejects; haptics never throw into game code. */
  onError?: (error: unknown) => void;
}

export interface Haptics {
  readonly driverName: string;
  enabled: boolean;
  impact(style?: ImpactStyle): void;
  notify(kind: NotificationKind): void;
  selection(): void;
  /** Applies the player's haptics switch (from settings). */
  syncSettings(settings: { haptics: boolean }): void;
}

export function createHaptics(options: HapticsOptions = {}): Haptics {
  const driver = options.driver ?? createDefaultDriver();
  const guard = (call: () => Promise<void> | void): void => {
    try {
      const result = call();
      if (result) result.catch((error: unknown) => options.onError?.(error));
    } catch (error) {
      options.onError?.(error);
    }
  };
  const haptics: Haptics = {
    driverName: driver.name,
    enabled: options.enabled ?? true,
    impact(style = "light") {
      if (haptics.enabled) guard(() => driver.impact(style));
    },
    notify(kind) {
      if (haptics.enabled) guard(() => driver.notification(kind));
    },
    selection() {
      if (haptics.enabled) guard(() => driver.selection());
    },
    syncSettings(settings) {
      haptics.enabled = settings.haptics;
    },
  };
  return haptics;
}
