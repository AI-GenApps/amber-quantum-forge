/// Reusable store building blocks (task 26g): currency price buttons, the
/// theme item card, the real-money offer card and the "store unavailable"
/// panel. Every control is a [Ludo3dButton] (Semantics-labelled, 48dp+).
library;

import 'package:flutter/material.dart';

import '../net/ludo_gateway.dart' show LudoCatalogItem;
import '../state/ludo_iap_state.dart';
import '../state/ludo_inventory_state.dart';
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import 'ludo_3d_button.dart';
import 'ludo_panel.dart';
import 'ludo_store_theme_art.dart';

const _minTapTarget = 48.0;

IconData currencyIcon(LudoCurrency currency) =>
    currency == LudoCurrency.coins ? Icons.monetization_on : Icons.diamond;

Color currencyColor(LudoCurrency currency) => currency == LudoCurrency.coins
    ? LudoThemeTokens.gold
    : LudoThemeTokens.seatBlue;

/// "1500" -> "1,500".
String groupedNumber(int value) {
  final digits = value.toString();
  final buffer = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 == 0) buffer.write(',');
    buffer.write(digits[i]);
  }
  return buffer.toString();
}

/// A price button for [item] in [currency], e.g. `[coin] 1,500`.
class LudoPriceButton extends StatelessWidget {
  const LudoPriceButton({
    super.key,
    required this.item,
    required this.currency,
    required this.onPressed,
  });

  final LudoCatalogItem item;
  final LudoCurrency currency;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final price = item.priceIn(currency);
    if (price == null) return const SizedBox.shrink();
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: _minTapTarget),
      child: Ludo3dButton(
        semanticLabel:
            'Buy ${item.displayName} for ${groupedNumber(price)} '
            '${currency.wire}',
        onPressed: onPressed,
        color: currency == LudoCurrency.coins
            ? LudoThemeTokens.gold
            : LudoThemeTokens.seatBlue,
        padding: const EdgeInsets.symmetric(
          horizontal: LudoThemeTokens.spaceMd,
          vertical: LudoThemeTokens.spaceSm,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              currencyIcon(currency),
              size: 18,
              color: currency == LudoCurrency.coins
                  ? LudoThemeTokens.textOutline
                  : Colors.white,
            ),
            const SizedBox(width: 6),
            Text(
              groupedNumber(price),
              style: LudoTextStyles.bodyStrong.copyWith(
                color: currency == LudoCurrency.coins
                    ? LudoThemeTokens.textOutline
                    : Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The owned/equipped/purchasable action area shared by the card and the
/// preview sheet.
class LudoThemeActions extends StatelessWidget {
  const LudoThemeActions({
    super.key,
    required this.item,
    required this.inventory,
    required this.onBuy,
    required this.onEquip,
  });

  final LudoCatalogItem item;
  final LudoInventoryState inventory;
  final void Function(LudoCurrency currency) onBuy;
  final VoidCallback onEquip;

  @override
  Widget build(BuildContext context) {
    final busy = inventory.purchasingItemId != null;
    if (inventory.isEquipped(item)) {
      return Semantics(
        label: '${item.displayName} equipped',
        excludeSemantics: true,
        child: Container(
          key: Key('store-item-${item.itemId}-equipped'),
          constraints: const BoxConstraints(minHeight: _minTapTarget),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: LudoThemeTokens.seatGreen.withValues(alpha: 0.25),
            borderRadius: BorderRadius.circular(LudoThemeTokens.radiusMd),
            border: Border.all(color: LudoThemeTokens.seatGreen, width: 2),
          ),
          child: Text('Equipped', style: LudoTextStyles.bodyStrong),
        ),
      );
    }
    if (inventory.isOwned(item)) {
      return ConstrainedBox(
        constraints: const BoxConstraints(minHeight: _minTapTarget),
        child: Ludo3dButton(
          key: Key('store-item-${item.itemId}-equip'),
          semanticLabel: 'Equip ${item.displayName}',
          onPressed: onEquip,
          color: LudoThemeTokens.seatGreen,
          padding: const EdgeInsets.symmetric(
            horizontal: LudoThemeTokens.spaceMd,
            vertical: LudoThemeTokens.spaceSm,
          ),
          child: Center(
            child: Text(
              'Equip',
              style: LudoTextStyles.bodyStrong.copyWith(color: Colors.white),
            ),
          ),
        ),
      );
    }
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final currency in LudoCurrency.values)
          if (item.priceIn(currency) != null) ...[
            LudoPriceButton(
              key: Key('store-item-${item.itemId}-buy-${currency.wire}'),
              item: item,
              currency: currency,
              onPressed: busy ? null : () => onBuy(currency),
            ),
            const SizedBox(height: LudoThemeTokens.spaceXs),
          ],
      ],
    );
  }
}

/// One theme item: art, name, ownership state and actions. Tapping the art
/// opens the preview.
class LudoThemeCard extends StatelessWidget {
  const LudoThemeCard({
    super.key,
    required this.item,
    required this.inventory,
    required this.onPreview,
    required this.onBuy,
    required this.onEquip,
  });

  final LudoCatalogItem item;
  final LudoInventoryState inventory;
  final VoidCallback onPreview;
  final void Function(LudoCurrency currency) onBuy;
  final VoidCallback onEquip;

  @override
  Widget build(BuildContext context) {
    final category = item.category ?? LudoThemeCategory.dice;
    final owned = inventory.isOwned(item);
    return LudoPanel(
      padding: const EdgeInsets.all(LudoThemeTokens.spaceSm),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Semantics(
            button: true,
            label: 'Preview ${item.displayName}',
            excludeSemantics: true,
            child: InkWell(
              key: Key('store-item-${item.itemId}-preview'),
              onTap: onPreview,
              child: ConstrainedBox(
                constraints: const BoxConstraints(minHeight: _minTapTarget),
                child: Padding(
                  padding: const EdgeInsets.all(LudoThemeTokens.spaceSm),
                  child: Center(
                    child: LudoStoreThemeArt(
                      itemId: item.itemId,
                      category: category,
                      size: const Size.square(96),
                      boardItemId: inventory.equippedId(
                        LudoThemeCategory.board,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          Text(
            item.displayName,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: LudoTextStyles.bodyStrong,
          ),
          Text(
            owned ? 'Owned' : 'Not owned',
            key: Key('store-item-${item.itemId}-state'),
            textAlign: TextAlign.center,
            style: LudoTextStyles.caption,
          ),
          const Spacer(),
          LudoThemeActions(
            item: item,
            inventory: inventory,
            onBuy: onBuy,
            onEquip: onEquip,
          ),
        ],
      ),
    );
  }
}

/// A real-money offer (currency pack or Vortex Pass).
class LudoOfferCard extends StatelessWidget {
  const LudoOfferCard({
    super.key,
    required this.offer,
    required this.onBuy,
    required this.busy,
    this.perks = const [],
    this.owned = false,
  });

  final LudoIapOffer offer;
  final VoidCallback onBuy;
  final bool busy;
  final List<String> perks;
  final bool owned;

  @override
  Widget build(BuildContext context) {
    final grants = <String>[
      if (offer.grantsCoins != null)
        '+${groupedNumber(offer.grantsCoins!)} coins',
      if (offer.grantsDiamonds != null)
        '+${groupedNumber(offer.grantsDiamonds!)} diamonds',
    ];
    return LudoPanel(
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(offer.title, style: LudoTextStyles.bodyStrong),
                for (final line in [...grants, ...perks])
                  Text(line, style: LudoTextStyles.caption),
              ],
            ),
          ),
          const SizedBox(width: LudoThemeTokens.spaceSm),
          if (owned)
            Text('Active', style: LudoTextStyles.bodyStrong)
          else
            ConstrainedBox(
              constraints: const BoxConstraints(minHeight: _minTapTarget),
              child: Ludo3dButton(
                key: Key('store-offer-${offer.productId}-buy'),
                semanticLabel: 'Buy ${offer.title} for ${offer.priceString}',
                onPressed: busy ? null : onBuy,
                padding: const EdgeInsets.symmetric(
                  horizontal: LudoThemeTokens.spaceMd,
                  vertical: LudoThemeTokens.spaceSm,
                ),
                child: Text(
                  offer.priceString,
                  style: LudoTextStyles.bodyStrong.copyWith(
                    color: LudoThemeTokens.textOutline,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// The shared "store unavailable" state: a titled panel with an
/// explanation and an optional retry action.
class LudoStoreNotice extends StatelessWidget {
  const LudoStoreNotice({
    super.key,
    required this.title,
    required this.message,
    this.onRetry,
  });

  final String title;
  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(LudoThemeTokens.spaceMd),
      child: Align(
        alignment: Alignment.topCenter,
        child: Semantics(
          container: true,
          label: '$title. $message',
          child: LudoPanel(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.storefront,
                  size: 40,
                  color: LudoThemeTokens.gold,
                ),
                const SizedBox(height: LudoThemeTokens.spaceSm),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: LudoTextStyles.displaySmall,
                ),
                const SizedBox(height: LudoThemeTokens.spaceSm),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: LudoTextStyles.body,
                ),
                if (onRetry != null) ...[
                  const SizedBox(height: LudoThemeTokens.spaceMd),
                  ConstrainedBox(
                    constraints: const BoxConstraints(minHeight: _minTapTarget),
                    child: Ludo3dButton(
                      semanticLabel: 'Retry',
                      onPressed: onRetry,
                      child: Text(
                        'Retry',
                        style: LudoTextStyles.bodyStrong.copyWith(
                          color: LudoThemeTokens.textOutline,
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
