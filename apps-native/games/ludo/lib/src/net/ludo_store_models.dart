/// Wire DTOs for the store routes (task 26g): the coin/diamond purchase
/// response, the IAP product list served beside the theme catalog, and the
/// RevenueCat sync response. Kept apart from `ludo_gateway.dart` so that
/// file stays focused on request shaping.
library;

import 'ludo_wire_json.dart';

/// The item row inside a `POST .../inventory/purchase` response.
final class LudoPurchasedItem {
  const LudoPurchasedItem({
    required this.itemId,
    required this.itemType,
    required this.acquiredVia,
    required this.acquiredAt,
  });

  final String itemId;
  final String itemType;
  final String acquiredVia;
  final String acquiredAt;

  static LudoPurchasedItem fromWire(LudoJson value) {
    requireFields(value, {
      'item_id',
      'item_type',
      'acquired_via',
      'acquired_at',
    }, 'purchased item');
    return LudoPurchasedItem(
      itemId: readText(value, 'item_id', 128),
      itemType: readText(value, 'item_type', 32),
      acquiredVia: readText(value, 'acquired_via', 32),
      acquiredAt: readText(value, 'acquired_at', 64),
    );
  }
}

/// `POST /games/ludo/:environment/inventory/purchase` (task 26g).
final class LudoPurchaseResult {
  const LudoPurchaseResult({
    required this.idempotent,
    required this.item,
    required this.coins,
    required this.diamonds,
  });

  /// `true` when the server replayed an already-applied idempotency key
  /// instead of debiting again.
  final bool idempotent;
  final LudoPurchasedItem item;

  /// The wallet balances after the purchase.
  final int coins;
  final int diamonds;

  static LudoPurchaseResult fromWire(LudoJson value) {
    requireFields(value, {
      'idempotent',
      'item',
      'coins',
      'diamonds',
    }, 'purchase response');
    return LudoPurchaseResult(
      idempotent: readBoolean(value, 'idempotent'),
      item: LudoPurchasedItem.fromWire(asJsonObject(value['item'], 'item')),
      coins: readInteger(value, 'coins'),
      diamonds: readInteger(value, 'diamonds'),
    );
  }
}

/// One row of `GET .../inventory`'s `iap_products` array: the server's
/// source of truth for what each real-money product grants. Prices are
/// deliberately absent — localized prices only ever come from the store
/// via RevenueCat.
final class LudoIapProductInfo {
  const LudoIapProductInfo({
    required this.productId,
    required this.displayName,
    required this.kind,
    required this.grantsCoins,
    required this.grantsDiamonds,
  });

  final String productId;
  final String displayName;

  /// `consumable`, `non_consumable` or `subscription`.
  final String kind;
  final int? grantsCoins;
  final int? grantsDiamonds;

  bool get isSubscription => kind == 'subscription';

  static LudoIapProductInfo fromWire(LudoJson value) {
    requireFields(
      value,
      {'product_id', 'display_name', 'kind'},
      'iap product',
      optional: {'grants_coins', 'grants_diamonds'},
    );
    return LudoIapProductInfo(
      productId: readText(value, 'product_id', 128),
      displayName: readText(value, 'display_name', 128),
      kind: readText(value, 'kind', 32),
      grantsCoins: readOptionalInteger(value, 'grants_coins'),
      grantsDiamonds: readOptionalInteger(value, 'grants_diamonds'),
    );
  }
}

/// `POST /games/ludo/:environment/revenuecat/sync` (task 26d).
final class LudoRevenueCatSyncResult {
  const LudoRevenueCatSyncResult({
    required this.synced,
    required this.grantedPurchases,
    required this.passActive,
    this.reason,
  });

  /// `false` when the server had no RevenueCat access (`reason` says why);
  /// nothing was reconciled, so callers must not claim a purchase landed.
  final bool synced;
  final String? reason;
  final int grantedPurchases;

  /// Whether the server now records an active Vortex Pass subscription.
  final bool passActive;

  static LudoRevenueCatSyncResult fromWire(LudoJson value) {
    requireFields(
      value,
      {'synced'},
      'revenuecat sync response',
      optional: {'reason', 'grantedPurchases', 'subscription'},
    );
    final subscription = value['subscription'];
    var passActive = false;
    if (subscription is Map) {
      passActive = subscription['status'] == 'active';
    }
    return LudoRevenueCatSyncResult(
      synced: readBoolean(value, 'synced'),
      reason: value['reason'] is String ? value['reason'] as String : null,
      grantedPurchases: value['grantedPurchases'] is int
          ? value['grantedPurchases'] as int
          : 0,
      passActive: passActive,
    );
  }
}
