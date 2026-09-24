/// A gold-framed glossy rounded-rect panel, the base surface every card
/// (player cards, dialogs, sheets) builds on (task 12b).
library;

import 'package:flutter/material.dart';

import '../theme/ludo_theme_tokens.dart';

/// A gold-framed glossy panel with a subtle top-to-bottom gradient and
/// drop shadow. Reused later by player cards ([LudoDialogFrame] wraps it
/// for dialogs).
class LudoPanel extends StatelessWidget {
  const LudoPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(LudoThemeTokens.spaceMd),
    this.borderRadius,
    this.borderWidth = 3,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final BorderRadiusGeometry? borderRadius;
  final double borderWidth;

  @override
  Widget build(BuildContext context) {
    final radius =
        borderRadius ?? BorderRadius.circular(LudoThemeTokens.radiusMd);
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: radius,
        border: Border.all(color: LudoThemeTokens.gold, width: borderWidth),
        boxShadow: LudoThemeTokens.shadowPanel,
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            LudoThemeTokens.backgroundMidBlue,
            LudoThemeTokens.backgroundDeepBlue,
          ],
        ),
      ),
      child: Padding(padding: padding, child: child),
    );
  }
}
