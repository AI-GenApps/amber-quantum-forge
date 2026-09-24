/// A small circular/pill accent badge, e.g. for notification counts or
/// rank numbers (task 12b).
library;

import 'package:flutter/material.dart';

import '../theme/ludo_theme_tokens.dart';

/// A gold circular/pill badge showing a short label (count, rank, etc).
///
/// Named `LudoBadge` (not `Badge`) to avoid colliding with Flutter's
/// built-in `Badge` widget.
class LudoBadge extends StatelessWidget {
  const LudoBadge({
    super.key,
    required this.label,
    this.color = LudoThemeTokens.gold,
    this.textColor = LudoThemeTokens.textOutline,
    this.diameter = 24,
  });

  final String label;
  final Color color;
  final Color textColor;
  final double diameter;

  @override
  Widget build(BuildContext context) {
    final isWide = label.length > 2;
    // Deliberately no `alignment:` on this Container — per its own docs,
    // a Container with `alignment` set but no explicit width/height
    // expands to fill whatever space its parent offers (behaving like an
    // `Align`), which would stretch this badge to the height of its
    // surrounding row/column instead of hugging its label. `Center`
    // around the `Text` gets the same centering without that expansion.
    return Container(
      constraints: BoxConstraints(minWidth: diameter, minHeight: diameter),
      padding: isWide
          ? const EdgeInsets.symmetric(horizontal: LudoThemeTokens.spaceSm)
          : EdgeInsets.zero,
      decoration: BoxDecoration(
        color: color,
        shape: isWide ? BoxShape.rectangle : BoxShape.circle,
        borderRadius: isWide
            ? BorderRadius.circular(LudoThemeTokens.radiusPill)
            : null,
        border: Border.all(color: LudoThemeTokens.goldDeep, width: 1.5),
      ),
      child: Center(
        widthFactor: 1,
        heightFactor: 1,
        child: Text(
          label,
          style: TextStyle(
            fontFamily: LudoThemeTokens.fontDisplay,
            fontSize: diameter * 0.5,
            color: textColor,
            height: 1,
          ),
        ),
      ),
    );
  }
}
