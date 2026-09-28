import 'package:flutter/material.dart';

import 'mr_tokens.dart';

/// A small rounded stat chip (task 07) — score, best-tile, and move counts
/// on the play screen use this instead of a bare `Text`/`Chip`.
final class MrPill extends StatelessWidget {
  const MrPill({
    required this.label,
    this.icon,
    this.color,
    this.foreground,
    super.key,
  });

  final String label;
  final IconData? icon;
  final Color? color;
  final Color? foreground;

  @override
  Widget build(BuildContext context) {
    final background = color ?? MrTokens.ink;
    final onColor = foreground ?? MrTokens.paper;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(MrTokens.radiusPill),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: MrTokens.space3,
          vertical: MrTokens.space1 + 2,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, color: onColor, size: 14),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Fredoka',
                color: onColor,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
