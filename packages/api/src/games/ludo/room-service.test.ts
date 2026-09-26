import { describe, expect, it } from "vitest";
import type { LudoEnvironment } from "./contracts";
import { LudoRoomExpiredError, LudoRoomNotFoundError } from "./errors";
import { InMemoryLudoStore } from "./memory-store";
import { createRoom, joinRoom, LUDO_ROOM_SWEEP_LIMIT, sweepExpiredRooms } from "./room-service";

const ENVIRONMENT: LudoEnvironment = "debug";

async function expireRoom(store: InMemoryLudoStore, roomCode: string): Promise<void> {
  await store.transact(ENVIRONMENT, async (state) => {
    const row = state.rooms.find((r) => r.roomCode === roomCode);
    if (row) row.expiresAt = new Date(Date.now() - 1_000).toISOString();
    return undefined;
  });
}

describe("createRoom", () => {
  it("creates a waiting room with a 6-character uppercase alphanumeric code", async () => {
    const store = new InMemoryLudoStore();
    const result = await createRoom(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    expect(result.idempotent).toBe(false);
    expect(result.room.roomCode).toMatch(/^[A-Z0-9]{6}$/);
    expect(result.room.status).toBe("waiting");
    expect(result.room.matchId).toBeNull();
    expect(result.room.ownerSubject).toBe("alice");
    expect(result.inviteLink).toBe(`w3dev-ludo://room/${result.room.roomCode}`);
  });

  it("returns the caller's existing open room instead of minting a second code", async () => {
    const store = new InMemoryLudoStore();
    const first = await createRoom(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    const second = await createRoom(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k2",
    });
    expect(second.idempotent).toBe(true);
    expect(second.room.roomCode).toBe(first.room.roomCode);
    expect(store.snapshot(ENVIRONMENT).rooms).toHaveLength(1);
  });

  it("retries room-code generation on a collision against an unexpired room", async () => {
    const store = new InMemoryLudoStore();
    const first = await createRoom(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    const collidingCode = first.room.roomCode;
    const freshCode = collidingCode === "AAAAAA" ? "BBBBBB" : "AAAAAA";
    let calls = 0;
    const second = await createRoom(
      store,
      ENVIRONMENT,
      { subject: "bob", mode: "classic", seatTarget: 2, idempotencyKey: "k2" },
      {
        roomCodeGenerator: () => {
          calls += 1;
          return calls === 1 ? collidingCode : freshCode;
        },
      },
    );
    expect(calls).toBe(2);
    expect(second.room.roomCode).toBe(freshCode);
    expect(second.room.roomCode).not.toBe(collidingCode);
  });
});

describe("joinRoom", () => {
  it("forms a match on the first join and marks the room matched once full", async () => {
    const store = new InMemoryLudoStore();
    const created = await createRoom(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });

    const joined = await joinRoom(store, ENVIRONMENT, {
      subject: "bob",
      roomCode: created.room.roomCode,
      idempotencyKey: "join-1",
    });

    expect(joined.idempotent).toBe(false);
    expect(joined.matchState.status).toBe("active");
    expect(joined.matchState.players).toHaveLength(2);
    expect(joined.room.status).toBe("matched");
    expect(joined.room.matchId).toBe(joined.matchState.matchId);

    const matches = store.snapshot(ENVIRONMENT).matches;
    expect(matches).toHaveLength(1);
    expect(matches[0].matchOrigin).toBe("room");
  });

  it("is idempotent against a duplicate join request with the same idempotency key", async () => {
    const store = new InMemoryLudoStore();
    const created = await createRoom(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });

    const first = await joinRoom(store, ENVIRONMENT, {
      subject: "bob",
      roomCode: created.room.roomCode,
      idempotencyKey: "join-1",
    });
    const second = await joinRoom(store, ENVIRONMENT, {
      subject: "bob",
      roomCode: created.room.roomCode,
      idempotencyKey: "join-1",
    });

    expect(first.idempotent).toBe(false);
    expect(second.idempotent).toBe(true);
    expect(second.matchState.matchId).toBe(first.matchState.matchId);
    expect(store.snapshot(ENVIRONMENT).matches).toHaveLength(1);
  });

  it("fills a 4-seat room progressively across three joins, creating exactly one match", async () => {
    const store = new InMemoryLudoStore();
    const created = await createRoom(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 4,
      idempotencyKey: "k1",
    });

    const first = await joinRoom(store, ENVIRONMENT, {
      subject: "bob",
      roomCode: created.room.roomCode,
      idempotencyKey: "join-bob",
    });
    expect(first.matchState.status).toBe("waiting");
    const matchId = first.matchState.matchId;

    const second = await joinRoom(store, ENVIRONMENT, {
      subject: "carol",
      roomCode: created.room.roomCode,
      idempotencyKey: "join-carol",
    });
    expect(second.matchState.matchId).toBe(matchId);
    expect(second.matchState.status).toBe("waiting");

    const third = await joinRoom(store, ENVIRONMENT, {
      subject: "dave",
      roomCode: created.room.roomCode,
      idempotencyKey: "join-dave",
    });
    expect(third.matchState.matchId).toBe(matchId);
    expect(third.matchState.status).toBe("active");
    expect(third.matchState.players).toHaveLength(4);

    expect(store.snapshot(ENVIRONMENT).matches).toHaveLength(1);
  });

  it("rejects joining a room code that does not exist", async () => {
    const store = new InMemoryLudoStore();
    await expect(
      joinRoom(store, ENVIRONMENT, {
        subject: "bob",
        roomCode: "ZZZZZZ",
        idempotencyKey: "join-1",
      }),
    ).rejects.toBeInstanceOf(LudoRoomNotFoundError);
  });

  it("rejects joining an expired, never-filled room", async () => {
    const store = new InMemoryLudoStore();
    const created = await createRoom(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    await expireRoom(store, created.room.roomCode);

    await expect(
      joinRoom(store, ENVIRONMENT, {
        subject: "bob",
        roomCode: created.room.roomCode,
        idempotencyKey: "join-1",
      }),
    ).rejects.toBeInstanceOf(LudoRoomExpiredError);
  });
});

describe("sweepExpiredRooms", () => {
  it("removes an expired, never-filled room", async () => {
    const store = new InMemoryLudoStore();
    const created = await createRoom(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    await expireRoom(store, created.room.roomCode);

    const result = await sweepExpiredRooms(store, ENVIRONMENT);
    expect(result.expired).toBe(1);
    expect(store.snapshot(ENVIRONMENT).rooms).toHaveLength(0);
  });

  it("never sweeps a room that already has a match, however old", async () => {
    const store = new InMemoryLudoStore();
    const created = await createRoom(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });
    await joinRoom(store, ENVIRONMENT, {
      subject: "bob",
      roomCode: created.room.roomCode,
      idempotencyKey: "join-1",
    });
    await expireRoom(store, created.room.roomCode);

    const result = await sweepExpiredRooms(store, ENVIRONMENT);
    expect(result.expired).toBe(0);
    expect(store.snapshot(ENVIRONMENT).rooms).toHaveLength(1);
  });

  it("leaves an unexpired room untouched", async () => {
    const store = new InMemoryLudoStore();
    await createRoom(store, ENVIRONMENT, {
      subject: "alice",
      mode: "classic",
      seatTarget: 2,
      idempotencyKey: "k1",
    });

    const result = await sweepExpiredRooms(store, ENVIRONMENT);
    expect(result.expired).toBe(0);
    expect(store.snapshot(ENVIRONMENT).rooms).toHaveLength(1);
  });

  it("bounds how many expired rooms it removes per call", async () => {
    const store = new InMemoryLudoStore();
    for (let i = 0; i < 3; i++) {
      const created = await createRoom(store, ENVIRONMENT, {
        subject: `owner-${i}`,
        mode: "classic",
        seatTarget: 2,
        idempotencyKey: `k${i}`,
      });
      await expireRoom(store, created.room.roomCode);
    }

    const result = await sweepExpiredRooms(store, ENVIRONMENT, new Date(), 2);
    expect(result.expired).toBe(2);
    expect(store.snapshot(ENVIRONMENT).rooms).toHaveLength(1);
    expect(LUDO_ROOM_SWEEP_LIMIT).toBeGreaterThan(2);
  });
});
