import type {
  MergeCommerceCatalog,
  MergeCommerceEntitlement,
  MergeCommercePurchase,
} from "./commerce-contracts";

export function commerceCatalogToWire(value: MergeCommerceCatalog) {
  return {
    enabled: value.enabled,
    products: value.products.map((product) => ({
      product_id: product.productId,
      entitlement_id: product.entitlementId,
      kind: product.kind,
    })),
  };
}

export function commercePurchaseToWire(value: MergeCommercePurchase) {
  return {
    purchase_id: value.purchaseId,
    provider: value.provider,
    product_id: value.productId,
    entitlement_id: value.entitlementId,
    order_id: value.orderId,
    state: value.state,
    acknowledged: value.acknowledged,
    client_request_id: value.clientRequestId,
    created_at: value.createdAt,
    updated_at: value.updatedAt,
  };
}

export function commerceEntitlementToWire(value: MergeCommerceEntitlement) {
  return {
    entitlement_id: value.entitlementId,
    product_id: value.productId,
    status: value.status,
    purchase_id: value.purchaseId,
    granted_at: value.grantedAt,
    updated_at: value.updatedAt,
  };
}
