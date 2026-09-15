import { describe, expect, it, vi } from "vitest";

vi.mock("../../firebase/admin", () => ({
  verifyIdToken: vi.fn(),
  default: {},
}));

vi.mock("@repo/db", () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([
      {
        id: 1,
        email: "a@b.com",
        name: "A",
        profilePictureUrl: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };
  return {
    db: mockDb,
    eq: vi.fn(),
    and: vi.fn(),
    isNull: vi.fn(),
    gt: vi.fn(),
    users: {},
    auth: {},
    authRefreshTokens: {},
    deviceRegistrations: {},
  };
});

import { verifyIdToken } from "../../firebase/admin";
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
