/// Real-money store state (task 26g): RevenueCat offerings, package
/// purchase, restore, and the server sync that follows both.
///
/// The client never trusts its own purchase result: after any successful
/// `purchasePackage` or `restorePurchases` this calls task 26d's
/// `POST revenuecat/sync` and then refreshes the wallet from the server, so
/// what the player sees is what the server granted. With no RevenueCat key
/// ([LudoPurchasesGateway.isAvailable] false) [availability] is
/// [LudoIapAvailability.unavailable] and nothing else here does anything —
/// the coin/diamond store keeps working because it never depends on this.
library;

import 'package:flutter/foundation.dart';

import '../net/ludo_auth_controller.dart';
import '../net/ludo_gateway.dart';
import '../net/ludo_purchases_gateway.dart';
import '../net/ludo_store_models.dart';
import 'ludo_inventory_state.dart';
import 'ludo_wallet_state.dart';

enum LudoIapAvailability { unavailable, loading, ready, error }

enum LudoIapOutcome {
  /// Purchased (or restored) and the server confirmed the sync.
  success,

  /// The player backed out of the store sheet. Nothing was charged.
  cancelled,

  /// The store reports success but the server sync did not complete; the
  /// next load/restore retries it. Never claims the balance changed.
  syncPending,
  unavailable,
  busy,
  failed,
}

/// One purchasable product: the store's localized offer joined with the
/// server's description of what it grants.
final class LudoIapOffer {
  const LudoIapOffer({required this.package, this.info});

  final LudoStorePackage package;
  final LudoIapProductInfo? info;

  String get productId => package.productId;
  String get title => info?.displayName ?? package.title;
  String get priceString => package.priceString;
  bool get isSubscription => info?.isSubscription ?? false;
  int? get grantsCoins => info?.grantsCoins;
  int? get grantsDiamonds => info?.grantsDiamonds;
}

class LudoIapState extends ChangeNotifier {
  LudoIapState({
    required this.purchases,
    required this.gateway,
    required this.authController,
    required this.walletState,
    required this.inventoryState,
  });

  final LudoPurchasesGateway purchases;
  final LudoGateway gateway;
  final LudoAuthController authController;
  final LudoWalletState walletState;
  final LudoInventoryState inventoryState;

  LudoIapAvailability _availability = LudoIapAvailability.loading;
  List<LudoIapOffer> _offers = const [];
  bool _passActive = false;
  bool _syncPending = false;
  bool _busy = false;
  bool _loggedIn = false;

  LudoIapAvailability get availability => _availability;
  List<LudoIapOffer> get offers => _offers;
  bool get passActive => _passActive;
  bool get busy => _busy;

  /// A real purchase succeeded in the store but the server sync has not
  /// confirmed yet.
  bool get syncPending => _syncPending;

  List<LudoIapOffer> get currencyOffers => [
    for (final offer in _offers)
      if (!offer.isSubscription) offer,
  ];

  List<LudoIapOffer> get passOffers => [
    for (final offer in _offers)
      if (offer.isSubscription) offer,
  ];

  Future<void> load() async {
    if (!purchases.isAvailable) {
      _availability = LudoIapAvailability.unavailable;
      notifyListeners();
      return;
    }
    _availability = LudoIapAvailability.loading;
    notifyListeners();
    try {
      final gameToken = await authController.ensureGameToken();
      if (!_loggedIn) {
        final uid = authController.state?.uid;
        if (uid == null) throw StateError('no signed-in user');
        await purchases.logIn(uid);
        _loggedIn = true;
      }
      final packages = await purchases.getPackages();
      final infoById = {
        for (final info in inventoryState.iapProducts) info.productId: info,
      };
      _offers = [
        for (final package in packages)
          LudoIapOffer(package: package, info: infoById[package.productId]),
      ];
      _availability = LudoIapAvailability.ready;
      if (_syncPending) await _sync(gameToken);
    } on Object {
      _availability = LudoIapAvailability.error;
    }
    notifyListeners();
  }

  Future<LudoIapOutcome> buy(LudoIapOffer offer) async {
    if (!purchases.isAvailable) return LudoIapOutcome.unavailable;
    if (_busy) return LudoIapOutcome.busy;
    _busy = true;
    notifyListeners();
    try {
      final status = await purchases.purchase(offer.package);
      switch (status) {
        case LudoStorePurchaseStatus.cancelled:
          return LudoIapOutcome.cancelled;
        case LudoStorePurchaseStatus.failed:
          return LudoIapOutcome.failed;
        case LudoStorePurchaseStatus.success:
          return await _syncAfterStoreSuccess();
      }
    } on Object {
      return LudoIapOutcome.failed;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<LudoIapOutcome> restore() async {
    if (!purchases.isAvailable) return LudoIapOutcome.unavailable;
    if (_busy) return LudoIapOutcome.busy;
    _busy = true;
    notifyListeners();
    try {
      if (!await purchases.restore()) return LudoIapOutcome.failed;
      return await _syncAfterStoreSuccess();
    } on Object {
      return LudoIapOutcome.failed;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<LudoIapOutcome> _syncAfterStoreSuccess() async {
    try {
      final gameToken = await authController.ensureGameToken();
      final confirmed = await _sync(gameToken);
      return confirmed ? LudoIapOutcome.success : LudoIapOutcome.syncPending;
    } on Object {
      _syncPending = true;
      return LudoIapOutcome.syncPending;
    }
  }

  Future<bool> _sync(String gameToken) async {
    final result = await gateway.syncRevenueCat(gameToken: gameToken);
    if (!result.synced) {
      _syncPending = true;
      return false;
    }
    _syncPending = false;
    _passActive = result.passActive;
    await walletState.refresh();
    return true;
  }
}
