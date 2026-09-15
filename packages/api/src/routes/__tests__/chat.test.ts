import { describe, expect, it, vi } from "vitest";

vi.mock("../../middleware/auth", () => ({
  authMiddleware: vi.fn(
    async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
      c.set("user", { uid: "user-1", email: "a@b.com" });
      await next();
    },
  ),
}));

const mockInserted: unknown[] = [];

vi.mock("@repo/db", () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{ id: 1, email: "a@b.com" }]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoNothing: vi.fn().mockReturnThis(),
    returning: vi.fn().mockImplementation(() => Promise.resolve(mockInserted)),
  };
  return {
    db: mockDb,
    eq: vi.fn(),
    users: {},
    chatMessages: {},
  };
});

import chatRoutes from "../chat";

describe("POST /sync", () => {
  it("returns 400 when messages is missing", async () => {
    const res = await chatRoutes.request("/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when messages is empty array", async () => {
    const res = await chatRoutes.request("/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [] }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when messages exceeds 100", async () => {
    const messages = Array.from({ length: 101 }, (_, i) => ({
      clientId: `id-${i}`,
      role: "user",
      content: "hi",
      createdAt: new Date().toISOString(),
    }));
    const res = await chatRoutes.request("/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    expect(res.status).toBe(400);
  });

  it("returns synced/skipped counts for valid messages", async () => {
    mockInserted.splice(0, mockInserted.length, { id: 1 }, { id: 2 });
    const messages = [
      { clientId: "uuid-1", role: "user", content: "Hello", createdAt: new Date().toISOString() },
      {
        clientId: "uuid-2",
        role: "assistant",
        content: "Hi!",
        createdAt: new Date().toISOString(),
      },
    ];
    const res = await chatRoutes.request("/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { synced: number; skipped: number };
    expect(body.synced).toBe(2);
    expect(body.skipped).toBe(0);
  });
});
