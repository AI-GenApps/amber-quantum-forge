import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: !process.env.MERGE_RELAY_TEST_DATABASE_URL,
    include: ["src/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
  },
});
