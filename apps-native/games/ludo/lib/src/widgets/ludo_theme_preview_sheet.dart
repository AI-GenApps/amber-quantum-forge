/// The theme preview shown before buying (task 26g): a dice roll animation,
/// a token set on the equipped board, or the board backdrop swapped in.
/// Honors reduced motion: with it on, the dice simply shows its final face.
library;

import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../net/ludo_gateway.dart' show LudoCatalogItem;
import '../state/ludo_inventory_state.dart';
import '../state/reduced_motion_setting.dart';
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import 'ludo_3d_button.dart';
import 'ludo_panel.dart';
import 'ludo_store_cards.dart';
import 'ludo_store_theme_art.dart';

const ludoThemePreviewRollDuration = Duration(milliseconds: 700);
const _rollFaces = [3, 5, 1, 4, 2, 6];

/// Opens the preview for [item] as a modal bottom sheet. [onBuy] and
/// [onEquip] run the same flows as the card's own buttons.
Future<void> showLudoThemePreviewSheet(
  BuildContext context, {
  required LudoCatalogItem item,
  required LudoInventoryState inventory,
  required void Function(LudoCurrency currency) onBuy,
  required Future<void> Function() onEquip,
  ReducedMotionSetting? reducedMotion,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => LudoThemePreviewSheet(
      item: item,
      inventory: inventory,
      onBuy: (currency) {
        Navigator.of(context).pop();
        onBuy(currency);
      },
      onEquip: () async {
        await onEquip();
        if (context.mounted) Navigator.of(context).pop();
      },
      reducedMotion: reducedMotion,
    ),
  );
}

class LudoThemePreviewSheet extends StatelessWidget {
  const LudoThemePreviewSheet({
    super.key,
    required this.item,
    required this.inventory,
    required this.onBuy,
    required this.onEquip,
    this.reducedMotion,
  });

  final LudoCatalogItem item;
  final LudoInventoryState inventory;
  final void Function(LudoCurrency currency) onBuy;
  final VoidCallback onEquip;
  final ReducedMotionSetting? reducedMotion;

  @override
  Widget build(BuildContext context) {
    final category = item.category ?? LudoThemeCategory.dice;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(LudoThemeTokens.spaceMd),
        child: Semantics(
          container: true,
          label: 'Preview of ${item.displayName}',
          child: LudoPanel(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  item.displayName,
                  textAlign: TextAlign.center,
                  style: LudoTextStyles.displaySmall,
                ),
                const SizedBox(height: LudoThemeTokens.spaceMd),
                Center(
                  child: switch (category) {
                    LudoThemeCategory.dice => _DiceRollPreview(
                      itemId: item.itemId,
                      reducedMotion: reducedMotion?.value ?? false,
                    ),
                    LudoThemeCategory.token => LudoStoreThemeArt(
                      key: const Key('store-preview-token'),
                      itemId: item.itemId,
                      category: category,
                      size: const Size.square(200),
                      boardItemId: inventory.equippedId(
                        LudoThemeCategory.board,
                      ),
                    ),
                    LudoThemeCategory.board => LudoStoreThemeArt(
                      key: const Key('store-preview-board'),
                      itemId: item.itemId,
                      category: category,
                      size: const Size.square(220),
                    ),
                  },
                ),
                const SizedBox(height: LudoThemeTokens.spaceMd),
                AnimatedBuilder(
                  animation: inventory,
                  builder: (context, _) => LudoThemeActions(
                    item: item,
                    inventory: inventory,
                    onBuy: onBuy,
                    onEquip: onEquip,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DiceRollPreview extends StatefulWidget {
  const _DiceRollPreview({required this.itemId, required this.reducedMotion});

  final String itemId;
  final bool reducedMotion;

  @override
  State<_DiceRollPreview> createState() => _DiceRollPreviewState();
}

class _DiceRollPreviewState extends State<_DiceRollPreview>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: ludoThemePreviewRollDuration,
    value: 1,
  );

  @override
  void initState() {
    super.initState();
    _roll();
  }

  void _roll() {
    if (widget.reducedMotion) {
      _controller.value = 1;
      return;
    }
    _controller.forward(from: 0);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            final t = _controller.value;
            final face = t >= 1
                ? 6
                : _rollFaces[(t * _rollFaces.length).floor() %
                      _rollFaces.length];
            return Transform.rotate(
              angle: math.sin(t * math.pi * 4) * (1 - t) * 0.6,
              child: LudoStoreThemeArt(
                key: const Key('store-preview-dice'),
                itemId: widget.itemId,
                category: LudoThemeCategory.dice,
                size: const Size.square(120),
                diceFace: face,
              ),
            );
          },
        ),
        const SizedBox(height: LudoThemeTokens.spaceSm),
        ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 48),
          child: Ludo3dButton(
            key: const Key('store-preview-roll'),
            semanticLabel: 'Roll the preview dice',
            onPressed: _roll,
            color: LudoThemeTokens.backgroundMidBlue,
            padding: const EdgeInsets.symmetric(
              horizontal: LudoThemeTokens.spaceMd,
              vertical: LudoThemeTokens.spaceSm,
            ),
            child: Text('Roll', style: LudoTextStyles.bodyStrong),
          ),
        ),
      ],
    );
  }
}
