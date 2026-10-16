import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    testTimeout: 60000,
    // Component tests need the real stylesheets (fonts, tokens), not empty stubs.
    css: true,
  },
});
