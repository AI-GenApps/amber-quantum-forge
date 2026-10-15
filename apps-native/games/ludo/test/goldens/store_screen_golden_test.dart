// Goldens for the task 26g store screen: each tab, owned vs. purchasable
// states, and the RevenueCat-absent fallback. Regenerate with
// `flutter test --update-goldens test/goldens/store_screen_golden_test.dart`.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/net/ludo_purchases_gateway.dart';
import 'package:ludo/src/screens/store_screen.dart';
import 'package:ludo/src/state/reduced_motion_setting.dart';
import 'package:ludo/src/theme/ludo_theme.dart';

import '../net/ludo_test_support.dart';
import '../state/ludo_store_test_support.dart';

const _offerPackages = [
  LudoStorePackage(
    productId: 'ludo_coins_small',
    title: 'Coins',
    priceString: r'$1.99',
  ),
  LudoStorePackage(
    productId: 'ludo_vortex_pass_monthly',
    title: 'Pass',
    priceString: r'$3.99',
  ),
];

Future<StoreHarness> _pump(
  WidgetTester tester, {
  bool iapAvailable = true,
  bool owned = true,
}) async {
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 2.75;
  addTearDown(tester.view.reset);
  final harness = StoreHarness.create(
    purchases: FakePurchasesGateway(
      available: iapAvailable,
      packages: _offerPackages,
    ),
    script: {
      if (owned)
        'GET inventory': [
          jsonResponse(inventoryBody(owned: ['dice_gold'])),
        ],
    },
  );
  await harness.wallet.refresh();
  await tester.pumpWidget(
    MaterialApp(
      theme: buildLudoTheme(),
      debugShowCheckedModeBanner: false,
      home: StoreScreen(
        walletState: harness.wallet,
        inventory: harness.inventory,
        iap: harness.iap,
        reducedMotion: ReducedMotionSetting(enabled: true),
      ),
    ),
  );
  await tester.pumpAndSettle();
  return harness;
}

Future<void> _tab(WidgetTester tester, String label) async {
  await tester.ensureVisible(find.text(label));
  await tester.pumpAndSettle();
  await tester.tap(find.text(label));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('dice tab: equipped default, owned Gold, purchasable Marble', (
    tester,
  ) async {
    await _pump(tester);
    await expectLater(
      find.byType(StoreScreen),
      matchesGoldenFile('store_screen_dice_tab.png'),
    );
  });

  testWidgets('dice tab after equipping an owned item', (tester) async {
    await _pump(tester);
    await tester.tap(find.byKey(const Key('store-item-dice_gold-equip')));
    await tester.pumpAndSettle();
    await expectLater(
      find.byType(StoreScreen),
      matchesGoldenFile('store_screen_dice_tab_equipped.png'),
    );
  });

  testWidgets('tokens tab', (tester) async {
    await _pump(tester);
    await _tab(tester, 'Tokens');
    await expectLater(
      find.byType(StoreScreen),
      matchesGoldenFile('store_screen_tokens_tab.png'),
    );
  });

  testWidgets('boards tab', (tester) async {
    await _pump(tester);
    await _tab(tester, 'Boards');
    await expectLater(
      find.byType(StoreScreen),
      matchesGoldenFile('store_screen_boards_tab.png'),
    );
  });

  testWidgets('currency packs tab', (tester) async {
    await _pump(tester);
    await _tab(tester, 'Currency Packs');
    await expectLater(
      find.byType(StoreScreen),
      matchesGoldenFile('store_screen_packs_tab.png'),
    );
  });

  testWidgets('pass tab', (tester) async {
    await _pump(tester);
    await _tab(tester, 'Pass');
    await expectLater(
      find.byType(StoreScreen),
      matchesGoldenFile('store_screen_pass_tab.png'),
    );
  });

  testWidgets('RevenueCat-absent fallback on the currency packs tab', (
    tester,
  ) async {
    await _pump(tester, iapAvailable: false);
    await _tab(tester, 'Currency Packs');
    await expectLater(
      find.byType(StoreScreen),
      matchesGoldenFile('store_screen_unavailable_fallback.png'),
    );
  });

  testWidgets('theme preview sheet for a purchasable dice', (tester) async {
    await _pump(tester, owned: false);
    await tester.tap(find.byKey(const Key('store-item-dice_marble-preview')));
    await tester.pumpAndSettle();
    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile('store_screen_preview_sheet.png'),
    );
  });
}
