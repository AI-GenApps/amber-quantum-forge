import { Hono } from "hono";
import { type GameTokenConfig, SignedGameTokenVerifier, signGameToken } from "../tokens";
import type { MergeRelayState } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { InMemoryMergeRelayStore } from "./memory-store";
import { createMergeRelayRoutes } from "./routes";
import { emptyMergeRelayState } from "./store";

export const tokenConfig: GameTokenConfig = {
  appId: "merge_relay",
  environment: "debug",
  secret: "merge-relay-fixture-secret-with-at-least-32-characters",
  issuer: "https://issuer.test/games",
  audience: "merge-relay-fixture",
};

export const checkpoint = {
  board: [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  score: 0,
  move_count: 0,
  seed: 7,
  rng_state: 123,
  rule_version: "MR-2D-1",
};

export interface FixtureHarness {
  app: Hono;
  setNow(value: string): void;
}

export function createFixtureApp(mutate?: (state: MergeRelayState) => void): FixtureHarness {
  const initial = emptyMergeRelayState();
  const config = initial.configs[0];
  if (!config) throw new Error("test config missing");
  config.features.rankedRelay = true;
  mutate?.(initial);
  let now = "2026-01-01T00:00:00.000Z";
  const dependencies: MergeRelayServiceDependencies & {
    tokenVerifier: SignedGameTokenVerifier;
  } = {
    store: new InMemoryMergeRelayStore({ debug: initial }),
    clock: { now: () => new Date(now) },
    rewardProvider: null,
    tokenVerifier: new SignedGameTokenVerifier(tokenConfig),
    idFactory: fixtureIdFactory(),
  };
  const app = new Hono();
  app.route("/games/merge_relay", createMergeRelayRoutes(dependencies));
  return {
    app,
    setNow: (value) => {
      now = value;
    },
  };
}

export type FixtureRole = "player" | "game_admin";

export interface FixtureCall {
  as?: string | null;
  role?: FixtureRole;
  body?: unknown;
  rawBody?: string;
  headers?: Record<string, string>;
  environment?: string;
}

export interface FixtureReply {
  status: number;
  body: Record<string, unknown>;
}

export async function call(
  harness: FixtureHarness,
  method: string,
  path: string,
  options: FixtureCall = {},
): Promise<FixtureReply> {
  const headers: Record<string, string> = { ...options.headers };
  const subject = options.as === undefined ? "owner" : options.as;
  if (subject !== null && !headers.Authorization) {
    const token = await signGameToken(tokenConfig, {
      subject,
      role: options.role ?? "player",
    });
    headers.Authorization = `Bearer ${token}`;
  }
  const raw =
    options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body));
  if (raw !== undefined) headers["Content-Type"] = "application/json";
  const response = await harness.app.request(
    `/games/merge_relay/${options.environment ?? "debug"}${path}`,
    { method, headers, body: raw },
  );
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

function fixtureIdFactory(): (prefix: string) => string {
  const counters = new Map<string, number>();
  return (prefix) => {
    const next = (counters.get(prefix) ?? 0) + 1;
    counters.set(prefix, next);
    return `${prefix}_fixture_${next}`;
  };
}
