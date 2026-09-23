import type { MergeEnvironment } from "./contracts";

export const MERGE_PLAY_PROVIDER = "google_play_billing" as const;
export const MERGE_RELAY_THEME_PRODUCT_ID = "merge_relay_theme_pack_v1" as const;
export const MERGE_RELAY_THEME_ENTITLEMENT_ID = "merge_relay.theme_pack.v1" as const;

export type MergeCommercePurchaseState =
  | "pending"
  | "purchased"
  | "cancelled"
  | "refunded"
  | "revoked";
export type MergeCommerceEntitlementStatus = "active" | "revoked";

export interface MergeCommercePurchaseInput {
  productId: typeof MERGE_RELAY_THEME_PRODUCT_ID;
  purchaseToken: string;
  clientRequestId?: string;
}

export interface MergeCommercePurchase {
  purchaseId: string;
  environment: MergeEnvironment;
  subject: string;
  provider: typeof MERGE_PLAY_PROVIDER;
  productId: typeof MERGE_RELAY_THEME_PRODUCT_ID;
  entitlementId: typeof MERGE_RELAY_THEME_ENTITLEMENT_ID;
  purchaseTokenDigest: string;
  purchaseTokenEnvelope: MergePurchaseTokenEnvelope | null;
  orderId: string | null;
  state: MergeCommercePurchaseState;
  acknowledged: boolean;
  clientRequestId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MergeCommerceEntitlement {
  entitlementId: typeof MERGE_RELAY_THEME_ENTITLEMENT_ID;
  environment: MergeEnvironment;
  subject: string;
  productId: typeof MERGE_RELAY_THEME_PRODUCT_ID;
  purchaseId: string;
  status: MergeCommerceEntitlementStatus;
  grantedAt: string;
  updatedAt: string;
}

export interface MergeCommerceCatalogProduct {
  productId: typeof MERGE_RELAY_THEME_PRODUCT_ID;
  entitlementId: typeof MERGE_RELAY_THEME_ENTITLEMENT_ID;
  kind: "non_consumable";
}

export interface MergeCommerceCatalog {
  enabled: boolean;
  products: MergeCommerceCatalogProduct[];
}

export interface MergePlayPurchaseAttestation {
  state: MergeCommercePurchaseState;
  productId: typeof MERGE_RELAY_THEME_PRODUCT_ID;
  orderId: string | null;
  acknowledged: boolean;
  obfuscatedExternalAccountId: string | null;
}

export interface MergePlayPurchaseProvider {
  verifyPurchase(input: {
    productId: typeof MERGE_RELAY_THEME_PRODUCT_ID;
    purchaseToken: string;
  }): Promise<MergePlayPurchaseAttestation>;
  acknowledgePurchase(input: {
    productId: typeof MERGE_RELAY_THEME_PRODUCT_ID;
    purchaseToken: string;
  }): Promise<void>;
}

export interface MergePurchaseTokenEnvelope {
  version: 1;
  ciphertext: string;
  iv: string;
  authTag: string;
}

export interface MergePurchaseTokenVault {
  seal(input: {
    environment: MergeEnvironment;
    subject: string;
    purchaseToken: string;
  }): MergePurchaseTokenEnvelope;
  open(input: {
    environment: MergeEnvironment;
    subject: string;
    envelope: MergePurchaseTokenEnvelope;
  }): string;
}

export interface MergeCommerceRuntime {
  environment: MergeEnvironment;
  config: {
    packageName: string;
    productId: typeof MERGE_RELAY_THEME_PRODUCT_ID;
  };
  provider: MergePlayPurchaseProvider;
  tokenVault: MergePurchaseTokenVault | null;
}

export interface MergeCommerceSettlement {
  purchase: MergeCommercePurchase;
  entitlement: MergeCommerceEntitlement | null;
  replayed: boolean;
  restored: boolean;
}
