import { afterEach, describe, expect, it } from "vitest";
import { MERGE_RELAY_THEME_PRODUCT_ID } from "./commerce-contracts";
import { createCommerceRuntimeFromEnvironment } from "./commerce-runtime";

const account = JSON.stringify({
  client_email: "billing@example.invalid",
  private_key: "not-used-until-a-live-provider-call",
});

const environmentKeys = [
  "MERGE_RELAY_PLAY_DEBUG_PACKAGE_NAME",
  "MERGE_RELAY_PLAY_DEBUG_PRODUCT_ID",
  "MERGE_RELAY_PLAY_DEBUG_SERVICE_ACCOUNT_JSON",
  "MERGE_RELAY_PLAY_STAGING_PACKAGE_NAME",
  "MERGE_RELAY_PLAY_STAGING_PRODUCT_ID",
  "MERGE_RELAY_PLAY_STAGING_SERVICE_ACCOUNT_JSON",
  "MERGE_RELAY_PLAY_PACKAGE_NAME",
  "MERGE_RELAY_PLAY_PRODUCT_ID",
  "MERGE_RELAY_PLAY_SERVICE_ACCOUNT_JSON",
];
const originalEnvironment = new Map(environmentKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of environmentKeys) {
    const value = originalEnvironment.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("Merge Relay Play Billing runtime configuration", () => {
  it("selects only the requested environment and fixed product", () => {
    process.env.MERGE_RELAY_PLAY_DEBUG_PACKAGE_NAME = "app.w3dev.mergerelay";
    process.env.MERGE_RELAY_PLAY_DEBUG_PRODUCT_ID = MERGE_RELAY_THEME_PRODUCT_ID;
    process.env.MERGE_RELAY_PLAY_DEBUG_SERVICE_ACCOUNT_JSON = account;
    const runtime = createCommerceRuntimeFromEnvironment("debug");
    expect(runtime?.environment).toBe("debug");
    expect(runtime?.config.productId).toBe(MERGE_RELAY_THEME_PRODUCT_ID);
    expect(createCommerceRuntimeFromEnvironment("staging")).toBeNull();
  });

  it("ignores unscoped and wrong-product configuration", () => {
    process.env.MERGE_RELAY_PLAY_PACKAGE_NAME = "app.w3dev.mergerelay";
    process.env.MERGE_RELAY_PLAY_PRODUCT_ID = MERGE_RELAY_THEME_PRODUCT_ID;
    process.env.MERGE_RELAY_PLAY_SERVICE_ACCOUNT_JSON = account;
    expect(createCommerceRuntimeFromEnvironment("debug")).toBeNull();
    process.env.MERGE_RELAY_PLAY_DEBUG_PACKAGE_NAME = "app.w3dev.mergerelay";
    process.env.MERGE_RELAY_PLAY_DEBUG_PRODUCT_ID = "production_product";
    process.env.MERGE_RELAY_PLAY_DEBUG_SERVICE_ACCOUNT_JSON = account;
    expect(createCommerceRuntimeFromEnvironment("debug")).toBeNull();
  });
});
