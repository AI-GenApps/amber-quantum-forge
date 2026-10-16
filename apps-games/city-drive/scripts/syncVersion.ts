export type Release = { version: string; buildNumber: number };

export type VersionFiles = { gradle: string; pbxproj: string };

const GRADLE_CODE = /^(\s*)versionCode\s+\d+\s*$/gm;
const GRADLE_NAME = /^(\s*)versionName\s+"[^"]*"\s*$/gm;
const PBX_MARKETING = /^(\s*)MARKETING_VERSION = [^;]+;\s*$/gm;
const PBX_BUILD = /^(\s*)CURRENT_PROJECT_VERSION = [^;]+;\s*$/gm;

export function assertRelease(release: Release): void {
  if (!/^\d+\.\d+\.\d+$/.test(release.version)) {
    throw new Error(`sync-version: release version "${release.version}" is not x.y.z`);
  }
  if (!Number.isInteger(release.buildNumber) || release.buildNumber < 1) {
    throw new Error(`sync-version: build number ${release.buildNumber} is not an integer >= 1`);
  }
}

function replaceAll(text: string, pattern: RegExp, line: (indent: string) => string): string {
  let count = 0;
  const out = text.replace(pattern, (_whole, indent: string) => {
    count += 1;
    return line(indent);
  });
  if (count === 0)
    throw new Error(`sync-version: no match for ${pattern} (project layout changed?)`);
  return out;
}

export function patchGradle(text: string, release: Release): string {
  assertRelease(release);
  const code = replaceAll(text, GRADLE_CODE, (i) => `${i}versionCode ${release.buildNumber}`);
  return replaceAll(code, GRADLE_NAME, (i) => `${i}versionName "${release.version}"`);
}

export function patchPbxproj(text: string, release: Release): string {
  assertRelease(release);
  const marketing = replaceAll(
    text,
    PBX_MARKETING,
    (i) => `${i}MARKETING_VERSION = ${release.version};`,
  );
  return replaceAll(
    marketing,
    PBX_BUILD,
    (i) => `${i}CURRENT_PROJECT_VERSION = ${release.buildNumber};`,
  );
}

export function patchAll(files: VersionFiles, release: Release): VersionFiles {
  return {
    gradle: patchGradle(files.gradle, release),
    pbxproj: patchPbxproj(files.pbxproj, release),
  };
}

/** Human-readable differences between the native files and the release; empty when in sync. */
export function versionDrift(files: VersionFiles, release: Release): string[] {
  const wanted = patchAll(files, release);
  const drift: string[] = [];
  if (wanted.gradle !== files.gradle) {
    drift.push(
      `android/app/build.gradle: versionName/versionCode differ from ${release.version} (${release.buildNumber})`,
    );
  }
  if (wanted.pbxproj !== files.pbxproj) {
    drift.push(
      `ios project.pbxproj: MARKETING_VERSION/CURRENT_PROJECT_VERSION differ from ${release.version} (${release.buildNumber})`,
    );
  }
  return drift;
}
