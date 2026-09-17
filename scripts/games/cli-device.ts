import { selectedApps } from "./cli-commands";
import { parseEnvironment, writeGameConfigs } from "./config";
import type { GameRegistration } from "./registry";
import { appDirectory, capture, flag, requireApp, run } from "./toolchain";
import { generateXcodeProject } from "./xcodegen";

export type PhysicalDeviceStatus =
  | "physical"
  | "emulator"
  | "unsupported"
  | "missing"
  | "unavailable";

export function classifyPhysicalDevice(devices: unknown, deviceId: string): PhysicalDeviceStatus {
  if (!Array.isArray(devices)) return "unavailable";
  const device = devices.find(
    (entry) => entry && typeof entry === "object" && "id" in entry && entry.id === deviceId,
  );
  if (!device || typeof device !== "object") return "missing";
  const targetPlatform = "targetPlatform" in device ? device.targetPlatform : undefined;
  if (
    typeof targetPlatform !== "string" ||
    (!targetPlatform.startsWith("android") && !targetPlatform.startsWith("ios"))
  )
    return "unsupported";
  return "emulator" in device && device.emulator === false ? "physical" : "emulator";
}

function requiredGame(args: string[]): GameRegistration {
  const id = flag(args, "--app");
  if (!id) throw new Error("--app is required for games:run and games:build");
  return selectedApps(args)[0] ?? requireApp(id);
}

function notRun(reason: string): void {
  console.log(`NOT RUN: ${reason}`);
  process.exitCode = 2;
}

function deviceInfo(deviceId: string): { status: PhysicalDeviceStatus; platform?: string } {
  try {
    const devices = JSON.parse(capture("flutter", ["devices", "--machine"]));
    if (!Array.isArray(devices)) return { status: "unavailable" };
    const device = devices.find(
      (entry) => entry && typeof entry === "object" && "id" in entry && entry.id === deviceId,
    );
    const platform =
      device &&
      typeof device === "object" &&
      "targetPlatform" in device &&
      typeof device.targetPlatform === "string"
        ? device.targetPlatform
        : undefined;
    return { status: classifyPhysicalDevice(devices, deviceId), platform };
  } catch {
    return { status: "unavailable" };
  }
}

export function runGame(args: string[]): void {
  const environment = parseEnvironment(flag(args, "--environment") ?? "debug");
  const mode = flag(args, "--mode") ?? "debug";
  if (environment !== "debug") {
    notRun("staging and production runtime identities are not enabled on physical-dev runs.");
    return;
  }
  if (mode !== "debug" && mode !== "profile") {
    notRun(`unsupported physical run mode '${mode}'; use debug or profile.`);
    return;
  }
  const game = requiredGame(args);
  writeGameConfigs(environment);
  const device = flag(args, "--device-id");
  if (!device) {
    notRun("games:run requires --device-id for an explicitly connected physical device.");
    return;
  }
  const info = deviceInfo(device);
  if (info.status === "missing") {
    notRun(`device '${device}' was not found in flutter devices --machine output.`);
    return;
  }
  if (info.status === "unavailable") {
    notRun("Flutter device inventory is unavailable; connect a physical iOS or Android device.");
    return;
  }
  if (info.status === "unsupported") {
    notRun(`device '${device}' is not an iOS or Android target.`);
    return;
  }
  if (info.status === "emulator") {
    notRun(`device '${device}' is an emulator or simulator; only physical devices are allowed.`);
    return;
  }
  if (mode === "profile" && !info.platform?.startsWith("ios")) {
    notRun("profile physical runs currently require an iOS target.");
    return;
  }
  if (info.platform?.startsWith("ios")) {
    if (!process.env.IOS_DEVELOPMENT_TEAM) {
      notRun("physical iOS runs require IOS_DEVELOPMENT_TEAM for local development signing.");
      return;
    }
    generateXcodeProject(appDirectory(game), game.identity.iosBundleId);
  }
  run(
    "flutter",
    [
      "run",
      `--${mode}`,
      "--device-id",
      device,
      "--dart-define",
      `GAME_ENVIRONMENT=${environment}`,
      "--dart-define",
      `APP_VERSION=${game.release.version}`,
    ],
    appDirectory(game),
  );
}
