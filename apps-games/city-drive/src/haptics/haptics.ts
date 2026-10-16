import { GAME_TITLE } from "../ui/brand";

/** The moments that buzz. Anything else stays still. */
export type HapticEvent = "collision" | "checkpoint" | "pickup" | "success" | "fail";

export type ImpactStyle = "light" | "medium" | "heavy";
export type NotificationKind = "success" | "warning" | "error";

/** What a platform can do. A driver may reject; the service logs it and carries on. */
export interface HapticsDriver {
  impact(style: ImpactStyle): Promise<void> | void;
  notification(kind: NotificationKind): Promise<void> | void;
}

/** What the game calls. */
export interface HapticsPort {
  trigger(event: HapticEvent): void;
}

/** collision: medium impact; checkpoint and pickup: light; success and fail: notifications. */
export function playEvent(driver: HapticsDriver, event: HapticEvent): Promise<void> | void {
  switch (event) {
    case "collision":
      return driver.impact("medium");
    case "checkpoint":
    case "pickup":
      return driver.impact("light");
    case "success":
      return driver.notification("success");
    case "fail":
      return driver.notification("error");
  }
}

/** Drops events when the player turned vibration off; reports a failing driver once, not per event. */
export class HapticsService implements HapticsPort {
  private reported = false;

  constructor(
    private readonly driver: HapticsDriver,
    private readonly enabled: () => boolean,
  ) {}

  trigger(event: HapticEvent): void {
    if (!this.enabled()) return;
    try {
      const pending = playEvent(this.driver, event);
      if (pending) void pending.catch((error: unknown) => this.report(event, error));
    } catch (error) {
      this.report(event, error);
    }
  }

  private report(event: HapticEvent, error: unknown): void {
    if (this.reported) return;
    this.reported = true;
    console.warn(`${GAME_TITLE}: haptic "${event}" failed; further failures are not logged`, error);
  }
}
