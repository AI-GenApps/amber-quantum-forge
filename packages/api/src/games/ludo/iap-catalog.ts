/**
 * Task 26d: RevenueCat product id -> grant mapping, derived from task 26a's
 * `iapProducts`/`vortexPass` config rather than hand-duplicated, so a new
 * product only needs to be added in one place (`economy-config.ts`). No
 * `ludo_noads`/Remove-Ads entry exists here, matching the approved decision
 * to drop that product.
 */
import type { LudoCurrency, LudoEconomyConfig } from "./economy-config";
import { getEconomyConfig } from "./economy-config";

export interface LudoIapCurrencyCredit {
  currency: LudoCurrency;
  amount: number;
}

export type LudoIapGrant =
  | { kind: "currency"; credits: LudoIapCurrencyCredit[] }
  | { kind: "vortex_pass" };

/**
 * Builds the product-id -> grant map from an economy config. IAP product
 * identifiers are stable across app releases (unlike per-match economy
 * config versions), so callers use the latest config unless a specific
 * historical version is needed for a test.
 */
export function buildLudoIapCatalog(
  config: LudoEconomyConfig = getEconomyConfig(),
): Map<string, LudoIapGrant> {
  const catalog = new Map<string, LudoIapGrant>();
  for (const product of config.iapProducts) {
    if (product.kind === "subscription") {
      catalog.set(product.productId, { kind: "vortex_pass" });
      continue;
    }
    const credits: LudoIapCurrencyCredit[] = [];
    if (product.grantsCoins) credits.push({ currency: "coins", amount: product.grantsCoins });
    if (product.grantsDiamonds) {
      credits.push({ currency: "diamonds", amount: product.grantsDiamonds });
    }
    catalog.set(product.productId, { kind: "currency", credits });
  }
  return catalog;
}

export function lookupLudoIapGrant(
  productId: string,
  config: LudoEconomyConfig = getEconomyConfig(),
): LudoIapGrant | undefined {
  return buildLudoIapCatalog(config).get(productId);
}
