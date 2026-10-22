import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import config from "../capacitor.config";
import { GAME_TITLE } from "../src/brand";

const APP_DIR = join(import.meta.dirname, "..");

describe("lantern-loops capacitor config", () => {
  it("identifies the app and serves the bundled build", () => {
    expect(config.appId).toBe("app.w3dev.lanternloops");
    expect(config.appName).toBe(GAME_TITLE);
    expect(config.webDir).toBe("dist");
    expect(config.server?.url).toBeUndefined();
  });

  it("locks portrait at startup through the kit lifecycle", () => {
    const main = readFileSync(join(APP_DIR, "src/main.tsx"), "utf8");
    expect(main).toContain("lockPortrait: true");
  });
});
