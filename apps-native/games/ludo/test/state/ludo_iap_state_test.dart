import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/net/ludo_http.dart';
import 'package:ludo/src/net/ludo_purchases_gateway.dart';
import 'package:ludo/src/state/ludo_iap_state.dart';

import '../net/ludo_test_support.dart';
import 'ludo_store_test_support.dart';

Map<String, List<LudoHttpResponse>> _syncOk({
  int granted = 1,
  bool pass = false,
}) => {
  'POST revenuecat/sync': [
    jsonResponse({
      'synced': true,
      'grantedPurchases': granted,
      'subscription': pass
          ? {'status': 'active', 'productId': 'ludo_vortex_pass_monthly'}
          : null,
    }),
  ],
};

void main() {
  test('with no RevenueCat key the state is unavailable and inert', () async {
    final harness = StoreHarness.create(
      purchases: FakePurchasesGateway(available: false),
    );

    await harness.iap.load();

    expect(harness.iap.availability, LudoIapAvailability.unavailable);
    expect(harness.iap.offers, isEmpty);
    expect(
      await harness.iap.restore(),
      LudoIapOutcome.unavailable,
      reason: 'restore must be a graceful no-op',
    );
    expect(harness.transport.requestsFor('POST revenuecat/sync'), isEmpty);
  });

  test('the unavailable gateway never throws', () async {
    const gateway = UnavailableLudoPurchasesGateway();
    expect(gateway.isAvailable, isFalse);
    await gateway.logIn('uid-1');
    expect(await gateway.getPackages(), isEmpty);
    expect(await gateway.restore(), isFalse);
    expect(
      await createLudoPurchasesGateway(apiKey: ''),
      isA<UnavailableLudoPurchasesGateway>(),
    );
    // No plugin channel exists under flutter test: configuring must degrade
    // to the no-op gateway, never throw.
    expect(
      await createLudoPurchasesGateway(apiKey: 'test_key_not_real'),
      isA<UnavailableLudoPurchasesGateway>(),
    );
  });

  test('load logs RevenueCat in with the game-token subject and joins '
      'offers with server product info', () async {
    final harness = StoreHarness.create();
    await harness.inventory.load();

    await harness.iap.load();

    expect(harness.iap.availability, LudoIapAvailability.ready);
    expect(harness.purchases.loggedInAs, ['uid-1']);
    expect(harness.iap.currencyOffers.single.title, 'Coins - Small');
    expect(harness.iap.currencyOffers.single.grantsCoins, 5500);
    expect(harness.iap.currencyOffers.single.priceString, r'$1.99');
    expect(harness.iap.passOffers.single.isSubscription, isTrue);
  });

  test('a successful purchase syncs with the server then refreshes the '
      'wallet', () async {
    final harness = StoreHarness.create(
      script: {
        ..._syncOk(),
        'GET wallet': [
          jsonResponse({'coins': 2000, 'diamonds': 40}),
          jsonResponse({'coins': 7500, 'diamonds': 40}),
        ],
      },
    );
    await harness.inventory.load();
    await harness.wallet.refresh();
    await harness.iap.load();

    final outcome = await harness.iap.buy(harness.iap.currencyOffers.single);

    expect(outcome, LudoIapOutcome.success);
    expect(harness.purchases.purchased, ['ludo_coins_small']);
    expect(harness.transport.requestsFor('POST revenuecat/sync'), hasLength(1));
    expect(
      harness.wallet.coins,
      7500,
      reason: 'the balance must come from the server, not the purchase result',
    );
  });

  test(
    'a cancelled store sheet neither syncs nor changes the wallet',
    () async {
      final harness = StoreHarness.create(
        purchases: FakePurchasesGateway(
          packages: fakePackages,
          purchaseStatus: LudoStorePurchaseStatus.cancelled,
        ),
      );
      await harness.inventory.load();
      await harness.iap.load();

      final outcome = await harness.iap.buy(harness.iap.currencyOffers.single);

      expect(outcome, LudoIapOutcome.cancelled);
      expect(harness.transport.requestsFor('POST revenuecat/sync'), isEmpty);
    },
  );

  test('a failed server sync after a store success reports syncPending and '
      'retries on the next load', () async {
    final harness = StoreHarness.create(
      script: {
        'POST revenuecat/sync': [
          jsonResponse({'synced': false, 'reason': 'revenuecat_unavailable'}),
          jsonResponse({'synced': true, 'grantedPurchases': 1}),
        ],
      },
    );
    await harness.inventory.load();
    await harness.iap.load();

    final first = await harness.iap.buy(harness.iap.currencyOffers.single);
    expect(first, LudoIapOutcome.syncPending);
    expect(harness.iap.syncPending, isTrue);

    await harness.iap.load();
    expect(harness.iap.syncPending, isFalse);
    expect(harness.transport.requestsFor('POST revenuecat/sync'), hasLength(2));
  });

  test('restore calls restorePurchases then syncs, and records the '
      'pass entitlement', () async {
    final harness = StoreHarness.create(script: _syncOk(pass: true));
    await harness.inventory.load();
    await harness.iap.load();

    final outcome = await harness.iap.restore();

    expect(outcome, LudoIapOutcome.success);
    expect(harness.purchases.restoreCalls, 1);
    expect(harness.iap.passActive, isTrue);
  });

  test('a failed restore does not sync', () async {
    final harness = StoreHarness.create(
      purchases: FakePurchasesGateway(packages: fakePackages, restoreOk: false),
    );
    await harness.inventory.load();
    await harness.iap.load();

    expect(await harness.iap.restore(), LudoIapOutcome.failed);
    expect(harness.transport.requestsFor('POST revenuecat/sync'), isEmpty);
  });
}
