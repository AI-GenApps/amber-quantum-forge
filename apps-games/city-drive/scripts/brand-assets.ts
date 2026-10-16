import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BRAND_COLOR, BRAND_COLOR_DARK } from "./brand-art/constants";

/**
 * Rebuilds the brand art, then runs @capacitor/assets to write every Android and iOS icon and
 * splash. The tool also reformats AndroidManifest.xml, which this app keeps as Capacitor wrote it,
 * so the manifest is put back byte for byte afterwards.
 * Usage: bun scripts/brand-assets.ts
 */
const appDir = join(import.meta.dirname, "..");
const manifest = join(appDir, "android/app/src/main/AndroidManifest.xml");

function run(command: string, args: string[]): void {
  console.log(`$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd: appDir, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with ${result.status ?? "a signal"}`);
  }
}

const manifestBefore = readFileSync(manifest);
try {
  run("bun", ["scripts/build-brand-art.ts"]);
  run("bunx", [
    "capacitor-assets",
    "generate",
    "--android",
    "--ios",
    "--iconBackgroundColor",
    BRAND_COLOR,
    "--iconBackgroundColorDark",
    BRAND_COLOR,
    "--splashBackgroundColor",
    BRAND_COLOR,
    "--splashBackgroundColorDark",
    BRAND_COLOR_DARK,
  ]);
} finally {
  writeFileSync(manifest, manifestBefore);
}
