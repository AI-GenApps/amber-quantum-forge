import 'package:flutter/material.dart';

import 'mr_tokens.dart';

/// A soft, rounded "physical card" surface with an offset drop shadow —
/// Merge Relay's replacement for flat `Card`/`DecoratedBox` chrome
/// (task 07). Used for goal cards, result summaries, and dialog bodies.
final class MrPanel extends StatelessWidget {
  const MrPanel({
    required this.child,
    this.color,
    this.padding = const EdgeInsets.all(MrTokens.space5),
    this.radius = MrTokens.radiusLarge,
    this.border,
    this.shadow = true,
    super.key,
  });

  final Widget child;
  final Color? color;
  final EdgeInsetsGeometry padding;
  final double radius;
  final BoxBorder? border;
  final bool shadow;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color ?? MrTokens.paper,
        borderRadius: BorderRadius.circular(radius),
        border: border,
        boxShadow: shadow ? MrTokens.cardShadow() : null,
      ),
      child: Padding(padding: padding, child: child),
    );
  }
}
