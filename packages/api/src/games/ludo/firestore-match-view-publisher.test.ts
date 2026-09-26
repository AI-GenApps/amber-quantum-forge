import { describe, expect, it } from "vitest";
import type { LudoEnvironment, LudoMatchView } from "./contracts";
import {
  type FirestoreLikeClient,
  type FirestoreLikeCollection,
  type FirestoreLikeDocument,
  FirestoreMatchViewPublisher,
  ludoMatchViewCollectionPath,
} from "./firestore-match-view-publisher";
import { matchViewToWire } from "./wire";

const ENVIRONMENT: LudoEnvironment = "debug";

/** Records every `collection(...).doc(...).set(...)` call, without any real Firestore credentials. */
class FakeFirestoreClient implements FirestoreLikeClient {
  readonly collectionPaths: string[] = [];
  readonly sets: { path: string; docId: string; data: Record<string, unknown> }[] = [];

  collection(path: string): FirestoreLikeCollection {
    this.collectionPaths.push(path);
    return {
      doc: (docId: string): FirestoreLikeDocument => ({
        set: async (data: Record<string, unknown>) => {
          this.sets.push({ path, docId, data });
        },
      }),
    };
  }
}

function fixtureView(matchId: string): LudoMatchView {
  return {
    matchId,
    environment: ENVIRONMENT,
    matchState: {
      matchId,
      environment: ENVIRONMENT,
      mode: "quick",
      status: "active",
      players: [
        {
          seat: 0,
          subject: "subject-0",
          color: "red",
          tokens: [{ id: 0, pathPosition: 4 }],
          captureCount: 0,
        },
      ],
      currentPlayerIndex: 0,
      phase: "awaiting_move",
      currentRoll: 5,
      consecutiveSixes: 0,
      winnerOrder: [],
      deadlineAt: "2026-01-01T00:00:30.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    recentEvents: [
      {
        type: "dice_rolled",
        eventId: `${matchId}:0`,
        matchId,
        sequence: 0,
        createdAt: "2026-01-01T00:00:00.000Z",
        seat: 0,
        roll: 5,
      },
    ],
    publishedAt: "2026-01-01T00:00:01.000Z",
  };
}

describe("FirestoreMatchViewPublisher", () => {
  it("writes to games/{appId}/{environment}/matches/{matchId}", async () => {
    const client = new FakeFirestoreClient();
    const publisher = new FirestoreMatchViewPublisher(client);
    const view = fixtureView("match-1");

    await publisher.publish("ludo", ENVIRONMENT, "match-1", view);

    expect(client.collectionPaths).toEqual([ludoMatchViewCollectionPath("ludo", ENVIRONMENT)]);
    expect(client.collectionPaths[0]).toBe("games/ludo/debug/matches");
    expect(client.sets).toHaveLength(1);
    expect(client.sets[0].docId).toBe("match-1");
  });

  it("writes the exact wire payload shape a client would read back", async () => {
    const client = new FakeFirestoreClient();
    const publisher = new FirestoreMatchViewPublisher(client);
    const view = fixtureView("match-2");

    await publisher.publish("ludo", ENVIRONMENT, "match-2", view);

    expect(client.sets[0].data).toEqual(matchViewToWire(view));
  });

  it("overwrites the same document on a second publish for the same match", async () => {
    const client = new FakeFirestoreClient();
    const publisher = new FirestoreMatchViewPublisher(client);

    await publisher.publish("ludo", ENVIRONMENT, "match-3", fixtureView("match-3"));
    await publisher.publish("ludo", ENVIRONMENT, "match-3", {
      ...fixtureView("match-3"),
      publishedAt: "2026-01-01T00:05:00.000Z",
    });

    expect(client.sets).toHaveLength(2);
    expect(client.sets.every((s) => s.docId === "match-3")).toBe(true);
    expect(client.sets[1].data.published_at).toBe("2026-01-01T00:05:00.000Z");
  });

  it("scopes the collection path per environment", async () => {
    const client = new FakeFirestoreClient();
    const publisher = new FirestoreMatchViewPublisher(client);

    await publisher.publish("ludo", "staging", "match-4", fixtureView("match-4"));

    expect(client.collectionPaths[0]).toBe("games/ludo/staging/matches");
  });
});
