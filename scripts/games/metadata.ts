import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { activeIdForEnvironment } from "./config";
import { appDirectory, ROOT, requireApp } from "./toolchain";

interface HashSource {
  readonly directory: string;
  readonly label: string;
}

export interface PubspecRelease {
  readonly version: string;
  readonly buildNumber: number;
}

function filesUnder(directory: string): string[] {
  if (!existsSync(directory)) return [];
  const ignoredDirectories = new Set([
    ".dart_tool",
    ".git",
    ".idea",
    ".gradle",
    ".cxx",
    "build",
    "coverage",
    "ephemeral",
    "Pods",
    "Runner.xcodeproj",
  ]);
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && !ignoredFile(entry.name))
    .map((entry) => resolve(entry.parentPath, entry.name))
    .filter(
      (path) =>
        !relative(directory, path)
          .split(/[\\/]/)
          .some((part) => ignoredDirectories.has(part)),
    )
    .sort();
}

function ignoredFile(name: string): boolean {
  return (
    name === ".DS_Store" ||
    /^\.env(?:\..*)?$/.test(name) ||
    /\.(?:jks|keystore|mobileprovision|p12|pem)$/i.test(name)
  );
}

function addFrame(hash: ReturnType<typeof createHash>, value: string | Uint8Array): void {
  const bytes = typeof value === "string" ? Buffer.from(value, "utf8") : value;
  hash.update(Buffer.from(`${bytes.byteLength}:`, "utf8"));
  hash.update(bytes);
}

export function hashSources(sources: readonly HashSource[]): string | null {
  const entries = sources.flatMap((source) =>
    filesUnder(source.directory).map((path) => ({
      key: `${source.label}/${relative(source.directory, path).split("\\").join("/")}`,
      bytes: readFileSync(path),
    })),
  );
  if (entries.length === 0) return null;
  entries.sort((first, second) => first.key.localeCompare(second.key));
  const hash = createHash("sha256");
  for (const entry of entries) {
    addFrame(hash, entry.key);
    addFrame(hash, entry.bytes);
  }
  return hash.digest("hex");
}

export function hashFiles(directory: string, label = directory): string | null {
  return hashSources([{ directory, label }]);
}

export function hashReleaseSources(
  appRoot: string,
  sharedDirectories: readonly string[],
): { appSourceSha256: string | null; sharedSourceSha256: string | null } {
  return {
    appSourceSha256: hashFiles(appRoot, "app"),
    sharedSourceSha256: hashSources(
      sharedDirectories.map((directory, index) => ({
        directory,
        label: `shared/${index}`,
      })),
    ),
  };
}

export function parsePubspecRelease(contents: string): PubspecRelease {
  const match = contents.match(/^version:\s*([^\s+]+)(?:\+([^\s]+))?\s*$/m);
  const version = match?.[1];
  const rawBuildNumber = match?.[2];
  if (!version || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error("pubspec version must be a semantic version");
  }
  if (!rawBuildNumber || !/^\d+$/.test(rawBuildNumber)) {
    throw new Error("pubspec version must include a numeric build number");
  }
  const buildNumber = Number(rawBuildNumber);
  if (!Number.isSafeInteger(buildNumber) || buildNumber < 1) {
    throw new Error("pubspec build number must be a positive safe integer");
  }
  return { version, buildNumber };
}

export function validatePubspecRelease(
  contents: string,
  expectedVersion: string,
  expectedBuildNumber: number,
): string[] {
  try {
    const actual = parsePubspecRelease(contents);
    const errors: string[] = [];
    if (actual.version !== expectedVersion)
      errors.push(`pubspec version ${actual.version} does not match registry ${expectedVersion}`);
    if (actual.buildNumber !== expectedBuildNumber) {
      errors.push(
        `pubspec build number ${actual.buildNumber} does not match registry ${expectedBuildNumber}`,
      );
    }
    return errors;
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
}

function value(args: string[], name: string): string {
  const index = args.indexOf(name);
  const result = index >= 0 ? args[index + 1] : undefined;
  if (!result) throw new Error(`${name} is required`);
  return result;
}

export function writeBuildMetadata(args: string[]): string {
  const game = requireApp(value(args, "--app"));
  const platform = value(args, "--platform");
  const environment = value(args, "--environment") as "debug" | "staging" | "production";
  if (platform !== "android" && platform !== "ios")
    throw new Error(`Unsupported platform: ${platform}`);
  if (!["debug", "staging", "production"].includes(environment))
    throw new Error(`Unsupported environment: ${environment}`);
  const output = resolve(value(args, "--output"));
  const appRoot = appDirectory(game);
  const pubspec = readFileSync(join(appRoot, "pubspec.yaml"), "utf8");
  const releaseErrors = validatePubspecRelease(
    pubspec,
    game.release.version,
    game.release.buildNumber,
  );
  if (releaseErrors.length > 0) throw new Error(releaseErrors.join("\n"));
  const release = parsePubspecRelease(pubspec);
  const contentSources = [
    { directory: join(appRoot, "content"), label: "content" },
    { directory: join(appRoot, "assets", "content"), label: "assets/content" },
  ] as const;
  const contentSha256 = hashSources(contentSources);
  if (!contentSha256) throw new Error(`No content files found for ${game.id}`);
  const rulesRoot = join(ROOT, game.paths.rulesPackage);
  const rulesSources = [
    { directory: join(rulesRoot, "lib"), label: `${game.paths.rulesPackage}/lib` },
  ] as const;
  const rulesSha256 = hashSources(rulesSources);
  if (!rulesSha256) throw new Error(`No rules files found for ${game.id}`);
  const sourceHashes = hashReleaseSources(appRoot, [
    join(ROOT, "apps-native/games/packages/platform_core/lib"),
    join(ROOT, "scripts/games"),
  ]);
  if (!sourceHashes.appSourceSha256 || !sourceHashes.sharedSourceSha256)
    throw new Error(`No complete source files found for ${game.id}`);
  const worktreeDirty =
    execFileSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim().length > 0;
  const activeId = activeIdForEnvironment(game, environment);
  const metadata = {
    schemaVersion: 1,
    appId: game.id,
    canonicalName: game.canonicalName,
    publicTitle: game.publicTitle,
    platform,
    environment,
    activeId,
    commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(),
    worktreeDirty,
    appSourceSha256: sourceHashes.appSourceSha256,
    sharedSourceSha256: sourceHashes.sharedSourceSha256,
    version: release.version,
    buildNumber: release.buildNumber,
    artifactId: `${game.id}-${platform}-${environment}-${release.version}+${release.buildNumber}`,
    contentSources: contentSources
      .filter((source) => filesUnder(source.directory).length > 0)
      .map((source) => source.label),
    contentSha256,
    rulesSources: ["lib"],
    rulesSha256,
    rulesPackage: game.paths.rulesPackage,
  };
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(metadata, null, 2)}\n`);
  return output;
}

if (import.meta.main) {
  const output = writeBuildMetadata(process.argv.slice(2));
  console.log(`Wrote build metadata to ${output}`);
}
