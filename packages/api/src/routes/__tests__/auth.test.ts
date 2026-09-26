import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../firebase/admin", () => ({
  verifyIdToken: vi.fn(),
  default: {},
}));

// A small stateful in-memory fake for @repo/db, used only by the
// exchange -> refresh identity regression tests below. Column references on
// the mocked tables are plain strings ("users.email", "auth.firebaseUid",
// ...) so that the `eq`/`and`/`isNull`/`gt` mocks can build filter
// descriptors the fake query builder actually evaluates, instead of the
// context-free stub used by the rest of this file's tests.
const fake = vi.hoisted(() => {
  type Row = Record<string, unknown>;

  // Column reference values match the plain object keys the route handler
  // uses when building insert/update payloads (e.g. `{ tokenHash, ... }`),
  // so the fake query builder's row lookups line up with the real code.
  const usersTable = {
    id: "id",
    email: "email",
    name: "name",
    profilePictureUrl: "profilePictureUrl",
    isAdmin: "isAdmin",
  };
  const authTable = {
    id: "id",
    userId: "userId",
    firebaseUid: "firebaseUid",
    provider: "provider",
  };
  const refreshTable = {
    id: "id",
    userId: "userId",
    tokenHash: "tokenHash",
    expiresAt: "expiresAt",
    revokedAt: "revokedAt",
    rotatedAt: "rotatedAt",
    updatedAt: "updatedAt",
  };

  const tableRows = new Map<object, Row[]>([
    [usersTable, []],
    [authTable, []],
    [refreshTable, []],
  ]);
  const nextId = new Map<object, number>([
    [usersTable, 1],
    [authTable, 1],
    [refreshTable, 1],
  ]);

  function reset() {
    tableRows.set(usersTable, []);
    tableRows.set(authTable, []);
    tableRows.set(refreshTable, []);
    nextId.set(usersTable, 1);
    nextId.set(authTable, 1);
    nextId.set(refreshTable, 1);
  }

  type Cond =
    | { op: "eq"; field: string; value: unknown }
    | { op: "gt"; field: string; value: unknown }
    | { op: "isNull"; field: string }
    | { op: "and"; conds: Cond[] };

  function eq(field: string, value: unknown): Cond {
    return { op: "eq", field, value };
  }
  function gt(field: string, value: unknown): Cond {
    return { op: "gt", field, value };
  }
  function isNull(field: string): Cond {
    return { op: "isNull", field };
  }
  function and(...conds: Cond[]): Cond {
    return { op: "and", conds };
  }

  function matches(row: Row, cond: Cond | undefined): boolean {
    if (!cond) return true;
    switch (cond.op) {
      case "eq":
        return row[cond.field] === cond.value;
      case "gt": {
        const v = row[cond.field];
        return v instanceof Date && cond.value instanceof Date ? v > cond.value : false;
      }
      case "isNull":
        return row[cond.field] == null;
      case "and":
        return cond.conds.every((c) => matches(row, c));
      default:
        return false;
    }
  }

  class QueryBuilder implements PromiseLike<Row[]> {
    private op: "select" | "insert" | "update" | null = null;
    private table: object | null = null;
    private cond: Cond | undefined;
    private payload: Row | undefined;
    private limitN: number | undefined;
    private wantsReturning = false;

    select() {
      this.op = "select";
      return this;
    }
    from(table: object) {
      this.table = table;
      return this;
    }
    insert(table: object) {
      this.op = "insert";
      this.table = table;
      return this;
    }
    update(table: object) {
      this.op = "update";
      this.table = table;
      return this;
    }
    where(cond: Cond) {
      this.cond = cond;
      return this;
    }
    values(payload: Row) {
      this.payload = payload;
      return this;
    }
    set(payload: Row) {
      this.payload = payload;
      return this;
    }
    limit(n: number) {
      this.limitN = n;
      return this;
    }
    returning() {
      this.wantsReturning = true;
      return this;
    }

    private exec(): Row[] {
      if (!this.table) throw new Error("fake db: no table specified");
      const rows = tableRows.get(this.table);
      if (!rows) throw new Error("fake db: unknown table");
      if (this.op === "select") {
        const matched = rows.filter((r) => matches(r, this.cond));
        return this.limitN != null ? matched.slice(0, this.limitN) : matched;
      }
      if (this.op === "insert") {
        const id = nextId.get(this.table) ?? 1;
        nextId.set(this.table, id + 1);
        const row: Row = {
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...this.payload,
        };
        rows.push(row);
        return this.wantsReturning ? [row] : [];
      }
      if (this.op === "update") {
        const affected = rows.filter((r) => matches(r, this.cond));
        for (const row of affected) Object.assign(row, this.payload);
        return this.wantsReturning ? affected : [];
      }
      throw new Error("fake db: no operation specified");
    }

    // biome-ignore lint/suspicious/noThenProperty: intentional thenable query builder mimicking drizzle's chainable API
    then<TResult1 = Row[], TResult2 = never>(
      onfulfilled?: ((value: Row[]) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
      return Promise.resolve(this.exec()).then(onfulfilled, onrejected);
    }
  }

  const db = {
    select: () => new QueryBuilder().select(),
    insert: (table: object) => new QueryBuilder().insert(table),
    update: (table: object) => new QueryBuilder().update(table),
  };

  return { db, eq, and, isNull, gt, usersTable, authTable, refreshTable, reset };
});

vi.mock("@repo/db", () => ({
  db: fake.db,
  eq: fake.eq,
  and: fake.and,
  isNull: fake.isNull,
  gt: fake.gt,
  users: fake.usersTable,
  auth: fake.authTable,
  authRefreshTokens: fake.refreshTable,
  deviceRegistrations: {},
}));

import { verifyIdToken } from "../../firebase/admin";
import { hashRefreshToken } from "../../lib/jwt";
import { authTokenRoutes } from "../auth-tokens";

describe("POST /exchange", () => {
  it("returns 400 when idToken is missing", async () => {
    const res = await authTokenRoutes.request("/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 401 when Firebase token is invalid", async () => {
    vi.mocked(verifyIdToken).mockRejectedValueOnce(new Error("invalid"));
    const res = await authTokenRoutes.request("/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: "bad-token" }),
    });
    expect(res.status).toBe(401);
  });
});

describe("POST /refresh", () => {
  it("returns 400 when refreshToken is missing", async () => {
    const res = await authTokenRoutes.request("/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 401 when refresh token not found", async () => {
    const res = await authTokenRoutes.request("/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: "a".repeat(64) }),
    });
    expect(res.status).toBe(401);
  });
});

describe("POST /revoke", () => {
  it("returns 200 success even with no token", async () => {
    const res = await authTokenRoutes.request("/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });

  it("returns 200 success with any token string", async () => {
    const res = await authTokenRoutes.request("/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: "nonexistent" }),
    });
    expect(res.status).toBe(200);
  });
});

function decodeJwtPayload(token: string): Record<string, unknown> {
  const [, payloadB64] = token.split(".");
  return JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
}

describe("refresh identity regression (task 15-ludo-launch/14)", () => {
  beforeEach(() => {
    fake.reset();
    vi.mocked(verifyIdToken).mockReset();
  });

  it("mints a /refresh access token with the same sub/uid (Firebase UID) as /exchange", async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      uid: "firebase-uid-123",
      email: "player@example.com",
      email_verified: true,
      name: "Player One",
      picture: null,
      firebase: { sign_in_provider: "google.com" },
    } as never);

    const exchangeRes = await authTokenRoutes.request("/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: "good-token" }),
    });
    expect(exchangeRes.status).toBe(200);
    const exchangeBody = (await exchangeRes.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    const exchangePayload = decodeJwtPayload(exchangeBody.accessToken);
    expect(exchangePayload.sub).toBe("firebase-uid-123");
    expect(exchangePayload.uid).toBe("firebase-uid-123");

    const refreshRes = await authTokenRoutes.request("/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: exchangeBody.refreshToken }),
    });
    expect(refreshRes.status).toBe(200);
    const refreshBody = (await refreshRes.json()) as { accessToken: string };
    const refreshPayload = decodeJwtPayload(refreshBody.accessToken);

    // The bug: this used to be the user's email instead of the Firebase UID.
    expect(refreshPayload.sub).toBe(exchangePayload.sub);
    expect(refreshPayload.uid).toBe(exchangePayload.uid);
    expect(refreshPayload.sub).toBe("firebase-uid-123");
    expect(refreshPayload.sub).not.toBe("player@example.com");
  });

  it("exchanges an anonymous Firebase ID token for an API JWT with a stable sub (15-ludo-launch/23)", async () => {
    // Firebase anonymous sign-in yields a decoded token with no email and
    // `firebase.sign_in_provider: "anonymous"`. `/exchange` must treat this
    // identically to any other provider: no rejection, and `sub`/`uid` come
    // straight from the Firebase UID.
    vi.mocked(verifyIdToken).mockResolvedValue({
      uid: "anon-uid-789",
      email: undefined,
      email_verified: false,
      name: undefined,
      picture: undefined,
      firebase: { sign_in_provider: "anonymous" },
    } as never);

    const res = await authTokenRoutes.request("/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: "anon-token" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { accessToken: string };
    const payload = decodeJwtPayload(body.accessToken);
    expect(payload.sub).toBe("anon-uid-789");
    expect(payload.uid).toBe("anon-uid-789");
    expect(payload.provider).toBe("anonymous");
  });

  it("keeps the same sub across a simulated Google-link of an anonymous Firebase UID (15-ludo-launch/23)", async () => {
    // Firebase's `linkWithCredential` preserves the Firebase UID: re-running
    // `/exchange` with the now-linked ID token (same `uid`, a different
    // `sign_in_provider`, and a newly-attached email) must yield an API JWT
    // with the same `sub` as the pre-link anonymous exchange.
    vi.mocked(verifyIdToken).mockResolvedValueOnce({
      uid: "linkable-uid-456",
      email: undefined,
      email_verified: false,
      name: undefined,
      picture: undefined,
      firebase: { sign_in_provider: "anonymous" },
    } as never);
    const anonRes = await authTokenRoutes.request("/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: "anon-token" }),
    });
    expect(anonRes.status).toBe(200);
    const anonPayload = decodeJwtPayload((await anonRes.json()).accessToken as string);

    vi.mocked(verifyIdToken).mockResolvedValueOnce({
      uid: "linkable-uid-456",
      email: "linked@example.com",
      email_verified: true,
      name: "Linked Player",
      picture: null,
      firebase: { sign_in_provider: "google.com" },
    } as never);
    const linkedRes = await authTokenRoutes.request("/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: "linked-token" }),
    });
    expect(linkedRes.status).toBe(200);
    const linkedPayload = decodeJwtPayload((await linkedRes.json()).accessToken as string);

    expect(linkedPayload.sub).toBe(anonPayload.sub);
    expect(linkedPayload.uid).toBe(anonPayload.uid);
    expect(linkedPayload.sub).toBe("linkable-uid-456");
    expect(linkedPayload.provider).toBe("google.com");
  });

  it("fails closed with 401 when the refresh token's user has no linked auth row", async () => {
    // Seed a refresh token pointing at a user row with no corresponding
    // `auth` row (e.g. the Firebase auth link was deleted/never created).
    const [user] = await fake.db
      .insert(fake.usersTable)
      .values({ email: "orphan@example.com", name: "Orphan", isAdmin: false })
      .returning();
    const rawToken = "b".repeat(64);
    const tokenHash = hashRefreshToken(rawToken);
    await fake.db.insert(fake.refreshTable).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const res = await authTokenRoutes.request("/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rawToken }),
    });
    expect(res.status).toBe(401);
  });
});
