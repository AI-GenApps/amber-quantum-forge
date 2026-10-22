import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";

export interface ShareContent {
  title?: string;
  text?: string;
  url?: string;
}

export type SharePath = "capacitor" | "navigator" | "clipboard" | "unavailable";

export interface ShareResult {
  /** Which route handled (or last attempted) the share. */
  path: SharePath;
  /** True when the content was handed to the OS share sheet or copied. */
  ok: boolean;
  /** True when the player closed the share sheet without sharing. */
  cancelled: boolean;
}

export interface CapacitorShareLike {
  canShare(): Promise<{ value: boolean }>;
  share(options: {
    title?: string;
    text?: string;
    url?: string;
    dialogTitle?: string;
  }): Promise<unknown>;
}

export interface NavigatorShareLike {
  share?: (data: ShareContent) => Promise<void>;
  canShare?: (data: ShareContent) => boolean;
  clipboard?: { writeText(text: string): Promise<void> };
}

export interface ShareEnv {
  /** Plugin to use on a device, or null/undefined to skip the native route. */
  capacitor?: CapacitorShareLike | null;
  navigator?: NavigatorShareLike | undefined;
}

export function defaultShareEnv(): ShareEnv {
  return {
    capacitor: Capacitor.isNativePlatform() ? Share : null,
    navigator: globalThis.navigator as NavigatorShareLike | undefined,
  };
}

const isCancel = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) return false;
  const { name, message } = error as { name?: unknown; message?: unknown };
  return name === "AbortError" || (typeof message === "string" && /cancel/i.test(message));
};

/** The text placed on the clipboard when no share sheet exists. */
export function clipboardText(content: ShareContent): string {
  return [content.text, content.url].filter((part): part is string => !!part).join(" ");
}

/**
 * Shares through, in order, the Capacitor plugin, `navigator.share`, then the clipboard.
 * Returns the route used; never throws.
 */
export async function shareContent(
  content: ShareContent,
  env: ShareEnv = defaultShareEnv(),
): Promise<ShareResult> {
  const plugin = env.capacitor;
  if (plugin) {
    try {
      if ((await plugin.canShare()).value) {
        await plugin.share({ ...content, dialogTitle: content.title ?? "Share" });
        return { path: "capacitor", ok: true, cancelled: false };
      }
    } catch (error) {
      if (isCancel(error)) return { path: "capacitor", ok: false, cancelled: true };
    }
  }

  const nav = env.navigator;
  if (nav && typeof nav.share === "function") {
    try {
      if (!nav.canShare || nav.canShare(content)) {
        await nav.share(content);
        return { path: "navigator", ok: true, cancelled: false };
      }
    } catch (error) {
      if (isCancel(error)) return { path: "navigator", ok: false, cancelled: true };
    }
  }

  const text = clipboardText(content);
  if (nav?.clipboard && text) {
    try {
      await nav.clipboard.writeText(text);
      return { path: "clipboard", ok: true, cancelled: false };
    } catch {
      // Fall through to unavailable.
    }
  }
  return { path: "unavailable", ok: false, cancelled: false };
}
