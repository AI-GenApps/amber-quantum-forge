import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Non-device guard for the Glow Rescue (merge_relay) release manifest, task 27.
// It reads the checked-in Android sources only: no Gradle, no build, no device.
// The merged-manifest behaviour itself is proven by the production AAB/APK builds
// recorded in .agents/resources/2026-10-16/glow-rescue-release-build/README.md.

const ANDROID = "apps-native/games/merge_relay/android/app";
const read = (path: string): string => readFileSync(join(ANDROID, path), "utf8");

// Strip XML comments so the explanatory comments cannot satisfy or break an assertion.
const manifest = read("src/main/AndroidManifest.xml").replace(/<!--[\s\S]*?-->/g, "");
const gradle = read("build.gradle.kts");

test("static manifest never declares an empty or placeholder Play Games APP_ID", () => {
  expect(manifest).not.toContain("com.google.android.gms.games.APP_ID");
  expect(manifest).not.toContain("mergeRelayPgsApplicationId");
  expect(manifest).not.toMatch(/android:value="\s*"/);
});

test("static manifest never declares an https filter, so no empty-host filter can ship", () => {
  expect(manifest).not.toContain('android:scheme="https"');
  expect(manifest).not.toContain("mergeRelayPublicHost");
  expect(manifest).not.toMatch(/android:host="\s*"/);
  // The game's own non-https custom-scheme filter stays.
  expect(manifest).toContain('android:scheme="mergerelay"');
  expect(manifest).toContain('android:host="challenge"');
});

test("Gradle adds APP_ID and the https filter only for non-blank configured values", () => {
  expect(gradle).toContain("MergeRelayManifestConditionalsTask");
  expect(gradle).toContain("SingleArtifact.MERGED_MANIFEST");
  expect(gradle).toMatch(/if \(pgsApplicationId\.get\(\)\.isNotBlank\(\)\)/);
  expect(gradle).toMatch(/if \(publicHost\.get\(\)\.isNotBlank\(\)\)/);
  expect(gradle).toContain('"com.google.android.gms.games.APP_ID"');
  // A string resource, not a literal: aapt2 stores short numeric literals as integers.
  expect(gradle).toContain("@string/merge_relay_pgs_application_id");
  expect(gradle).toContain('resValue("string", "merge_relay_pgs_application_id"');
  expect(gradle).toMatch(/if \(applicationId\.isNotEmpty\(\)\) \{\s*resValue/);
  // No placeholder can put an empty value back into the manifest.
  expect(gradle).not.toContain('manifestPlaceholders["mergeRelayPgsApplicationId"]');
  expect(gradle).not.toContain('manifestPlaceholders["mergeRelayPublicHost"]');
  // Validation of the configured values is kept.
  expect(gradle).toContain("The Play Games application id must be numeric");
  expect(gradle).toContain("MERGE_RELAY_PUBLIC_ORIGIN must be an HTTPS origin");
});

test("the Play Games SDK stays bundled and its init provider stays removed", () => {
  expect(gradle).toContain("com.google.android.gms:play-services-games-v2:");
  expect(manifest).toMatch(
    /<provider\s+android:name="com\.google\.android\.gms\.games\.provider\.PlayGamesInitProvider"\s+tools:node="remove"/,
  );
});

test("backups are off and the backup rule files exclude every domain", () => {
  expect(manifest).toContain('android:allowBackup="false"');
  expect(manifest).not.toContain('android:allowBackup="true"');
  const full = read("src/main/res/xml/backup_rules.xml");
  const extraction = read("src/main/res/xml/data_extraction_rules.xml");
  for (const domain of ["root", "file", "database", "sharedpref", "external"]) {
    expect(full).toContain(`<exclude domain="${domain}" path="." />`);
    expect(extraction).toContain(`<exclude domain="${domain}" path="." />`);
  }
  expect(extraction).toContain('<exclude domain="device_root" path="." />');
  expect(extraction).toContain('<exclude domain="device_file" path="." />');
  expect(extraction).not.toMatch(/<include\b/);
  expect(full).not.toMatch(/<include\b/);
  // Both transfer paths are covered in the API 31+ rules.
  expect(extraction).toContain("<cloud-backup>");
  expect(extraction).toContain("<device-transfer>");
});

test("the game declares exactly one exported component: MainActivity", () => {
  const exported = [...manifest.matchAll(/android:exported="true"/g)];
  expect(exported).toHaveLength(1);
  const activity = manifest.match(/<activity[\s\S]*?android:exported="true"/)?.[0] ?? "";
  expect(activity).toContain('android:name=".MainActivity"');
  expect(manifest).not.toMatch(/<(service|receiver)\b/);
  // The only <provider> is the SDK init provider being removed, not a new component.
  expect(manifest.match(/<provider\b/g)).toHaveLength(1);
  expect(manifest).not.toContain("com.google.android.gms.permission.AD_ID");
});
