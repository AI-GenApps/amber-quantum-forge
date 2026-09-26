import 'package:flutter/material.dart';

import 'mr_tokens.dart';

/// A round, bordered icon tap target (task 11) — Merge Relay's replacement
/// for a bare stock `IconButton` on chrome that needs to read as a
/// deliberately designed control (header back/settings/pause) rather than
/// a plain glyph floating on the background.
final class MrIconButton extends StatelessWidget {
  const MrIconButton({
    required this.icon,
    required this.onPressed,
    required this.tooltip,
    this.color,
    this.filled = false,
    super.key,
  });

  final IconData icon;
  final VoidCallback? onPressed;
  final String tooltip;
  final Color? color;

  /// A solid ink-filled circle (paper glyph) instead of the default
  /// outlined-on-paper look — used where the button needs to read as the
  /// primary action on its row (e.g. the pause dialog's resume glyph).
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final ink = color ?? MrTokens.ink;
    final disabled = onPressed == null;
    return Semantics(
      button: true,
      enabled: !disabled,
      label: tooltip,
      child: Tooltip(
        message: tooltip,
        child: GestureDetector(
          onTap: onPressed,
          child: DecoratedBox(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: filled ? ink.withValues(alpha: disabled ? 0.4 : 1) : null,
              border: filled
                  ? null
                  : Border.all(
                      color: ink.withValues(alpha: disabled ? 0.18 : 0.32),
                    ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Icon(
                icon,
                size: 22,
                color: filled
                    ? MrTokens.paper
                    : ink.withValues(alpha: disabled ? 0.4 : 1),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
