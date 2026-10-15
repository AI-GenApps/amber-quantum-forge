// Widget tests for the task 26g store screen: coin/diamond purchase,
// insufficient-balance rejection, equip persistence across a simulated
// restart, the real-money flow, and the RevenueCat-absent fallback — all
// over the real LudoGateway/state stack with a scripted transport.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/net/ludo_purchases_gateway.dart';
import 'package:ludo/src/screens/store_screen.dart';
import 'package:ludo/src/state/ludo_inventory_state.dart';
import 'package:ludo/src/theme/ludo_theme.dart';

import '../net/ludo_test_support.dart';
import '../state/ludo_store_test_support.dart';

Future<void> _pumpStore(
  WidgetTester tester,
  StoreHarness harness, {
  bool withIap = true,
  LudoInventoryState? inventory,
}) async {
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 2.75;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    MaterialApp(
      theme: buildLudoTheme(),
      home: StoreScreen(
        walletState: harness.wallet,
        inventory: inventory ?? harness.inventory,
        iap: withIap ? harness.iap : null,
      ),
    ),
  );
  await tester.pumpAndSettle();
}

Future<void> _openTab(WidgetTester tester, String label) async {
  await tester.ensureVisible(find.text(label));
  await tester.pumpAndSettle();
  await tester.tap(find.text(label));
  await tester.pumpAndSettle();
}

Finder _buy(String name, int price, String currency) => find.bySemanticsLabel(
  'Buy $name for ${price >= 1000 ? '${price ~/ 1000},${(price % 1000).toString().padLeft(3, '0')}' : price} $currency',
);

Future<void> _confirm(WidgetTester tester) async {
  await tester.tap(find.byKey(const Key('store-confirm-buy')));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('shows the five tabs with exact labels', (tester) async {
    final harness = StoreHarness.create();
    await _pumpStore(tester, harness);

    for (final label in [
      'Dice',
      'Tokens',
      'Boards',
      'Currency Packs',
      'Pass',
    ]) {
      expect(find.text(label), findsOneWidget);
    }
  });

  testWidgets('a coin purchase debits the balance, shows the success '
      'message and offers Equip', (tester) async {
    final handle = tester.ensureSemantics();
    final harness = StoreHarness.create(
      script: {
        'POST inventory/purchase': [
          jsonResponse(
            purchaseBody('dice_gold', 'dice', coins: 500, diamonds: 40),
          ),
        ],
      },
    );
    await harness.wallet.refresh();
    await _pumpStore(tester, harness);
    expect(harness.wallet.coins, 2000);

    await tester.tap(_buy('Gold', 1500, 'coins'));
    await tester.pumpAndSettle();
    expect(find.text('Confirm purchase'), findsWidgets);
    await _confirm(tester);

    expect(harness.wallet.coins, 500);
    expect(find.text('500'), findsWidgets);
    expect(find.text('Purchased Gold! Tap Equip to use it.'), findsOneWidget);
    expect(find.byKey(const Key('store-item-dice_gold-equip')), findsOneWidget);
    expect(_buy('Gold', 1500, 'coins'), findsNothing);
    handle.dispose();
  });

  testWidgets('cancelling the confirmation buys nothing', (tester) async {
    final harness = StoreHarness.create();
    await _pumpStore(tester, harness);

    await tester.tap(_buy('Gold', 1500, 'coins'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('store-confirm-cancel')));
    await tester.pumpAndSettle();

    expect(harness.transport.requestsFor('POST inventory/purchase'), isEmpty);
    expect(find.byKey(const Key('store-message')), findsNothing);
  });

  testWidgets('a diamond purchase of a board debits diamonds', (tester) async {
    final harness = StoreHarness.create(
      script: {
        'POST inventory/purchase': [
          jsonResponse(
            purchaseBody('board_cosmic', 'board', coins: 2000, diamonds: -40),
          ),
        ],
      },
    );
    await harness.wallet.refresh();
    await _pumpStore(tester, harness);
    await _openTab(tester, 'Boards');

    await tester.tap(_buy('Cosmic Board', 80, 'diamonds'));
    await tester.pumpAndSettle();
    await _confirm(tester);

    expect(
      find.text('Purchased Cosmic Board! Tap Equip to use it.'),
      findsOneWidget,
    );
    expect(
      find.byKey(const Key('store-item-board_cosmic-equip')),
      findsOneWidget,
    );
  });

  testWidgets('an insufficient balance is rejected with a message and no '
      'ownership change', (tester) async {
    final harness = StoreHarness.create(
      script: {
        'POST inventory/purchase': [apiError('ludo_insufficient_balance', 422)],
      },
    );
    await harness.wallet.refresh();
    await _pumpStore(tester, harness);
    await _openTab(tester, 'Tokens');

    await tester.tap(_buy('Gem Tokens', 2500, 'coins'));
    await tester.pumpAndSettle();
    await _confirm(tester);

    expect(find.text('Not enough coins for Gem Tokens.'), findsOneWidget);
    expect(harness.wallet.coins, 2000);
    expect(find.byKey(const Key('store-item-token_gem-equip')), findsNothing);
    expect(_buy('Gem Tokens', 2500, 'coins'), findsOneWidget);
  });

  testWidgets('equipping an owned item persists across a simulated app '
      'restart', (tester) async {
    final harness = StoreHarness.create(
      script: {
        'GET inventory': [
          jsonResponse(inventoryBody(owned: ['dice_gold'])),
        ],
      },
    );
    await _pumpStore(tester, harness);
    expect(
      find.byKey(const Key('store-item-dice_gold-equipped')),
      findsNothing,
    );

    await tester.tap(find.byKey(const Key('store-item-dice_gold-equip')));
    await tester.pumpAndSettle();
    expect(
      find.byKey(const Key('store-item-dice_gold-equipped')),
      findsOneWidget,
    );
    expect(
      find.byKey(const Key('store-item-dice_default-equip')),
      findsOneWidget,
    );

    // Simulated restart: tear the screen down and build a fresh state over
    // the same save store.
    await tester.pumpWidget(const SizedBox.shrink());
    final restarted = harness.restarted();
    await _pumpStore(tester, harness, inventory: restarted);

    expect(
      find.byKey(const Key('store-item-dice_gold-equipped')),
      findsOneWidget,
    );
  });

  testWidgets('a real-money pack purchase syncs and reports success', (
    tester,
  ) async {
    final harness = StoreHarness.create(
      script: {
        'POST revenuecat/sync': [
          jsonResponse({'synced': true, 'grantedPurchases': 1}),
        ],
      },
    );
    await _pumpStore(tester, harness);
    await _openTab(tester, 'Currency Packs');

    expect(find.text(r'$1.99'), findsOneWidget);
    expect(find.text('+5,500 coins'), findsOneWidget);
    await tester.tap(find.byKey(const Key('store-offer-ludo_coins_small-buy')));
    await tester.pumpAndSettle();

    expect(harness.purchases.purchased, ['ludo_coins_small']);
    expect(harness.transport.requestsFor('POST revenuecat/sync'), hasLength(1));
    expect(
      find.text('Purchase complete. Your balance is up to date.'),
      findsOneWidget,
    );
  });

  testWidgets('a cancelled real-money purchase says nothing was charged', (
    tester,
  ) async {
    final harness = StoreHarness.create(
      purchases: FakePurchasesGateway(
        packages: fakePackages,
        purchaseStatus: LudoStorePurchaseStatus.cancelled,
      ),
    );
    await _pumpStore(tester, harness);
    await _openTab(tester, 'Currency Packs');

    await tester.tap(find.byKey(const Key('store-offer-ludo_coins_small-buy')));
    await tester.pumpAndSettle();

    expect(
      find.text('Purchase cancelled. Nothing was charged.'),
      findsOneWidget,
    );
    expect(harness.transport.requestsFor('POST revenuecat/sync'), isEmpty);
  });

  testWidgets('Restore purchases syncs with the server', (tester) async {
    final harness = StoreHarness.create(
      script: {
        'POST revenuecat/sync': [
          jsonResponse({'synced': true, 'grantedPurchases': 0}),
        ],
      },
    );
    await _pumpStore(tester, harness);
    await _openTab(tester, 'Currency Packs');

    await tester.ensureVisible(find.byKey(const Key('store-restore')));
    await tester.tap(find.byKey(const Key('store-restore')));
    await tester.pumpAndSettle();

    expect(harness.purchases.restoreCalls, 1);
    expect(harness.transport.requestsFor('POST revenuecat/sync'), hasLength(1));
  });

  testWidgets('with RevenueCat absent the real-money tabs render the '
      '"Store unavailable" fallback and coin items still work', (tester) async {
    final harness = StoreHarness.create(
      purchases: FakePurchasesGateway(available: false),
    );
    await _pumpStore(tester, harness);

    await _openTab(tester, 'Currency Packs');
    expect(find.byKey(const Key('store-unavailable')), findsOneWidget);
    expect(find.text('Store unavailable'), findsOneWidget);
    expect(tester.takeException(), isNull);

    await _openTab(tester, 'Pass');
    expect(find.byKey(const Key('store-unavailable')), findsOneWidget);

    await _openTab(tester, 'Dice');
    expect(find.text('Gold'), findsOneWidget);
    expect(find.byKey(const Key('store-unavailable')), findsNothing);
  });

  testWidgets('a null IAP state behaves like a RevenueCat-absent build', (
    tester,
  ) async {
    final harness = StoreHarness.create();
    await _pumpStore(tester, harness, withIap: false);

    await _openTab(tester, 'Pass');

    expect(find.byKey(const Key('store-unavailable')), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('with no online client the whole store is unavailable', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.75;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      MaterialApp(theme: buildLudoTheme(), home: const StoreScreen()),
    );
    await tester.pumpAndSettle();

    expect(find.text('Store unavailable'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('the preview sheet shows a dice roll preview and Buy actions', (
    tester,
  ) async {
    final harness = StoreHarness.create();
    await _pumpStore(tester, harness);

    await tester.tap(find.byKey(const Key('store-item-dice_gold-preview')));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('store-preview-dice')), findsOneWidget);
    expect(find.byKey(const Key('store-preview-roll')), findsOneWidget);
    await tester.tap(find.byKey(const Key('store-preview-roll')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('store-preview-dice')), findsOneWidget);
    expect(
      find.byKey(const Key('store-item-dice_gold-buy-coins')),
      findsNWidgets(2),
    );
  });

  testWidgets('a failed catalog load shows a retry state', (tester) async {
    final harness = StoreHarness.create(
      script: {
        'GET inventory': [
          apiError('ludo_unavailable', 503),
          jsonResponse(inventoryBody()),
        ],
      },
    );
    await _pumpStore(tester, harness);
    expect(find.text('Can\'t load the store'), findsOneWidget);

    await tester.tap(find.text('Retry'));
    await tester.pumpAndSettle();

    expect(find.text('Gold'), findsOneWidget);
  });

  testWidgets('shows a Free coins button only when a rewards opener is '
      'supplied (task 26h)', (tester) async {
    final harness = StoreHarness.create();
    await _pumpStore(tester, harness);
    expect(find.byKey(const Key('store-free-coins')), findsNothing);

    var opened = 0;
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.75;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      MaterialApp(
        theme: buildLudoTheme(),
        home: StoreScreen(
          walletState: harness.wallet,
          inventory: harness.inventory,
          iap: harness.iap,
          onOpenRewards: () => opened += 1,
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(
      find.bySemanticsLabel('Free coins and daily rewards'),
      findsOneWidget,
    );
    await tester.tap(find.byKey(const Key('store-free-coins')));
    await tester.pump();
    expect(opened, 1);
  });
}
