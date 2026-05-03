import { chatMessages, db, eq, users } from "@repo/db";
import { Hono } from "hono";
import { type AuthUser, authMiddleware } from "../middleware/auth";

const chatRoutes = new Hono();

chatRoutes.post("/sync", authMiddleware, async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { messages } = body as { messages?: unknown };

  if (!Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: "messages must be a non-empty array" }, 400);
  }

  if (messages.length > 100) {
    return c.json({ error: "messages array exceeds maximum of 100" }, 400);
  }

  for (const msg of messages) {
    const m = msg as Record<string, unknown>;
    if (
      typeof m.clientId !== "string" ||
      m.clientId.length === 0 ||
      (m.role !== "user" && m.role !== "assistant") ||
      typeof m.content !== "string" ||
      m.content.length === 0 ||
      m.content.length > 10000 ||
      typeof m.createdAt !== "string" ||
      Number.isNaN(Date.parse(m.createdAt))
    ) {
      return c.json({ error: "invalid message format" }, 400);
    }
  }

  const user = c.get("user") as AuthUser;

  const userResults = await db
    .select()
    .from(users)
    .where(eq(users.email, user.email || ""))
    .limit(1);
  const userRecord = userResults[0];

  if (!userRecord) {
    return c.json({ error: "User not found" }, 404);
  }

  const rows = (messages as Array<Record<string, string>>).map((m) => ({
    clientId: m.clientId,
    userId: userRecord.id,
    role: m.role,
    content: m.content,
    createdAtClient: new Date(m.createdAt),
  }));

  const inserted = await db.insert(chatMessages).values(rows).onConflictDoNothing().returning();

  return c.json({
    synced: inserted.length,
    skipped: rows.length - inserted.length,
  });
});

export default chatRoutes;
