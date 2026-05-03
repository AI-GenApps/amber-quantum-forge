import { type ModelMessage, streamChat } from "@repo/ai";
import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";

const aiRoutes = new Hono();

aiRoutes.post("/chat", authMiddleware, async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { messages, system, model } = body as {
    messages?: unknown;
    system?: unknown;
    model?: unknown;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: "messages must be a non-empty array" }, 400);
  }

  if (messages.length > 50) {
    return c.json({ error: "messages array exceeds maximum of 50" }, 400);
  }

  for (const msg of messages) {
    if (
      typeof msg !== "object" ||
      msg === null ||
      typeof (msg as Record<string, unknown>).role !== "string" ||
      typeof (msg as Record<string, unknown>).content !== "string"
    ) {
      return c.json({ error: "each message must have role and content strings" }, 400);
    }
    const content = (msg as Record<string, unknown>).content as string;
    if (content.length > 4000) {
      return c.json({ error: "message content exceeds 4000 characters" }, 400);
    }
  }

  try {
    const result = streamChat(messages as ModelMessage[], {
      system: typeof system === "string" ? system : undefined,
      model: typeof model === "string" ? model : undefined,
    });
    return result.toUIMessageStreamResponse({
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return c.json(
      { error: "AI service error", message: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});

export default aiRoutes;
