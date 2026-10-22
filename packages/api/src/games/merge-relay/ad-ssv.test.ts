import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { AdSsvRuntime } from "./ad-ssv-contracts";
import { createAdSsvRewardProvider, recordAdSsv } from "./ad-ssv-service";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { InMemoryMergeRelayStore } from "./memory-store";

const now = new Date("2026-01-01T00:00:00.000Z");
const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const pem = publicKey.export({ type: "spki", format: "pem" }).toString();

const runtime: AdSsvRuntime = {
  keySource: { getKey: async (keyId) => (keyId === "1" ? pem : null) },
  allowedAdUnits: ["unit-1"],
  maxAgeMs: 3_600_000,
};

function dependencies(): MergeRelayServiceDependencies {
  return {
    store: new InMemoryMergeRelayStore(),
    clock: { now: () => now },
    rewardProvider: null,
    adSsvRuntimeForEnvironment: () => runtime,
  };
}

function query(overrides: Record<string, string> = {}, keyId = "1", tamper = false): string {
  const params = {
    ad_network: "5450213213286189855",
    ad_unit: "unit-1",
    custom_data: "result_1",
    reward_amount: "1",
    reward_item: "hint",
    timestamp: String(now.getTime()),
    transaction_id: "tx-1",
    user_id: "player_1",
    ...overrides,
  };
  const message = new URLSearchParams(params).toString();
  const signature = sign("SHA256", Buffer.from(message), privateKey).toString("base64url");
  return `${tamper ? message.replace("reward_amount=1", "reward_amount=9") : message}&signature=${signature}&key_id=${keyId}`;
}

describe("AdMob rewarded SSV", () => {
  it("records a signed callback once and replays duplicates", async () => {
    const deps = dependencies();
    const first = await recordAdSsv(deps, "debug", query());
    expect(first.replayed).toBe(false);
    expect((await recordAdSsv(deps, "debug", query())).replayed).toBe(true);
  });

  it.each([
    ["tampered parameters", query({}, "1", true)],
    ["unknown key", query({}, "2")],
    ["unlisted ad unit", query({ ad_unit: "other" })],
    ["stale timestamp", query({ timestamp: String(now.getTime() - 7_200_000) })],
    ["missing subject", query({ user_id: "" })],
    ["unsigned", "ad_unit=unit-1&transaction_id=tx"],
  ])("rejects %s", async (_label, raw) => {
    await expect(recordAdSsv(dependencies(), "debug", raw)).rejects.toMatchObject({
      code: "ad_ssv_invalid",
    });
  });

  it("rejects a reused transaction bound to another subject", async () => {
    const deps = dependencies();
    await recordAdSsv(deps, "debug", query());
    await expect(recordAdSsv(deps, "debug", query({ user_id: "player_2" }))).rejects.toMatchObject({
      code: "ad_ssv_conflict",
    });
  });

  it("is unavailable without runtime configuration", async () => {
    const deps = { ...dependencies(), adSsvRuntimeForEnvironment: () => null };
    await expect(recordAdSsv(deps, "debug", query())).rejects.toMatchObject({
      code: "ad_ssv_unconfigured",
    });
  });

  it("settles rewards only for the recorded subject and result", async () => {
    const deps = dependencies();
    await recordAdSsv(deps, "debug", query());
    const provider = createAdSsvRewardProvider(deps.store);
    const request = {
      resultId: "result_1",
      kind: "ad_reward" as const,
      productId: "hint",
      providerTransactionId: "tx-1",
    };
    const context = {
      environment: "debug" as const,
      subject: "player_1",
      resultId: "result_1",
      productId: "hint",
      kind: "ad_reward" as const,
    };
    expect((await provider.verifySettlement(request, context)).verified).toBe(true);
    expect(
      (await provider.verifySettlement(request, { ...context, subject: "player_2" })).verified,
    ).toBe(false);
    expect(
      (await provider.verifySettlement(request, { ...context, resultId: "result_2" })).verified,
    ).toBe(false);
    expect(
      (await provider.verifySettlement({ ...request, providerTransactionId: "tx-9" }, context))
        .verified,
    ).toBe(false);
  });
});
