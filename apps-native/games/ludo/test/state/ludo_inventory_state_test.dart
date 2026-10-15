import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/net/ludo_gateway.dart';
import 'package:ludo/src/state/ludo_inventory_state.dart';

import '../net/ludo_test_support.dart';
import 'ludo_store_test_support.dart';

LudoCatalogItem _item(LudoInventoryState state, String id) =>
    state.catalog.firstWhere((item) => item.itemId == id);

void main() {
  test(
    'load fetches the catalog; free defaults are owned and equipped',
    () async {
      final harness = StoreHarness.create();

      await harness.inventory.load();

      final inventory = harness.inventory;
      expect(inventory.status, LudoInventoryLoadStatus.ready);
      expect(inventory.itemsIn(LudoThemeCategory.dice), hasLength(3));
      expect(inventory.isOwned(_item(inventory, 'dice_default')), isTrue);
      expect(inventory.isOwned(_item(inventory, 'dice_gold')), isFalse);
      expect(inventory.equippedId(LudoThemeCategory.dice), 'dice_default');
      expect(inventory.iapProducts.map((p) => p.productId), [
        'ludo_coins_small',
        'ludo_vortex_pass_monthly',
      ]);
    },
  );

  test('a coin purchase posts the item, applies the server balances and '
      'marks the item owned', () async {
    final harness = StoreHarness.create(
      script: {
        'POST inventory/purchase': [
          jsonResponse(
            purchaseBody('dice_gold', 'dice', coins: 500, diamonds: 40),
          ),
        ],
      },
    );
    await harness.inventory.load();
    await harness.wallet.refresh();
    expect(harness.wallet.coins, 2000);
    final gold = _item(harness.inventory, 'dice_gold');

    final outcome = await harness.inventory.purchase(gold, LudoCurrency.coins);

    expect(outcome, LudoPurchaseOutcome.success);
    expect(harness.inventory.isOwned(gold), isTrue);
    expect(harness.wallet.coins, 500);
    expect(harness.wallet.diamonds, 40);
    final request = harness.transport.requestsFor('POST inventory/purchase');
    expect(request.single.$2, {
      'item_id': 'dice_gold',
      'currency': 'coins',
      'idempotency_key': 'key-fixed',
    });
  });

  test('a diamond purchase debits diamonds only', () async {
    final harness = StoreHarness.create(
      script: {
        'POST inventory/purchase': [
          jsonResponse(
            purchaseBody('board_cosmic', 'board', coins: 2000, diamonds: 40),
          ),
        ],
      },
    );
    await harness.inventory.load();
    final cosmic = _item(harness.inventory, 'board_cosmic');

    final outcome = await harness.inventory.purchase(
      cosmic,
      LudoCurrency.diamonds,
    );

    expect(outcome, LudoPurchaseOutcome.success);
    expect(harness.wallet.diamonds, 40);
    expect(harness.wallet.coins, 2000);
  });

  test('an insufficient-balance rejection changes nothing', () async {
    final harness = StoreHarness.create(
      script: {
        'POST inventory/purchase': [apiError('ludo_insufficient_balance', 422)],
      },
    );
    await harness.inventory.load();
    await harness.wallet.refresh();
    final gem = _item(harness.inventory, 'token_gem');

    final outcome = await harness.inventory.purchase(gem, LudoCurrency.coins);

    expect(outcome, LudoPurchaseOutcome.insufficientBalance);
    expect(harness.inventory.isOwned(gem), isFalse);
    expect(harness.wallet.coins, 2000);
    expect(harness.inventory.purchasingItemId, isNull);
  });

  test('an item not sold in that currency is rejected locally', () async {
    final harness = StoreHarness.create();
    await harness.inventory.load();
    final cosmic = _item(harness.inventory, 'board_cosmic');

    final outcome = await harness.inventory.purchase(
      cosmic,
      LudoCurrency.coins,
    );

    expect(outcome, LudoPurchaseOutcome.itemUnavailable);
    expect(harness.transport.requestsFor('POST inventory/purchase'), isEmpty);
  });

  test('an already-owned rejection marks the item owned', () async {
    final harness = StoreHarness.create(
      script: {
        'POST inventory/purchase': [apiError('ludo_item_already_owned', 409)],
      },
    );
    await harness.inventory.load();
    final gold = _item(harness.inventory, 'dice_gold');

    final outcome = await harness.inventory.purchase(gold, LudoCurrency.coins);

    expect(outcome, LudoPurchaseOutcome.alreadyOwned);
    expect(harness.inventory.isOwned(gold), isTrue);
  });

  test('a network failure keeps the idempotency key for the retry', () async {
    var keyCounter = 0;
    final harness = StoreHarness.create(
      script: {
        'POST inventory/purchase': [
          jsonResponse(
            purchaseBody('dice_gold', 'dice', coins: 500, diamonds: 40),
          ),
        ],
      },
    );
    final inventory = LudoInventoryState(
      gateway: harness.gateway,
      authController: harness.auth,
      walletState: harness.wallet,
      equipStore: memoryEquipStore(),
      purchaseKey: () => 'key-${keyCounter++}',
    );
    await inventory.load();
    final gold = _item(inventory, 'dice_gold');

    harness.transport.failingKeys.add('POST inventory/purchase');
    expect(
      await inventory.purchase(gold, LudoCurrency.coins),
      LudoPurchaseOutcome.offline,
    );
    expect(
      await inventory.purchase(gold, LudoCurrency.coins),
      LudoPurchaseOutcome.offline,
    );
    harness.transport.failingKeys.clear();
    expect(
      await inventory.purchase(gold, LudoCurrency.coins),
      LudoPurchaseOutcome.success,
    );

    expect(keyCounter, 1, reason: 'every retry must reuse the pending key');
    final keys = harness.transport
        .requestsFor('POST inventory/purchase')
        .map((r) => (r.$2 as Map)['idempotency_key']);
    expect(keys, ['key-0', 'key-0', 'key-0']);
  });

  test('equip applies immediately, persists, and survives a restart', () async {
    final harness = StoreHarness.create(
      script: {
        'GET inventory': [
          jsonResponse(inventoryBody(owned: ['dice_gold'])),
        ],
      },
    );
    await harness.inventory.load();
    final gold = _item(harness.inventory, 'dice_gold');
    expect(harness.inventory.isEquipped(gold), isFalse);

    final equipped = await harness.inventory.equip(gold);

    expect(equipped, isTrue);
    expect(harness.inventory.isEquipped(gold), isTrue);
    expect(harness.inventory.equippedId(LudoThemeCategory.dice), 'dice_gold');

    final restarted = harness.restarted();
    await restarted.load();
    expect(restarted.equippedId(LudoThemeCategory.dice), 'dice_gold');
    expect(restarted.isEquipped(_item(restarted, 'dice_gold')), isTrue);
  });

  test('equipping an item that is not owned does nothing', () async {
    final harness = StoreHarness.create();
    await harness.inventory.load();

    final equipped = await harness.inventory.equip(
      _item(harness.inventory, 'dice_gold'),
    );

    expect(equipped, isFalse);
    expect(
      harness.inventory.equippedId(LudoThemeCategory.dice),
      'dice_default',
    );
  });

  test('an equipped item the server no longer reports falls back to the '
      'default', () async {
    final harness = StoreHarness.create(
      script: {
        'GET inventory': [
          jsonResponse(inventoryBody(owned: ['dice_gold'])),
          jsonResponse(inventoryBody()),
        ],
      },
    );
    await harness.inventory.load();
    await harness.inventory.equip(_item(harness.inventory, 'dice_gold'));

    await harness.inventory.refresh();

    expect(
      harness.inventory.equippedId(LudoThemeCategory.dice),
      'dice_default',
    );
  });

  test('a failed first load reports failed without throwing', () async {
    final harness = StoreHarness.create(
      script: {
        'GET inventory': [apiError('ludo_unavailable', 503)],
      },
    );

    await harness.inventory.load();

    expect(harness.inventory.status, LudoInventoryLoadStatus.failed);
    expect(harness.inventory.isOffline, isTrue);
    expect(harness.inventory.catalog, isEmpty);
  });
}
