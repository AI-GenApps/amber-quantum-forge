/// A chunky "3D" glossy button: gradient fill, darker bottom edge
/// suggesting depth, and a press-down scale/offset animation on tap
/// (task 12b).
library;

import 'package:flutter/material.dart';

import '../theme/ludo_theme_tokens.dart';

/// A glossy gradient button that visibly presses down (scales down and
/// shifts toward its shadow) between tap-down and tap-up/tap-cancel.
class Ludo3dButton extends StatefulWidget {
  const Ludo3dButton({
    super.key,
    required this.child,
    required this.semanticLabel,
    this.onPressed,
    this.color = LudoThemeTokens.gold,
    this.padding = const EdgeInsets.symmetric(
      horizontal: LudoThemeTokens.spaceLg,
      vertical: LudoThemeTokens.spaceMd,
    ),
    this.borderRadius = LudoThemeTokens.radiusMd,
  });

  final Widget child;

  /// Accessible label for this button, following this codebase's
  /// `Semantics(..., excludeSemantics: true, ...)` convention (see
  /// `test/accessibility/ludo_tap_targets_test.dart`'s repo-wide guard) —
  /// required so no caller can ship a `Ludo3dButton` without one.
  final String semanticLabel;
  final VoidCallback? onPressed;
  final Color color;
  final EdgeInsetsGeometry padding;
  final double borderRadius;

  @override
  State<Ludo3dButton> createState() => _Ludo3dButtonState();
}

class _Ludo3dButtonState extends State<Ludo3dButton> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (_pressed != value) setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final bottomEdge = HSLColor.fromColor(widget.color)
        .withLightness(
          (HSLColor.fromColor(widget.color).lightness - 0.18).clamp(0, 1),
        )
        .toColor();

    return Semantics(
      button: true,
      label: widget.semanticLabel,
      enabled: widget.onPressed != null,
      excludeSemantics: true,
      child: GestureDetector(
        onTapDown: widget.onPressed == null ? null : (_) => _setPressed(true),
        onTapUp: widget.onPressed == null ? null : (_) => _setPressed(false),
        onTapCancel: widget.onPressed == null ? null : () => _setPressed(false),
        onTap: widget.onPressed,
        child: AnimatedScale(
          scale: _pressed ? 0.94 : 1.0,
          duration: const Duration(milliseconds: 90),
          curve: Curves.easeOut,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 90),
            transform: Matrix4.translationValues(0, _pressed ? 3 : 0, 0),
            padding: widget.padding,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(widget.borderRadius),
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [widget.color, bottomEdge],
              ),
              border: Border(
                bottom: BorderSide(color: bottomEdge, width: _pressed ? 1 : 4),
              ),
              boxShadow: _pressed ? const [] : LudoThemeTokens.shadowButton,
            ),
            child: DefaultTextStyle.merge(
              style: const TextStyle(
                fontFamily: LudoThemeTokens.fontBody,
                fontWeight: FontWeight.w800,
                color: LudoThemeTokens.textOutline,
              ),
              child: Center(
                widthFactor: 1,
                heightFactor: 1,
                child: widget.child,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
