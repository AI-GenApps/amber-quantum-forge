/// Guarded RevenueCat (`purchases_flutter`) abstraction (task 26g), the
/// real-money counterpart of `ludo_firebase_gateway.dart`'s discipline:
///
/// - `purchases_flutter` types are never referenced outside this file.
///   Every other Ludo source (state, screens) depends only on
///   [LudoPurchasesGateway], so widget/unit tests inject a fake instead of
///   touching real plugin channels (which don't exist under `flutter test`).
/// - The app boots, plays every local mode and shows the store's
///   coin/diamond tabs with **no RevenueCat key at all**: when
///   `--dart-define=REVENUECAT_API_KEY=...` is absent (or the plugin fails
///   to configure), [createLudoPurchasesGateway] returns an
///   [UnavailableLudoPurchasesGateway] and the real-money tabs render a
///   "store unavailable" state instead of crashing.
/// - This app is a standalone Flutter app, not a package linked under
///   `apps-native/flutter-app` (whose `main.dart` configures its own
///   `purchases_flutter`), so it configures its own instance here, once,
///   lazily — never at process start, so a missing plugin cannot affect
///   startup.
/// - Identity follows `apps/native/services/revenuecat.ts`: RevenueCat is
///   logged in with *our* Firebase-UID-derived subject (the Ludo game token
///   subject) after auth, never an anonymous RevenueCat id, so the
///   server-side webhook's `app_user_id` lines up with the wallet owner.
library;

import 'dart:async';

import 'package:flutter/services.dart' show PlatformException;
import 'package:purchases_flutter/purchases_flutter.dart' as rc;

/// Build-time RevenueCat public SDK key, e.g.
/// `--dart-define=REVENUECAT_API_KEY=goog_...`. Empty (the default) means
/// "store unavailable", never an error. Never hardcode a key here.
const ludoRevenueCatApiKey = String.fromEnvironment('REVENUECAT_API_KEY');

/// One purchasable real-money package, narrowed to what the store UI needs.
final class LudoStorePackage {
  const LudoStorePackage({
    required this.productId,
    required this.title,
    required this.priceString,
    this.handle,
  });

  /// The store product id, e.g. `ludo_coins_small`, with any Google Play
  /// base-plan suffix (`:monthly`) removed.
  final String productId;
  final String title;

  /// Localized price from the store, e.g. `Rs 99.00`. Display only: the
  /// server never trusts a client-reported price.
  final String priceString;

  /// Opaque gateway-private reference (the underlying SDK package).
  final Object? handle;
}

enum LudoStorePurchaseStatus { success, cancelled, failed }

/// The narrow slice of `purchases_flutter` Ludo depends on.
abstract interface class LudoPurchasesGateway {
  /// `false` when no RevenueCat key is configured or the SDK could not be
  /// configured. Every other member is then a safe no-op.
  bool get isAvailable;

  /// Identifies the RevenueCat customer as [appUserId] (the game token
  /// subject). Must be called after auth, before purchases.
  Future<void> logIn(String appUserId);

  /// Loads every package from every RevenueCat offering.
  Future<List<LudoStorePackage>> getPackages();

  /// Runs the store purchase flow for [package]. Never grants anything
  /// itself: the caller must sync with the server afterwards.
  Future<LudoStorePurchaseStatus> purchase(LudoStorePackage package);

  /// Restores prior purchases. Returns `true` if the SDK call succeeded
  /// (the caller still syncs with the server; restore itself grants nothing
  /// client-side).
  Future<bool> restore();
}

/// The no-op gateway used when RevenueCat keys are absent.
final class UnavailableLudoPurchasesGateway implements LudoPurchasesGateway {
  const UnavailableLudoPurchasesGateway();

  @override
  bool get isAvailable => false;

  @override
  Future<void> logIn(String appUserId) async {}

  @override
  Future<List<LudoStorePackage>> getPackages() async => const [];

  @override
  Future<LudoStorePurchaseStatus> purchase(LudoStorePackage package) async =>
      LudoStorePurchaseStatus.failed;

  @override
  Future<bool> restore() async => false;
}

String _baseProductId(String identifier) => identifier.split(':').first;

/// The real `purchases_flutter`-backed gateway. Construct only through
/// [createLudoPurchasesGateway], which configures the SDK first.
final class RevenueCatLudoPurchasesGateway implements LudoPurchasesGateway {
  RevenueCatLudoPurchasesGateway._();

  @override
  bool get isAvailable => true;

  @override
  Future<void> logIn(String appUserId) async {
    await rc.Purchases.logIn(appUserId);
  }

  @override
  Future<List<LudoStorePackage>> getPackages() async {
    final offerings = await rc.Purchases.getOfferings();
    final seen = <String>{};
    final packages = <LudoStorePackage>[];
    for (final offering in offerings.all.values) {
      for (final package in offering.availablePackages) {
        final productId = _baseProductId(package.storeProduct.identifier);
        if (!seen.add(productId)) continue;
        packages.add(
          LudoStorePackage(
            productId: productId,
            title: package.storeProduct.title,
            priceString: package.storeProduct.priceString,
            handle: package,
          ),
        );
      }
    }
    return packages;
  }

  @override
  Future<LudoStorePurchaseStatus> purchase(LudoStorePackage package) async {
    final handle = package.handle;
    if (handle is! rc.Package) return LudoStorePurchaseStatus.failed;
    try {
      await rc.Purchases.purchasePackage(handle);
      return LudoStorePurchaseStatus.success;
    } on PlatformException catch (error) {
      final code = rc.PurchasesErrorHelper.getErrorCode(error);
      if (code == rc.PurchasesErrorCode.purchaseCancelledError) {
        return LudoStorePurchaseStatus.cancelled;
      }
      return LudoStorePurchaseStatus.failed;
    } on Object {
      return LudoStorePurchaseStatus.failed;
    }
  }

  @override
  Future<bool> restore() async {
    try {
      await rc.Purchases.restorePurchases();
      return true;
    } on Object {
      return false;
    }
  }
}

bool _configured = false;

/// Resolves the production [LudoPurchasesGateway]. Never throws: an empty
/// [apiKey] or any plugin/configuration failure yields the
/// [UnavailableLudoPurchasesGateway].
Future<LudoPurchasesGateway> createLudoPurchasesGateway({
  String apiKey = ludoRevenueCatApiKey,
}) async {
  if (apiKey.trim().isEmpty) return const UnavailableLudoPurchasesGateway();
  try {
    if (!_configured) {
      await rc.Purchases.configure(rc.PurchasesConfiguration(apiKey.trim()));
      _configured = true;
    }
    return RevenueCatLudoPurchasesGateway._();
  } on Object {
    return const UnavailableLudoPurchasesGateway();
  }
}
