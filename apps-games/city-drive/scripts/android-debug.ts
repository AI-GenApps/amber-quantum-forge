import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  ANDROID_HOME,
  checkToolchain,
  JAVA_HOME,
  SDK_PACKAGES,
  SDKMANAGER,
} from "./androidToolchain";

/**
 * Builds the unsigned debug APK: web build, `cap sync android`, then `./gradlew assembleDebug`
 * with JAVA_HOME and ANDROID_HOME pointing at /data/tools. Never accepts SDK licences: when they
 * are missing it prints the command for the human and exits 2.
 * Usage: bun scripts/android-debug.ts
 */
const appDir = join(import.meta.dirname, "..");
const env: NodeJS.ProcessEnv = {
  ...process.env,
  JAVA_HOME,
  ANDROID_HOME,
  ANDROID_SDK_ROOT: ANDROID_HOME,
  // Keep the generated debug keystore and AVD data off the small root disk.
  ANDROID_USER_HOME: "/data/tools/cache/android",
  PATH: `${join(JAVA_HOME, "bin")}:${process.env.PATH ?? ""}`,
};

function run(command: string, args: string[], cwd: string): void {
  console.log(`$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`android-debug: "${command} ${args.join(" ")}" exited ${result.status}`);
  }
}

const problems = checkToolchain({ javaHome: JAVA_HOME, androidHome: ANDROID_HOME });
for (const problem of problems) {
  if (problem.kind === "missing") {
    console.error(`android-debug: missing ${problem.what}. ${problem.fix}`);
  } else if (problem.kind === "licences") {
    console.error(
      `android-debug: the Android SDK licences are not accepted. A human must run this in a terminal:\n  ${problem.fix}`,
    );
  }
}
if (problems.some((p) => p.kind === "missing" || p.kind === "licences")) process.exit(2);

if (problems.some((p) => p.kind === "packages")) {
  // Licences are accepted, so installing the named packages needs no prompt.
  run(SDKMANAGER(ANDROID_HOME), [...SDK_PACKAGES], appDir);
}

run("bunx", ["vite", "build"], appDir);
run("bunx", ["cap", "sync", "android"], appDir);
run("./gradlew", ["assembleDebug"], join(appDir, "android"));

const apk = join(appDir, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");
if (!existsSync(apk)) throw new Error(`android-debug: gradle finished but ${apk} does not exist`);
console.log(`APK: ${apk}`);
console.log(`Size: ${statSync(apk).size} bytes`);
