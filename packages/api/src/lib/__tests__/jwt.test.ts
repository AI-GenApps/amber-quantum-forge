import { expect, test } from "vitest";
import { generateRefreshToken, hashRefreshToken, signAccessToken, verifyAccessToken } from "../jwt";

test("signs and verifies access token", async () => {
  const payload = {
    sub: "uid123",
    uid: "uid123",
    email: "a@b.com",
    emailVerified: true,
    provider: "google.com",
    admin: false,
  };
  const token = await signAccessToken(payload);
  const verified = await verifyAccessToken(token);
  expect(verified.uid).toBe("uid123");
  expect(verified.admin).toBe(false);
});

test("generateRefreshToken returns 64-char hex string", () => {
  const token = generateRefreshToken();
  expect(token).toHaveLength(64);
  expect(token).toMatch(/^[0-9a-f]+$/);
});

test("hashRefreshToken is deterministic", () => {
  const token = "abc123";
  expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
});
