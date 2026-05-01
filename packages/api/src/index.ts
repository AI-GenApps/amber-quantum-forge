import { Hono } from "hono";
import { handle } from "hono/vercel";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import configRoutes from "./routes/config";

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

app.route("/auth", authRoutes);
app.route("/profile", profileRoutes);
app.route("/config", configRoutes);

app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ error: "Internal server error", message: err.message }, 500);
});

export default handle(app);
