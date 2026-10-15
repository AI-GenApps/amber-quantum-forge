/// The store screen (task 26g): Dice / Tokens / Boards theme tabs bought
/// with coins or diamonds through the server, plus Currency Packs and Pass
/// tabs bought with real money through RevenueCat.
///
/// The real-money tabs degrade to a "Store unavailable" state when
/// RevenueCat is not configured; the theme tabs never depend on it. Theme
/// art reads the manifest `store_<itemId>` slot first and falls back to
/// code-drawn art (see `ludo_store_theme_art.dart`).
library;

import 'dart:async';

import 'package:flutter/material.dart';

import '../net/ludo_gateway.dart' show LudoCatalogItem;
import '../state/ludo_iap_state.dart';
import '../state/ludo_inventory_state.dart';
import '../state/ludo_wallet_state.dart';
import '../state/reduced_motion_setting.dart';
import '../theme/ludo_background_painter.dart';
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import '../widgets/ludo_3d_button.dart';
import '../widgets/ludo_dialog_frame.dart';
import '../widgets/ludo_panel.dart';
import '../widgets/ludo_store_cards.dart';
import '../widgets/ludo_theme_preview_sheet.dart';
import '../widgets/ludo_wallet_hud.dart';

const _minTapTarget = 48.0;

const _passPerks = [
  '+50% daily reward coins',
  '1 free theme every month',
  'Exclusive Vortex dice theme',
];

const storeTabLabels = ['Dice', 'Tokens', 'Boards', 'Currency Packs', 'Pass'];

class StoreScreen extends StatefulWidget {
  const StoreScreen({
    super.key,
    this.walletState,
    this.inventory,
    this.iap,
    this.reducedMotion,
    this.autoLoad = true,
    this.onOpenRewards,
  });

  /// The wallet whose balances the HUD row shows; `null` hides the row.
  final LudoWalletState? walletState;

  /// `null` when no online client exists (no API URL or Firebase): the
  /// whole store then shows its unavailable state.
  final LudoInventoryState? inventory;

  /// `null` behaves like a RevenueCat-absent build.
  final LudoIapState? iap;

  final ReducedMotionSetting? reducedMotion;

  /// Test seam: skip the initial `load()` calls on pre-loaded states.
  final bool autoLoad;

  /// Task 26h: opens the daily rewards / watch-an-ad screen. `null` hides
  /// the "Free coins" button.
  final VoidCallback? onOpenRewards;

  @override
  State<StoreScreen> createState() => _StoreScreenState();
}

class _StoreScreenState extends State<StoreScreen> {
  String? _message;
  bool _messageIsError = false;

  @override
  void initState() {
    super.initState();
    if (widget.autoLoad) unawaited(_load());
  }

  Future<void> _load() async {
    await widget.inventory?.load();
    await widget.iap?.load();
  }

  void _say(String message, {bool error = false}) {
    if (!mounted) return;
    setState(() {
      _message = message;
      _messageIsError = error;
    });
  }

  Future<void> _confirmAndBuy(
    LudoCatalogItem item,
    LudoCurrency currency,
  ) async {
    final inventory = widget.inventory;
    final price = item.priceIn(currency);
    if (inventory == null || price == null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: LudoDialogFrame(
          title: 'Confirm purchase',
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Buy ${item.displayName} for ${groupedNumber(price)} '
                '${currency.wire}?',
                textAlign: TextAlign.center,
                style: LudoTextStyles.body,
              ),
              const SizedBox(height: LudoThemeTokens.spaceMd),
              Row(
                children: [
                  Expanded(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(
                        minHeight: _minTapTarget,
                      ),
                      child: Ludo3dButton(
                        key: const Key('store-confirm-cancel'),
                        semanticLabel: 'Cancel',
                        color: LudoThemeTokens.backgroundMidBlue,
                        onPressed: () => Navigator.of(context).pop(false),
                        child: Center(
                          child: Text(
                            'Cancel',
                            style: LudoTextStyles.bodyStrong,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: LudoThemeTokens.spaceSm),
                  Expanded(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(
                        minHeight: _minTapTarget,
                      ),
                      child: Ludo3dButton(
                        key: const Key('store-confirm-buy'),
                        semanticLabel: 'Confirm purchase',
                        onPressed: () => Navigator.of(context).pop(true),
                        child: Center(
                          child: Text(
                            'Buy',
                            style: LudoTextStyles.bodyStrong.copyWith(
                              color: LudoThemeTokens.textOutline,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
    if (confirmed != true || !mounted) return;
    final outcome = await inventory.purchase(item, currency);
    switch (outcome) {
      case LudoPurchaseOutcome.success:
        _say('Purchased ${item.displayName}! Tap Equip to use it.');
      case LudoPurchaseOutcome.insufficientBalance:
        _say(
          'Not enough ${currency.wire} for ${item.displayName}.',
          error: true,
        );
      case LudoPurchaseOutcome.alreadyOwned:
        _say('You already own ${item.displayName}.');
      case LudoPurchaseOutcome.offline:
        _say('Can\'t reach the store. Check your connection.', error: true);
      case LudoPurchaseOutcome.busy:
        break;
      case LudoPurchaseOutcome.itemUnavailable:
      case LudoPurchaseOutcome.failed:
        _say('Purchase failed. Nothing was charged.', error: true);
    }
  }

  Future<void> _equip(LudoCatalogItem item) async {
    final inventory = widget.inventory;
    if (inventory == null) return;
    if (await inventory.equip(item)) _say('${item.displayName} equipped.');
  }

  void _preview(LudoCatalogItem item) {
    final inventory = widget.inventory;
    if (inventory == null) return;
    unawaited(
      showLudoThemePreviewSheet(
        context,
        item: item,
        inventory: inventory,
        reducedMotion: widget.reducedMotion,
        onBuy: (currency) => unawaited(_confirmAndBuy(item, currency)),
        onEquip: () => _equip(item),
      ),
    );
  }

  Future<void> _buyOffer(LudoIapOffer offer) async {
    final outcome = await widget.iap?.buy(offer) ?? LudoIapOutcome.unavailable;
    _sayIap(outcome, 'Purchase');
  }

  Future<void> _restore() async {
    final outcome = await widget.iap?.restore() ?? LudoIapOutcome.unavailable;
    _sayIap(outcome, 'Restore');
  }

  void _sayIap(LudoIapOutcome outcome, String what) {
    switch (outcome) {
      case LudoIapOutcome.success:
        _say('$what complete. Your balance is up to date.');
      case LudoIapOutcome.cancelled:
        _say('$what cancelled. Nothing was charged.');
      case LudoIapOutcome.syncPending:
        _say(
          '$what went through. Your balance will update once we confirm it.',
        );
      case LudoIapOutcome.busy:
        break;
      case LudoIapOutcome.unavailable:
      case LudoIapOutcome.failed:
        _say('$what failed. Try again later.', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final inventory = widget.inventory;
    return DefaultTabController(
      length: storeTabLabels.length,
      child: Scaffold(
        appBar: AppBar(title: const Text('Store')),
        body: LudoBackground(
          child: SafeArea(
            child: inventory == null
                ? const LudoStoreNotice(
                    title: 'Store unavailable',
                    message:
                        'The store needs an online connection, which is not '
                        'available in this build.',
                  )
                : Column(
                    children: [
                      if (widget.walletState != null)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(
                            LudoThemeTokens.spaceMd,
                            LudoThemeTokens.spaceSm,
                            LudoThemeTokens.spaceMd,
                            0,
                          ),
                          child: Align(
                            alignment: Alignment.centerRight,
                            child: LudoWalletHud(
                              wallet: widget.walletState!,
                              reducedMotion: widget.reducedMotion,
                            ),
                          ),
                        ),
                      if (widget.onOpenRewards != null) _freeCoinsButton(),
                      TabBar(
                        isScrollable: true,
                        tabAlignment: TabAlignment.start,
                        indicatorColor: LudoThemeTokens.gold,
                        labelColor: LudoThemeTokens.gold,
                        unselectedLabelColor: LudoThemeTokens.textOnDark,
                        labelPadding: const EdgeInsets.symmetric(
                          horizontal: LudoThemeTokens.spaceSm,
                        ),
                        labelStyle: LudoTextStyles.bodyStrong.copyWith(
                          fontSize: 14,
                        ),
                        tabs: [
                          for (final label in storeTabLabels) Tab(text: label),
                        ],
                      ),
                      if (_message != null) _messageBanner(),
                      Expanded(
                        child: AnimatedBuilder(
                          animation: Listenable.merge([inventory, ?widget.iap]),
                          builder: (context, _) => TabBarView(
                            children: [
                              _themeTab(inventory, LudoThemeCategory.dice),
                              _themeTab(inventory, LudoThemeCategory.token),
                              _themeTab(inventory, LudoThemeCategory.board),
                              _packsTab(),
                              _passTab(),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Widget _freeCoinsButton() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        LudoThemeTokens.spaceMd,
        LudoThemeTokens.spaceSm,
        LudoThemeTokens.spaceMd,
        0,
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: _minTapTarget),
        child: Ludo3dButton(
          key: const Key('store-free-coins'),
          semanticLabel: 'Free coins and daily rewards',
          onPressed: widget.onOpenRewards,
          padding: const EdgeInsets.symmetric(
            horizontal: LudoThemeTokens.spaceMd,
            vertical: LudoThemeTokens.spaceSm,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.ondemand_video,
                size: 22,
                color: LudoThemeTokens.textOutline,
              ),
              const SizedBox(width: LudoThemeTokens.spaceSm),
              Text(
                'Free coins',
                style: LudoTextStyles.bodyStrong.copyWith(
                  color: LudoThemeTokens.textOutline,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _messageBanner() {
    return Padding(
      padding: const EdgeInsets.all(LudoThemeTokens.spaceSm),
      child: Semantics(
        liveRegion: true,
        label: _message,
        excludeSemantics: true,
        child: Container(
          key: const Key('store-message'),
          width: double.infinity,
          padding: const EdgeInsets.all(LudoThemeTokens.spaceSm),
          decoration: BoxDecoration(
            color:
                (_messageIsError
                        ? LudoThemeTokens.seatRed
                        : LudoThemeTokens.seatGreen)
                    .withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(LudoThemeTokens.radiusMd),
            border: Border.all(
              color: _messageIsError
                  ? LudoThemeTokens.seatRed
                  : LudoThemeTokens.seatGreen,
              width: 2,
            ),
          ),
          child: Text(
            _message!,
            textAlign: TextAlign.center,
            style: LudoTextStyles.body,
          ),
        ),
      ),
    );
  }

  Widget _themeTab(LudoInventoryState inventory, LudoThemeCategory category) {
    final items = inventory.itemsIn(category);
    if (inventory.catalog.isEmpty) {
      if (inventory.status == LudoInventoryLoadStatus.failed) {
        return LudoStoreNotice(
          title: 'Can\'t load the store',
          message: 'Check your connection and try again.',
          onRetry: () => unawaited(inventory.refresh()),
        );
      }
      return Center(
        child: Text(
          'Loading store...',
          key: const Key('store-loading'),
          style: LudoTextStyles.body,
        ),
      );
    }
    return GridView.builder(
      key: Key('store-grid-${category.wire}'),
      padding: const EdgeInsets.all(LudoThemeTokens.spaceMd),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: LudoThemeTokens.spaceSm,
        crossAxisSpacing: LudoThemeTokens.spaceSm,
        childAspectRatio: 0.62,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return LudoThemeCard(
          item: item,
          inventory: inventory,
          onPreview: () => _preview(item),
          onBuy: (currency) => unawaited(_confirmAndBuy(item, currency)),
          onEquip: () => unawaited(_equip(item)),
        );
      },
    );
  }

  Widget? _iapGate() {
    final iap = widget.iap;
    if (iap == null || iap.availability == LudoIapAvailability.unavailable) {
      return const LudoStoreNotice(
        key: Key('store-unavailable'),
        title: 'Store unavailable',
        message:
            'Real-money purchases are not available in this build. Coin '
            'and diamond items still work.',
      );
    }
    if (iap.availability == LudoIapAvailability.loading) {
      return Center(
        child: Text(
          'Loading offers...',
          key: const Key('store-offers-loading'),
          style: LudoTextStyles.body,
        ),
      );
    }
    if (iap.availability == LudoIapAvailability.error) {
      return LudoStoreNotice(
        title: 'Can\'t load offers',
        message: 'Check your connection and try again.',
        onRetry: () => unawaited(iap.load()),
      );
    }
    return null;
  }

  Widget _packsTab() {
    final gate = _iapGate();
    if (gate != null) return gate;
    final iap = widget.iap!;
    final order = {
      for (var i = 0; i < iap.inventoryState.iapProducts.length; i++)
        iap.inventoryState.iapProducts[i].productId: i,
    };
    final offers = [...iap.currencyOffers]
      ..sort(
        (a, b) =>
            (order[a.productId] ?? 999).compareTo(order[b.productId] ?? 999),
      );
    return _offerList(iap, offers, empty: 'No offers available right now.');
  }

  Widget _passTab() {
    final gate = _iapGate();
    if (gate != null) return gate;
    final iap = widget.iap!;
    return _offerList(
      iap,
      iap.passOffers,
      empty: 'The Vortex Pass is not available right now.',
      perks: _passPerks,
      owned: iap.passActive,
    );
  }

  Widget _offerList(
    LudoIapState iap,
    List<LudoIapOffer> offers, {
    required String empty,
    List<String> perks = const [],
    bool owned = false,
  }) {
    return ListView(
      padding: const EdgeInsets.all(LudoThemeTokens.spaceMd),
      children: [
        if (offers.isEmpty)
          LudoPanel(child: Text(empty, style: LudoTextStyles.body)),
        for (final offer in offers) ...[
          LudoOfferCard(
            offer: offer,
            busy: iap.busy,
            perks: perks,
            owned: owned,
            onBuy: () => unawaited(_buyOffer(offer)),
          ),
          const SizedBox(height: LudoThemeTokens.spaceSm),
        ],
        const SizedBox(height: LudoThemeTokens.spaceSm),
        ConstrainedBox(
          constraints: const BoxConstraints(minHeight: _minTapTarget),
          child: Ludo3dButton(
            key: const Key('store-restore'),
            semanticLabel: 'Restore purchases',
            onPressed: iap.busy ? null : () => unawaited(_restore()),
            color: LudoThemeTokens.backgroundMidBlue,
            child: Center(
              child: Text(
                'Restore purchases',
                style: LudoTextStyles.bodyStrong,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
