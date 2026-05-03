import { beforeAll, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  process.env.API_JWT_SECRET = "test-secret-that-is-at-least-32-chars-long-for-test";
  process.env.OPENAI_API_KEY = "test-key";
});

vi.mock("@repo/ai", () => ({
  streamChat: vi.fn().mockReturnValue({
    toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('0:"hi"\n', { status: 200 })),
  }),
}));

vi.mock("../../middleware/auth", () => ({
  authMiddleware: vi.fn(
    async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
      c.set("user", { uid: "user-1", email: "a@b.com" });
      await next();
    },
  ),
}));

import aiRoutes from "../ai";

describe("POST /chat", () => {
  it("returns 400 when messages is missing", async () => {
    const res = await aiRoutes.request("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when messages is empty array", async () => {
    const res = await aiRoutes.request("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [] }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when messages exceeds 50", async () => {
    const messages = Array.from({ length: 51 }, (_, i) => ({
      role: "user",
      content: `msg ${i}`,
    }));
    const res = await aiRoutes.request("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    expect(res.status).toBe(400);
  });

  it("streams response for valid messages", async () => {
    const res = await aiRoutes.request("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] }),
    });
    expect(res.status).toBe(200);
  });
});
