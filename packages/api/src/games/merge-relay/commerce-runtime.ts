import { MERGE_RELAY_THEME_PRODUCT_ID, type MergeCommerceRuntime } from "./commerce-contracts";
import { createServiceAccountTokenSource } from "./commerce-google-auth";
import { GooglePlayPurchaseProvider } from "./commerce-provider";
import { createPurchaseTokenVault, purchaseTokenKeyFromEnvironment } from "./commerce-vault";
import type { MergeEnvironment } from "./contracts";

export function createCommerceRuntimeFromEnvironment(
  environment: MergeEnvironment,
): MergeCommerceRuntime | null {
  const prefix = `MERGE_RELAY_PLAY_${environment.toUpperCase()}_`;
  const packageName = process.env[`${prefix}PACKAGE_NAME`];
  const productId = process.env[`${prefix}PRODUCT_ID`];
  const serviceAccount = process.env[`${prefix}SERVICE_ACCOUNT_JSON`];
  if (
    !packageName ||
    productId !== MERGE_RELAY_THEME_PRODUCT_ID ||
    !serviceAccount ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,254}$/.test(packageName)
  )
    return null;
  const tokenSource = createServiceAccountTokenSource(serviceAccount);
  if (!tokenSource) return null;
  const key = purchaseTokenKeyFromEnvironment(environment);
  return {
    environment,
    config: { packageName, productId: MERGE_RELAY_THEME_PRODUCT_ID },
    provider: new GooglePlayPurchaseProvider(packageName, tokenSource),
    tokenVault: key ? createPurchaseTokenVault(key) : null,
  };
}
