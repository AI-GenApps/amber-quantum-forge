import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ANDROID_DIR, APP_DIR } from "./paths";

const FORBIDDEN =
  /(\.jks|\.keystore|\.p12|\.mobileprovision)$|^(local\.properties|GoogleService-Info\.plist|google-services\.json|keystore\.properties)$/;

/** Every file under android/ and ios/ that git tracks or would add (ignored build output excluded). */
function committable(): string[] {
  const out = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "--", "android", "ios"],
    { cwd: APP_DIR, encoding: "utf8" },
  );
  return out.split("\n").filter(Boolean);
}

describe("native projects hold no secrets", () => {
  it("has no keystore, signing, local or Firebase file that git would commit", () => {
    const offenders = committable().filter((path) => FORBIDDEN.test(path.split("/").pop() ?? ""));
    expect(offenders).toEqual([]);
  });

  it("covers the project with files at all", () => {
    expect(committable().length).toBeGreaterThan(50);
  });

  it("ignores local.properties and keystores through the generated android/.gitignore", () => {
    const ignore = readFileSync(join(ANDROID_DIR, ".gitignore"), "utf8");
    expect(ignore).toMatch(/^local\.properties$/m);
    expect(ignore).toMatch(/^\*\.jks$/m);
    expect(ignore).toMatch(/^\*\.keystore$/m);
  });

  it("declares no signing config in the app gradle file", () => {
    const gradle = readFileSync(join(ANDROID_DIR, "app/build.gradle"), "utf8");
    expect(gradle).not.toMatch(/signingConfigs|storeFile|storePassword|keyPassword/);
  });
});
