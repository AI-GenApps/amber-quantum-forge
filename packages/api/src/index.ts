import { Hono } from "hono";
import { handle } from "hono/vercel";
import aiRoutes from "./routes/ai";
import authRoutes from "./routes/auth";
import { authTokenRoutes } from "./routes/auth-tokens";
import chatRoutes from "./routes/chat";
import configRoutes from "./routes/config";
import profileRoutes from "./routes/profile";

const app = new Hono();

app.use("/*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (c.req.method === "OPTIONS") {
    return c.newResponse(null, 204);
  }
  await next();
});

app.get("/", (c) => {
  return c.json({ message: "Hono API is running" });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.route("/auth", authRoutes);
app.route("/auth", authTokenRoutes);
app.route("/ai", aiRoutes);
app.route("/chat", chatRoutes);
app.route("/profile", profileRoutes);
app.route("/config", configRoutes);

app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ error: "Internal server error", message: err.message }, 500);
});

export { app };
export default handle(app);
