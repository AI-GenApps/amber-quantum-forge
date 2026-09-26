import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { LudoEnvironment, LudoMatchView } from "./contracts";
import { resolveMatchViewPublisher } from "./dependencies";
import { FirestoreMatchViewPublisher } from "./firestore-match-view-publisher";
import type { MatchViewPublisher } from "./match-view-publisher";
import { InMemoryMatchViewPublisher, NullMatchViewPublisher } from "./match-view-publisher";

const ENVIRONMENT: LudoEnvironment = "debug";

function fixtureView(matchId: string): LudoMatchView {
  return {
    matchId,
    environment: ENVIRONMENT,
    matchState: {
      matchId,
      environment: ENVIRONMENT,
      mode: "classic",
      status: "active",
      players: [],
      currentPlayerIndex: 0,
      phase: "awaiting_roll",
      currentRoll: null,
      consecutiveSixes: 0,
      winnerOrder: [],
      deadlineAt: null,
      updatedAt: new Date().toISOString(),
    },
    recentEvents: [],
    publishedAt: new Date().toISOString(),
  };
}

describe("InMemoryMatchViewPublisher", () => {
  it("records every publish() call in order", async () => {
    const publisher = new InMemoryMatchViewPublisher();
    await publisher.publish("ludo", ENVIRONMENT, "match-1", fixtureView("match-1"));
    await publisher.publish("ludo", ENVIRONMENT, "match-2", fixtureView("match-2"));
    await publisher.publish("ludo", ENVIRONMENT, "match-1", fixtureView("match-1"));

    expect(publisher.calls).toHaveLength(3);
    expect(publisher.calls.map((c) => c.matchId)).toEqual(["match-1", "match-2", "match-1"]);
    expect(publisher.calls[0].appId).toBe("ludo");
    expect(publisher.calls[0].environment).toBe(ENVIRONMENT);
  });

  it("latestFor returns the most recent view for a match, or null if never published", async () => {
    const publisher = new InMemoryMatchViewPublisher();
    const first = fixtureView("match-1");
    const second = { ...fixtureView("match-1"), publishedAt: "later" };
    await publisher.publish("ludo", ENVIRONMENT, "match-1", first);
    await publisher.publish("ludo", ENVIRONMENT, "match-1", second);

    expect(publisher.latestFor("match-1")).toBe(second);
    expect(publisher.latestFor("never-published")).toBeNull();
  });
});

describe("NullMatchViewPublisher", () => {
  it("never throws, regardless of input", async () => {
    const publisher: MatchViewPublisher = new NullMatchViewPublisher();
    await expect(
      publisher.publish("ludo", ENVIRONMENT, "match-1", fixtureView("match-1")),
    ).resolves.toBeUndefined();
  });

  it("is a true no-op: it does not retain anything observable", async () => {
    const publisher: MatchViewPublisher = new NullMatchViewPublisher();
    await publisher.publish("ludo", ENVIRONMENT, "match-1", fixtureView("match-1"));
    // Nothing to assert beyond "it resolved and holds no public state" —
    // TypeScript itself keeps this class from exposing any recorded calls.
    expect(Object.keys(publisher)).toHaveLength(0);
  });
});

describe("resolveMatchViewPublisher", () => {
  const ENV_KEYS = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_CLIENT_EMAIL",
  ] as const;
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it("picks NullMatchViewPublisher when any Firebase Admin env var is missing", () => {
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_PRIVATE_KEY;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    expect(resolveMatchViewPublisher()).toBeInstanceOf(NullMatchViewPublisher);

    process.env.FIREBASE_PROJECT_ID = "test-project";
    process.env.FIREBASE_CLIENT_EMAIL = "svc@test-project.iam.gserviceaccount.com";
    delete process.env.FIREBASE_PRIVATE_KEY;
    expect(resolveMatchViewPublisher()).toBeInstanceOf(NullMatchViewPublisher);
  });

  it("picks FirestoreMatchViewPublisher once all three env vars are present", () => {
    process.env.FIREBASE_PROJECT_ID = "test-project";
    process.env.FIREBASE_CLIENT_EMAIL = "svc@test-project.iam.gserviceaccount.com";
    process.env.FIREBASE_PRIVATE_KEY =
      "-----BEGIN PRIVATE KEY-----\\nfake\\n-----END PRIVATE KEY-----\\n";

    // `FirestoreMatchViewPublisher` only touches the real Firebase Admin SDK
    // (credential parsing, app init) on its first `publish()` call, not at
    // construction time — so resolving it here never touches real
    // Firestore/network.
    expect(resolveMatchViewPublisher()).toBeInstanceOf(FirestoreMatchViewPublisher);
  });
});
