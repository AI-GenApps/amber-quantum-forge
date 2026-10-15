/// Debug-only store scripting for the online preview mode (task 26g).
///
/// `PreviewLudoTransport` (`ludo_preview_online.dart`) delegates the
/// inventory/store routes here, so a physical device can walk the whole
/// store — browse, preview, buy with coins/diamonds, equip, insufficient
/// balance — with no real backend deployed, through the exact production
/// [LudoGateway] / `LudoInventoryState` code path. The catalog below
/// mirrors `packages/api/src/games/ludo/economy-config.ts` (it exists only
/// for this debug fake; the real client always reads the server's).
///
/// [PreviewLudoPurchasesGateway] stands in for RevenueCat in the same mode:
/// it lists offers with fake prices so the Currency Packs and Pass tabs
/// render, but a purchase attempt is always reported as cancelled — a
/// preview build can never complete (or fake completing) a real-money
/// purchase.
library;

import 'dart:convert';

import 'ludo_http.dart';
import 'ludo_purchases_gateway.dart';
import 'ludo_wire_json.dart' show ludoContractVersion;

typedef _Item = ({String id, String name, String type, int? coins, int? gems});

const _catalog = <_Item>[
  (id: 'dice_default', name: 'Default', type: 'dice', coins: null, gems: null),
  (
    id: 'dice_classic_wood',
    name: 'Classic Wood',
    type: 'dice',
    coins: 1500,
    gems: 30,
  ),
  (
    id: 'dice_neon_vortex',
    name: 'Neon Vortex',
    type: 'dice',
    coins: 1500,
    gems: 30,
  ),
  (id: 'dice_marble', name: 'Marble', type: 'dice', coins: 1500, gems: 30),
  (id: 'dice_galaxy', name: 'Galaxy', type: 'dice', coins: 1500, gems: 30),
  (id: 'dice_gold', name: 'Gold', type: 'dice', coins: 1500, gems: 30),
  (
    id: 'token_default',
    name: 'Default',
    type: 'token',
    coins: null,
    gems: null,
  ),
  (id: 'token_gem', name: 'Gem Tokens', type: 'token', coins: 2500, gems: 50),
  (
    id: 'token_robot',
    name: 'Robot Tokens',
    type: 'token',
    coins: 2500,
    gems: 50,
  ),
  (
    id: 'token_animal',
    name: 'Animal Tokens',
    type: 'token',
    coins: 2500,
    gems: 50,
  ),
  (
    id: 'board_default',
    name: 'Default',
    type: 'board',
    coins: null,
    gems: null,
  ),
  (
    id: 'board_cosmic',
    name: 'Cosmic Board',
    type: 'board',
    coins: null,
    gems: 80,
  ),
  (
    id: 'board_royal',
    name: 'Royal Board',
    type: 'board',
    coins: null,
    gems: 80,
  ),
];

typedef _Product = ({
  String id,
  String name,
  String kind,
  int? coins,
  int? gems,
  String price,
});

const _products = <_Product>[
  (
    id: 'ludo_starter_pack',
    name: 'Starter Pack',
    kind: 'consumable',
    coins: 3000,
    gems: 30,
    price: 'Rs 49.00',
  ),
  (
    id: 'ludo_coins_small',
    name: 'Coins - Small',
    kind: 'consumable',
    coins: 5500,
    gems: null,
    price: 'Rs 99.00',
  ),
  (
    id: 'ludo_coins_medium',
    name: 'Coins - Medium',
    kind: 'consumable',
    coins: 30000,
    gems: null,
    price: 'Rs 399.00',
  ),
  (
    id: 'ludo_diamonds_small',
    name: 'Diamonds - Small',
    kind: 'consumable',
    coins: null,
    gems: 100,
    price: 'Rs 149.00',
  ),
  (
    id: 'ludo_diamonds_medium',
    name: 'Diamonds - Medium',
    kind: 'consumable',
    coins: null,
    gems: 600,
    price: 'Rs 699.00',
  ),
  (
    id: 'ludo_vortex_pass_monthly',
    name: 'Vortex Pass (monthly)',
    kind: 'subscription',
    coins: null,
    gems: null,
    price: 'Rs 199.00',
  ),
];

/// Scripted store routes for the preview transport.
final class PreviewStoreBackend {
  final _owned = <String, String>{
    'dice_default': '2026-01-01T00:00:00.000Z',
    'token_default': '2026-01-01T00:00:00.000Z',
    'board_default': '2026-01-01T00:00:00.000Z',
  };
  final _appliedKeys = <String, String>{};

  /// Returns the response for a store route, or `null` when [path] is not
  /// one. [apply] writes the wallet balances back after a purchase.
  LudoHttpResponse? handle({
    required String method,
    required String path,
    required Map<String, Object?> body,
    required int coins,
    required int diamonds,
    required void Function(int coins, int diamonds) apply,
  }) {
    if (method == 'GET' && path == 'inventory') return _inventory();
    if (method == 'POST' && path == 'inventory/purchase') {
      return _purchase(body, coins, diamonds, apply);
    }
    if (method == 'POST' && path == 'revenuecat/sync') {
      return _json({
        'synced': true,
        'grantedPurchases': 0,
        'subscription': null,
      });
    }
    return null;
  }

  LudoHttpResponse _inventory() => _json({
    'inventory': [
      for (final entry in _owned.entries)
        {
          'item_id': entry.key,
          'item_type': _catalog.firstWhere((item) => item.id == entry.key).type,
          'acquired_via': entry.value.startsWith('2026-01')
              ? 'starter_grant'
              : 'store_purchase',
          'acquired_at': entry.value,
        },
    ],
    'catalog': [
      for (final item in _catalog)
        {
          'item_id': item.id,
          'display_name': item.name,
          'item_type': item.type,
          'price_coins': item.coins,
          'price_diamonds': item.gems,
        },
    ],
    'iap_products': [
      for (final product in _products)
        {
          'product_id': product.id,
          'display_name': product.name,
          'kind': product.kind,
          'grants_coins': product.coins,
          'grants_diamonds': product.gems,
        },
    ],
  });

  LudoHttpResponse _purchase(
    Map<String, Object?> body,
    int coins,
    int diamonds,
    void Function(int coins, int diamonds) apply,
  ) {
    final itemId = body['item_id'] as String? ?? '';
    final currency = body['currency'] as String? ?? '';
    final key = body['idempotency_key'] as String? ?? '';
    final item = _catalog.where((entry) => entry.id == itemId).firstOrNull;
    if (item == null) return _error(404, 'ludo_item_not_found');
    final price = currency == 'coins' ? item.coins : item.gems;
    if (price == null || (currency != 'coins' && currency != 'diamonds')) {
      return _error(422, 'ludo_purchase_invalid');
    }
    if (_appliedKeys[key] == itemId) {
      return _purchased(item, coins, diamonds, idempotent: true);
    }
    if (_owned.containsKey(itemId)) {
      return _error(409, 'ludo_item_already_owned');
    }
    final balance = currency == 'coins' ? coins : diamonds;
    if (balance < price) return _error(422, 'ludo_insufficient_balance');
    final newCoins = currency == 'coins' ? coins - price : coins;
    final newDiamonds = currency == 'diamonds' ? diamonds - price : diamonds;
    apply(newCoins, newDiamonds);
    _owned[itemId] = DateTime.now().toUtc().toIso8601String();
    _appliedKeys[key] = itemId;
    return _purchased(item, newCoins, newDiamonds, idempotent: false);
  }

  LudoHttpResponse _purchased(
    _Item item,
    int coins,
    int diamonds, {
    required bool idempotent,
  }) => _json({
    'idempotent': idempotent,
    'item': {
      'item_id': item.id,
      'item_type': item.type,
      'acquired_via': 'store_purchase',
      'acquired_at': _owned[item.id],
    },
    'coins': coins,
    'diamonds': diamonds,
  });

  LudoHttpResponse _json(Object? body) =>
      LudoHttpResponse(statusCode: 200, body: jsonEncode(body));

  LudoHttpResponse _error(int statusCode, String code) => LudoHttpResponse(
    statusCode: statusCode,
    body: jsonEncode({
      'contract_version': ludoContractVersion,
      'error': {
        'code': code,
        'message': 'preview error: $code',
        'diagnostic_id': 'preview',
      },
    }),
  );
}

/// RevenueCat stand-in for the debug preview: shows offers, never charges.
final class PreviewLudoPurchasesGateway implements LudoPurchasesGateway {
  const PreviewLudoPurchasesGateway();

  @override
  bool get isAvailable => true;

  @override
  Future<void> logIn(String appUserId) async {}

  @override
  Future<List<LudoStorePackage>> getPackages() async => [
    for (final product in _products)
      LudoStorePackage(
        productId: product.id,
        title: product.name,
        priceString: product.price,
      ),
  ];

  @override
  Future<LudoStorePurchaseStatus> purchase(LudoStorePackage package) async =>
      LudoStorePurchaseStatus.cancelled;

  @override
  Future<bool> restore() async => true;
}
