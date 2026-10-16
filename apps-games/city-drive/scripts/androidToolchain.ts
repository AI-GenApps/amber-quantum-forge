import { existsSync } from "node:fs";
import { join } from "node:path";

/** Where the Android toolchain lives on this server (the portfolio convention: under /data/tools). */
export const JAVA_HOME = "/data/tools/jdk21";
export const ANDROID_HOME = "/data/tools/android-sdk";

/** What Capacitor 8 / AGP 8.13 compile against. */
export const SDK_PACKAGES = ["platform-tools", "platforms;android-36", "build-tools;36.0.0"];

export const SDKMANAGER = (androidHome: string): string =>
  join(androidHome, "cmdline-tools", "latest", "bin", "sdkmanager");

export interface ToolchainPaths {
  javaHome: string;
  androidHome: string;
}

export type ToolchainProblem =
  /** A tool is not installed. The human installs it (see the docs). */
  | { kind: "missing"; what: string; fix: string }
  /** The SDK licences are not accepted. Only a human may accept them. */
  | { kind: "licences"; fix: string }
  /** Licences are accepted but SDK packages are missing: the script installs these itself. */
  | { kind: "packages"; missing: string[]; fix: string };

const PACKAGE_DIRS: Record<string, string> = {
  "platform-tools": "platform-tools",
  "platforms;android-36": join("platforms", "android-36"),
  "build-tools;36.0.0": join("build-tools", "36.0.0"),
};

/**
 * Checks the toolchain without changing anything. SDK licences are never accepted on the
 * human's behalf: when `licenses/android-sdk-license` is absent the answer is a human command.
 */
export function checkToolchain(
  paths: ToolchainPaths,
  exists: (path: string) => boolean = existsSync,
): ToolchainProblem[] {
  const problems: ToolchainProblem[] = [];
  if (!exists(join(paths.javaHome, "bin", "java"))) {
    problems.push({
      kind: "missing",
      what: `JDK 21 at ${paths.javaHome}`,
      fix: "Install Temurin 21 (see docs-internal/gaming/city-drive-native-build.md).",
    });
  }
  const sdkmanager = SDKMANAGER(paths.androidHome);
  if (!exists(sdkmanager)) {
    problems.push({
      kind: "missing",
      what: `Android command-line tools at ${paths.androidHome}/cmdline-tools/latest`,
      fix: "Install the Android command-line tools (see docs-internal/gaming/city-drive-native-build.md).",
    });
    return problems;
  }
  if (!exists(join(paths.androidHome, "licenses", "android-sdk-license"))) {
    problems.push({
      kind: "licences",
      fix: `JAVA_HOME=${paths.javaHome} ${sdkmanager} --licenses`,
    });
    return problems;
  }
  const missing = SDK_PACKAGES.filter(
    (name) => !exists(join(paths.androidHome, PACKAGE_DIRS[name] ?? name)),
  );
  if (missing.length > 0) {
    problems.push({
      kind: "packages",
      missing,
      fix: `${sdkmanager} ${missing.map((m) => `"${m}"`).join(" ")}`,
    });
  }
  return problems;
}
