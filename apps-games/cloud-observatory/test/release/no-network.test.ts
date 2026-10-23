import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APP, CORE, readText, walk } from "./paths";

const SOURCE_FILE = /\.(ts|tsx|js|jsx|css|html)$/;

const FORBIDDEN: readonly { readonly label: string; readonly pattern: RegExp }[] = [
  { label: "fetch(", pattern: /\bfetch\s*\(/ },
  { label: "XMLHttpRequest", pattern: /XMLHttpRequest/ },
  { label: "WebSocket", pattern: /WebSocket/ },
  { label: "EventSource", pattern: /EventSource/ },
  { label: "sendBeacon", pattern: /sendBeacon/ },
  { label: "importScripts", pattern: /importScripts/ },
  { label: "CapacitorHttp", pattern: /CapacitorHttp|@capacitor\/http/ },
  { label: "remote URL", pattern: /\bhttps?:\/\//i },
  { label: "gtag", pattern: /\bgtag\b|google-analytics|googletagmanager/i },
  { label: "firebase", pattern: /firebase/i },
  { label: "adsbygoogle", pattern: /adsbygoogle/i },
  { label: "admob", pattern: /admob|google-mobile-ads/i },
  { label: "appsflyer", pattern: /appsflyer/i },
];

/** URLs that are identifiers and never requested, for example the SVG namespace. */
const URL_ALLOWLIST: readonly string[] = [
  "http://www.w3.org/2000/svg",
  "http://www.w3.org/1999/xlink",
];

const TRACKER_PACKAGES =
  /firebase|analytics|admob|ads|appsflyer|adjust|sentry|posthog|mixpanel|amplitude|segment|branch|onesignal|revenuecat|crashlytics|bugsnag|datadog|facebook|applovin|unity-ads|ironsource/i;

interface Hit {
  readonly file: string;
  readonly label: string;
  readonly line: number;
}

function scan(root: string): { files: number; hits: Hit[] } {
  const files = walk(join(root, "src")).filter((file) => SOURCE_FILE.test(file));
  const hits: Hit[] = [];
  for (const file of files) {
    const lines = readText(file).split("\n");
    lines.forEach((text, index) => {
      for (const rule of FORBIDDEN) {
        if (!rule.pattern.test(text)) continue;
        if (rule.label === "remote URL" && URL_ALLOWLIST.some((url) => text.includes(url))) {
          const rest = text.replaceAll(/https?:\/\/\S+/g, (url) =>
            URL_ALLOWLIST.some((allowed) => url.startsWith(allowed)) ? "" : url,
          );
          if (!/https?:\/\//.test(rest)) continue;
        }
        hits.push({ file: file.slice(root.length + 1), label: rule.label, line: index + 1 });
      }
    });
  }
  return { files: files.length, hits };
}

describe("no network and no data collection (source audit)", () => {
  for (const [name, root] of [
    ["app", APP],
    ["core", CORE],
  ] as const) {
    it(`${name} src contains no network API, remote URL, analytics or ad SDK name`, () => {
      const { files, hits } = scan(root);
      console.info(
        `no-network ${name}: scanned ${files} source files for ${FORBIDDEN.length} patterns, ${hits.length} hits`,
      );
      expect(files).toBeGreaterThan(10);
      expect(hits).toEqual([]);
    });
  }

  it("the audit patterns really detect each forbidden token", () => {
    const samples: Record<string, string> = {
      "fetch(": "await fetch('/x')",
      XMLHttpRequest: "new XMLHttpRequest()",
      WebSocket: "new WebSocket(u)",
      EventSource: "new EventSource(u)",
      sendBeacon: "navigator.sendBeacon(u)",
      importScripts: "importScripts('a.js')",
      CapacitorHttp: "CapacitorHttp.get()",
      "remote URL": "const u = 'https://example.com/a'",
      gtag: "gtag('event')",
      firebase: "import 'firebase/app'",
      adsbygoogle: "(window.adsbygoogle || []).push()",
      admob: "AdMob.initialize()",
      appsflyer: "AppsFlyer.start()",
    };
    for (const rule of FORBIDDEN) {
      expect(rule.pattern.test(samples[rule.label] ?? ""), rule.label).toBe(true);
    }
  });

  it("neither package.json depends on a tracker, ad or analytics package", () => {
    for (const root of [APP, CORE]) {
      const manifest = JSON.parse(readText(join(root, "package.json"))) as Record<string, unknown>;
      const names = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]
        .flatMap((key) => Object.keys((manifest[key] as Record<string, string> | undefined) ?? {}))
        .sort();
      expect(names.length).toBeGreaterThan(0);
      expect(
        names.filter((name) => TRACKER_PACKAGES.test(name)),
        root,
      ).toEqual([]);
    }
  });

  it("the shipped Capacitor plugins are the six local ones", () => {
    const manifest = JSON.parse(readText(join(APP, "package.json"))) as {
      dependencies: Record<string, string>;
    };
    const capacitor = Object.keys(manifest.dependencies)
      .filter((name) => name.startsWith("@capacitor/"))
      .sort();
    expect(capacitor).toEqual([
      "@capacitor/android",
      "@capacitor/app",
      "@capacitor/core",
      "@capacitor/haptics",
      "@capacitor/ios",
      "@capacitor/preferences",
      "@capacitor/screen-orientation",
      "@capacitor/share",
      "@capacitor/status-bar",
    ]);
  });

  it("the audio base URL is app-relative", async () => {
    const { AUDIO_BASE } = await import("../../src/audio/cues");
    expect(AUDIO_BASE.startsWith("/")).toBe(true);
    expect(AUDIO_BASE).not.toMatch(/^[a-z]+:/i);
  });
});
