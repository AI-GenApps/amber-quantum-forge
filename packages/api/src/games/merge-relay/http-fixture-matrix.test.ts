import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { collectErrors } from "./http-fixture-errors";
import { collectOutcomes } from "./http-fixture-outcomes";

const fixturePath = new URL("./fixtures/merge-relay-v1-http-matrix.json", import.meta.url);

describe("Merge Relay v1 HTTP outcome and error matrix fixture", () => {
  it("matches the route-produced outcomes and error codes", async () => {
    const generated = { outcomes: await collectOutcomes(), errors: await collectErrors() };
    if (process.env.MERGE_RELAY_FIXTURE_UPDATE === "1") {
      writeFileSync(fixturePath, `${JSON.stringify(generated, null, 2)}\n`);
    }
    const stored = JSON.parse(readFileSync(fixturePath, "utf8"));
    expect(generated).toEqual(stored);
  });
});
