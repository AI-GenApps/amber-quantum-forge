import { type GameTokenConfig, signGameToken } from "../../packages/api/src/games/tokens";

type LocalEnvironment = "debug" | "staging";

export interface ConfigWire {
  readonly revision: number;
  readonly content_revision: string;
  readonly spawn_two_weight: number;
  readonly spawn_four_weight: number;
  readonly features: {
    readonly daily: boolean;
    readonly endless: boolean;
    readonly ranked_relay: boolean;
    readonly rewarded_ads: boolean;
    readonly cosmetics: boolean;
  };
}

export interface DailyWire {
  readonly date: string;
  readonly content_revision: string;
  readonly max_legal_moves: number;
  readonly checkpoint: Record<string, unknown>;
}

interface ChallengeWire {
  readonly challenge_id: string;
  readonly checkpoint: Record<string, unknown>;
}

interface JsonRecord {
  readonly [key: string]: unknown;
}

const defaultApiUrl = "http://127.0.0.1:4001/api";

function environmentValue(name: string): string | undefined {
  return process.env[name];
}

export function isLocalApiUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "http:" &&
      ["127.0.0.1", "localhost", "::1"].includes(url.hostname) &&
      url.username.length === 0 &&
      url.password.length === 0 &&
      url.search.length === 0 &&
      url.hash.length === 0 &&
      /^\/api\/?$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export function buildConfigPayload(config: ConfigWire): JsonRecord {
  return {
    expected_revision: config.revision,
    spawn_two_weight: config.spawn_two_weight,
    spawn_four_weight: config.spawn_four_weight,
    content_revision: config.content_revision,
    features: {
      daily: true,
      endless: true,
      ranked_relay: true,
      rewarded_ads: config.features.rewarded_ads,
      cosmetics: config.features.cosmetics,
    },
  };
}

export function buildChallengePayload(
  date: string,
  daily: DailyWire,
  revision: number,
): JsonRecord {
  return {
    idempotency_key: `qa-daily-${date}-r${revision}`,
    creator_alias: "Local QA",
    mode: "daily",
    max_legal_moves: daily.max_legal_moves,
    content_id: `daily_${date.replaceAll("-", "")}`,
    content_version: daily.content_revision,
    checkpoint: daily.checkpoint,
  };
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`Invalid ${name} response`);
  return value;
}

function requiredInteger(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value))
    throw new Error(`Invalid ${name} response`);
  return value;
}

function unwrapData(value: unknown): JsonRecord {
  if (!isRecord(value) || !isRecord(value.data)) throw new Error("Invalid Merge Relay response");
  return value.data;
}

function readConfig(value: unknown): ConfigWire {
  const response = unwrapData(value);
  const data = isRecord(response.config) ? response.config : response;
  const features = data.features;
  if (!isRecord(features)) throw new Error("Invalid Merge Relay config response");
  const keys = ["daily", "endless", "ranked_relay", "rewarded_ads", "cosmetics"] as const;
  if (!keys.every((key) => typeof features[key] === "boolean"))
    throw new Error("Invalid Merge Relay feature response");
  return {
    revision: requiredInteger(data.revision, "config revision"),
    content_revision: requiredString(data.content_revision, "config content revision"),
    spawn_two_weight: requiredInteger(data.spawn_two_weight, "spawn-two weight"),
    spawn_four_weight: requiredInteger(data.spawn_four_weight, "spawn-four weight"),
    features: {
      daily: features.daily as boolean,
      endless: features.endless as boolean,
      ranked_relay: features.ranked_relay as boolean,
      rewarded_ads: features.rewarded_ads as boolean,
      cosmetics: features.cosmetics as boolean,
    },
  };
}

function readDaily(value: unknown): DailyWire {
  const data = unwrapData(value);
  if (!isRecord(data.checkpoint)) throw new Error("Invalid Merge Relay daily checkpoint response");
  return {
    date: requiredString(data.date, "daily date"),
    content_revision: requiredString(data.content_revision, "daily content revision"),
    max_legal_moves: requiredInteger(data.max_legal_moves, "daily move limit"),
    checkpoint: data.checkpoint,
  };
}

function readChallenge(value: unknown): ChallengeWire {
  const data = unwrapData(value);
  const challenge = data.challenge;
  if (!isRecord(challenge) || !isRecord(challenge.checkpoint))
    throw new Error("Invalid Merge Relay challenge response");
  return {
    challenge_id: requiredString(challenge.challenge_id, "challenge ID"),
    checkpoint: challenge.checkpoint,
  };
}

async function request(
  baseUrl: string,
  path: string,
  options: { readonly token?: string; readonly method?: string; readonly body?: JsonRecord } = {},
): Promise<unknown> {
  const headers: Record<string, string> = {};
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body) headers["Content-Type"] = "application/json";
  const response = await fetch(`${baseUrl}/${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error(`Merge Relay returned non-JSON HTTP ${response.status}`);
  }
  if (!response.ok) {
    const error = isRecord(body) && isRecord(body.error) ? body.error : undefined;
    const code = error && typeof error.code === "string" ? error.code : "request_failed";
    throw new Error(`Merge Relay HTTP ${response.status}: ${code}`);
  }
  return body;
}

function argument(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function environment(value: string | undefined): LocalEnvironment {
  if (value === undefined || value === "debug") return "debug";
  if (value === "staging") return value;
  throw new Error("games:qa only supports the local debug or staging environment");
}

function dailyDate(value: string | undefined): string {
  const date = value ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("--date must use YYYY-MM-DD");
  return date;
}

function tokenConfig(target: LocalEnvironment): GameTokenConfig {
  const secretName = `GAME_TOKEN_SECRET_MERGE_RELAY_${target.toUpperCase()}`;
  const secret = process.env[secretName];
  const issuer = environmentValue("GAME_TOKEN_ISSUER");
  const audience = environmentValue("GAME_TOKEN_AUDIENCE");
  if (!secret || !issuer || !audience)
    throw new Error(`Missing ${secretName}, GAME_TOKEN_ISSUER, or GAME_TOKEN_AUDIENCE`);
  return { appId: "merge_relay", environment: target, secret, issuer, audience };
}

export async function runQa(args: readonly string[]): Promise<void> {
  if (process.env.NODE_ENV === "production")
    throw new Error("games:qa refuses NODE_ENV=production");
  const baseUrl = (
    argument(args, "--base-url") ??
    environmentValue("MERGE_RELAY_LOCAL_API_URL") ??
    defaultApiUrl
  ).replace(/\/$/, "");
  if (!isLocalApiUrl(baseUrl))
    throw new Error("games:qa requires a loopback HTTP API URL ending in /api");
  const target = environment(argument(args, "--environment"));
  const date = dailyDate(argument(args, "--date"));
  const config = tokenConfig(target);
  const adminToken = await signGameToken(config, { subject: "local-qa-admin", role: "game_admin" });
  const playerToken = await signGameToken(config, { subject: "local-qa-player", role: "player" });
  await request(baseUrl, `games/merge_relay/${target}/config/bootstrap`, {
    method: "POST",
    token: adminToken,
    body: {},
  });
  const current = readConfig(await request(baseUrl, `games/merge_relay/${target}/config`));
  const enabled =
    current.features.daily && current.features.endless && current.features.ranked_relay;
  const active = enabled
    ? current
    : readConfig(
        await request(baseUrl, `games/merge_relay/${target}/config`, {
          method: "PUT",
          token: adminToken,
          body: buildConfigPayload(current),
        }),
      );
  await request(baseUrl, `games/merge_relay/${target}/daily/${date}/provision`, {
    method: "POST",
    token: adminToken,
  });
  const daily = readDaily(await request(baseUrl, `games/merge_relay/${target}/daily/${date}`));
  const challenge = readChallenge(
    await request(baseUrl, `games/merge_relay/${target}/challenges`, {
      method: "POST",
      token: playerToken,
      body: buildChallengePayload(date, daily, active.revision),
    }),
  );
  const origin = new URL(baseUrl).origin;
  console.log("Merge Relay local QA challenge ready");
  console.log(`environment: ${target}`);
  console.log(`daily date: ${date}`);
  console.log(`config revision: ${active.revision}`);
  console.log(`challenge id: ${challenge.challenge_id}`);
  console.log(
    `share preview: ${origin}/games/merge-relay/challenges/${challenge.challenge_id}?environment=${target}`,
  );
  console.log(`app link: mergerelay://challenge/${challenge.challenge_id}`);
  console.log(`copy code: ${challenge.challenge_id}`);
}

if (import.meta.main) {
  runQa(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
