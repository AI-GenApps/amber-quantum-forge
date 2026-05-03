export type { AnalyticsEvent } from "./events";

export function track(_event: import("./events").AnalyticsEvent): void {
  // no-op stub — platform-specific implementation injected at runtime
}
