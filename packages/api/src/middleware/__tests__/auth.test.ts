import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { signAccessToken } from "../../lib/jwt";
import { authMiddleware, requireAdmin } from "../auth";

function makeApp() {
  const app = new Hono();
  app.get("/protected", authMiddleware, (c) => c.json({ user: c.get("user") }));
  app.get("/admin-only", authMiddleware, requireAdmin, (c) => c.json({ ok: true }));
  return app;
}

describe("authMiddleware", () => {
  it("returns 401 when no Authorization header", async () => {
    const app = makeApp();
    const res = await app.request("/protected");
    expect(res.status).toBe(401);
  });

  it("returns 401 for malformed token", async () => {
    const app = makeApp();
    const res = await app.request("/protected", {
      headers: { Authorization: "Bearer not-a-jwt" },
    });
    expect(res.status).toBe(401);
  });

  it("passes with valid API JWT and sets user on context", async () => {
    const app = makeApp();
    const token = await signAccessToken({
      sub: "uid1",
      uid: "uid1",
      email: "u@test.com",
      emailVerified: true,
      provider: "google.com",
      admin: false,
    });
    const res = await app.request("/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { uid: string } };
    expect(body.user.uid).toBe("uid1");
  });
});

describe("requireAdmin", () => {
  it("returns 403 when user is not admin", async () => {
    const app = makeApp();
    const token = await signAccessToken({
      sub: "uid2",
      uid: "uid2",
      email: "u2@test.com",
      emailVerified: true,
      provider: "google.com",
      admin: false,
    });
    const res = await app.request("/admin-only", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });

  it("passes when user is admin", async () => {
    const app = makeApp();
    const token = await signAccessToken({
      sub: "uid3",
      uid: "uid3",
      email: "admin@test.com",
      emailVerified: true,
      provider: "google.com",
      admin: true,
    });
    const res = await app.request("/admin-only", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });
});
