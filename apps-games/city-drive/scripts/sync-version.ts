import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gameById } from "../../../scripts/games/registry";
import { patchAll, versionDrift } from "./syncVersion";

/**
 * Copies the registry release (`city_drive`: version, buildNumber) into the native projects:
 * Android versionName / versionCode and iOS MARKETING_VERSION / CURRENT_PROJECT_VERSION.
 * Usage: bun scripts/sync-version.ts [--check]   (--check changes nothing and exits 1 on drift)
 */
const appDir = join(import.meta.dirname, "..");
const paths = {
  gradle: join(appDir, "android/app/build.gradle"),
  pbxproj: join(appDir, "ios/App/App.xcodeproj/project.pbxproj"),
};
const game = gameById("city_drive");
if (!game) throw new Error("sync-version: city_drive is not in the games registry");
const { version, buildNumber } = game.release;
const release = { version, buildNumber };
const current = {
  gradle: readFileSync(paths.gradle, "utf8"),
  pbxproj: readFileSync(paths.pbxproj, "utf8"),
};

if (process.argv.includes("--check")) {
  const drift = versionDrift(current, release);
  for (const line of drift) console.error(`sync-version: ${line}`);
  if (drift.length > 0) process.exit(1);
  console.log(`sync-version: native projects match ${version} (${buildNumber})`);
} else {
  const next = patchAll(current, release);
  writeFileSync(paths.gradle, next.gradle);
  writeFileSync(paths.pbxproj, next.pbxproj);
  console.log(`sync-version: wrote ${version} (${buildNumber}) to Android and iOS`);
}
