import { describe, expect, it } from "vitest";
import { createPurchaseTokenVault } from "./commerce-vault";

describe("Merge Relay purchase token vault", () => {
  it("round trips a token with environment and subject binding", () => {
    const vault = createPurchaseTokenVault(Buffer.alloc(32, 9));
    const envelope = vault.seal({
      environment: "debug",
      subject: "player",
      purchaseToken: "token-value",
    });
    expect(vault.open({ environment: "debug", subject: "player", envelope })).toBe("token-value");
  });

  it("rejects a copied envelope from another scope", () => {
    const vault = createPurchaseTokenVault(Buffer.alloc(32, 9));
    const envelope = vault.seal({
      environment: "debug",
      subject: "player",
      purchaseToken: "token-value",
    });
    expect(() => vault.open({ environment: "staging", subject: "player", envelope })).toThrow();
    expect(() => vault.open({ environment: "debug", subject: "other", envelope })).toThrow();
  });
});
