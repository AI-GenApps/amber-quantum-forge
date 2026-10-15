/// Owned items, equip selection and coin/diamond purchases (task 26g).
///
/// Ownership and prices come from `GET inventory` (the server is the source
/// of truth); a coin/diamond purchase is a single `POST inventory/purchase`
/// call whose response carries the new balances, so there is never a
/// client-side debit. Equipping is local and optimistic: the selection is
/// applied immediately and persisted through [LudoEquipStore], with no
/// server round trip.
///
/// Like [LudoWalletState], nothing here throws to callers: network/auth
/// failures become a [LudoPurchaseOutcome] or flip [isOffline].
library;

import 'package:flutter/foundation.dart';

import '../net/ludo_auth_controller.dart';
import '../net/ludo_gateway.dart';
import '../net/ludo_store_models.dart';
import '../net/ludo_wire_json.dart';
import 'ludo_equip_store.dart';
import 'ludo_wallet_state.dart';

export 'ludo_equip_store.dart' show LudoThemeCategory;

enum LudoInventoryLoadStatus { idle, loading, ready, failed }

enum LudoCurrency {
  coins('coins'),
  diamonds('diamonds');

  const LudoCurrency(this.wire);

  final String wire;
}

enum LudoPurchaseOutcome {
  success,
  insufficientBalance,
  alreadyOwned,
  itemUnavailable,
  offline,
  busy,
  failed,
}

/// Generates a fresh idempotency key for one purchase attempt.
typedef LudoPurchaseKeyFactory = String Function();

int _keyCounter = 0;

String _defaultPurchaseKey() {
  _keyCounter += 1;
  return 'buy-${DateTime.now().microsecondsSinceEpoch}-$_keyCounter';
}

extension LudoCatalogItemX on LudoCatalogItem {
  LudoThemeCategory? get category => LudoThemeCategory.fromWire(itemType);

  /// A free starter item: never sold, always owned.
  bool get isFree => priceCoins == null && priceDiamonds == null;

  int? priceIn(LudoCurrency currency) =>
      currency == LudoCurrency.coins ? priceCoins : priceDiamonds;
}

class LudoInventoryState extends ChangeNotifier {
  LudoInventoryState({
    required this.gateway,
    required this.authController,
    required this.walletState,
    required this.equipStore,
    LudoPurchaseKeyFactory? purchaseKey,
  }) : _purchaseKey = purchaseKey ?? _defaultPurchaseKey;

  final LudoGateway gateway;
  final LudoAuthController authController;
  final LudoWalletState walletState;
  final LudoEquipStore equipStore;
  final LudoPurchaseKeyFactory _purchaseKey;

  LudoInventoryLoadStatus _status = LudoInventoryLoadStatus.idle;
  bool _isOffline = false;
  List<LudoCatalogItem> _catalog = const [];
  List<LudoIapProductInfo> _iapProducts = const [];
  final _owned = <String>{};
  final _equipped = <LudoThemeCategory, String>{};
  final _pendingKeys = <String, String>{};
  String? _purchasingItemId;

  LudoInventoryLoadStatus get status => _status;

  /// `true` when the latest [refresh] could not reach the server. A
  /// previously loaded catalog stays visible.
  bool get isOffline => _isOffline;
  List<LudoCatalogItem> get catalog => _catalog;
  List<LudoIapProductInfo> get iapProducts => _iapProducts;

  /// The item id whose purchase request is currently in flight, if any.
  String? get purchasingItemId => _purchasingItemId;

  List<LudoCatalogItem> itemsIn(LudoThemeCategory category) => [
    for (final item in _catalog)
      if (item.category == category) item,
  ];

  bool isOwned(LudoCatalogItem item) =>
      item.isFree || _owned.contains(item.itemId);

  LudoCatalogItem? _defaultFor(LudoThemeCategory category) {
    for (final item in itemsIn(category)) {
      if (item.isFree) return item;
    }
    return null;
  }

  /// The id equipped for [category]: the saved choice, else the category's
  /// free default item, else `<category>_default`.
  String equippedId(LudoThemeCategory category) =>
      _equipped[category] ??
      _defaultFor(category)?.itemId ??
      '${category.wire}_default';

  bool isEquipped(LudoCatalogItem item) {
    final category = item.category;
    return category != null && equippedId(category) == item.itemId;
  }

  /// Loads the saved equip selection, then refreshes from the server. The
  /// saved selection is applied first so a restart shows the right theme
  /// before (or without) any network.
  Future<void> load() async {
    final saved = await equipStore.load();
    _equipped
      ..clear()
      ..addAll(saved);
    notifyListeners();
    await refresh();
  }

  Future<void> refresh() async {
    if (_status != LudoInventoryLoadStatus.ready) {
      _status = LudoInventoryLoadStatus.loading;
      notifyListeners();
    }
    try {
      final gameToken = await authController.ensureGameToken();
      final result = await gateway.getInventory(gameToken: gameToken);
      _catalog = result.catalog;
      _iapProducts = result.iapProducts;
      _owned
        ..clear()
        ..addAll(result.inventory.map((row) => row.itemId));
      _dropUnownedEquips();
      _status = LudoInventoryLoadStatus.ready;
      _isOffline = false;
    } on Object {
      _isOffline = true;
      if (_status != LudoInventoryLoadStatus.ready) {
        _status = LudoInventoryLoadStatus.failed;
      }
    }
    notifyListeners();
  }

  void _dropUnownedEquips() {
    _equipped.removeWhere((category, itemId) {
      for (final item in itemsIn(category)) {
        if (item.itemId == itemId) return !isOwned(item);
      }
      return true;
    });
  }

  /// Equips an owned [item] immediately and persists the choice. Returns
  /// `false` (changing nothing) for an item that is not owned.
  Future<bool> equip(LudoCatalogItem item) async {
    final category = item.category;
    if (category == null || !isOwned(item)) return false;
    _equipped[category] = item.itemId;
    notifyListeners();
    await equipStore.save(Map.of(_equipped));
    return true;
  }

  /// Buys [item] with [currency] through the server. On success the item
  /// becomes owned and the wallet shows the server-confirmed balances.
  Future<LudoPurchaseOutcome> purchase(
    LudoCatalogItem item,
    LudoCurrency currency,
  ) async {
    if (_purchasingItemId != null) return LudoPurchaseOutcome.busy;
    if (item.priceIn(currency) == null) {
      return LudoPurchaseOutcome.itemUnavailable;
    }
    final attemptId = '${item.itemId}|${currency.wire}';
    final key = _pendingKeys.putIfAbsent(attemptId, _purchaseKey);
    _purchasingItemId = item.itemId;
    notifyListeners();
    try {
      final gameToken = await authController.ensureGameToken();
      final result = await gateway.purchaseInventoryItem(
        itemId: item.itemId,
        currency: currency.wire,
        idempotencyKey: key,
        gameToken: gameToken,
      );
      _pendingKeys.remove(attemptId);
      _owned.add(result.item.itemId);
      walletState.applyWalletSnapshot(
        coins: result.coins,
        diamonds: result.diamonds,
      );
      return LudoPurchaseOutcome.success;
    } on LudoApiException catch (error) {
      _pendingKeys.remove(attemptId);
      switch (error.code) {
        case 'ludo_insufficient_balance':
          return LudoPurchaseOutcome.insufficientBalance;
        case 'ludo_item_already_owned':
          _owned.add(item.itemId);
          return LudoPurchaseOutcome.alreadyOwned;
        case 'ludo_item_not_found':
        case 'ludo_purchase_invalid':
          return LudoPurchaseOutcome.itemUnavailable;
        default:
          return LudoPurchaseOutcome.failed;
      }
    } on LudoAuthFailure {
      return LudoPurchaseOutcome.offline;
    } on LudoProtocolException {
      return LudoPurchaseOutcome.failed;
    } on Object {
      return LudoPurchaseOutcome.offline;
    } finally {
      _purchasingItemId = null;
      notifyListeners();
    }
  }
}
