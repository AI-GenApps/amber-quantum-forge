import 'package:flutter/material.dart';

import 'mr_button.dart';
import 'mr_panel.dart';
import 'mr_tokens.dart';

/// Merge Relay's dialog chrome (task 07): a rounded [MrPanel] body with a
/// Fredoka title and up to two [MrButton] actions, wrapping the platform
/// `Dialog` so it still respects `showDialog`'s barrier/animation but never
/// shows the stock `AlertDialog` look.
final class MrDialog extends StatelessWidget {
  const MrDialog({
    required this.title,
    required this.message,
    this.primaryLabel,
    this.onPrimary,
    this.secondaryLabel,
    this.onSecondary,
    super.key,
  });

  final String title;
  final String message;
  final String? primaryLabel;
  final VoidCallback? onPrimary;
  final String? secondaryLabel;
  final VoidCallback? onSecondary;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 28),
      child: MrPanel(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontFamily: 'Fredoka',
                color: MrTokens.ink,
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: MrTokens.space2),
            Text(
              message,
              style: TextStyle(
                fontFamily: 'NunitoSans',
                color: MrTokens.ink.withValues(alpha: 0.72),
                fontSize: 14,
                height: 1.3,
              ),
            ),
            const SizedBox(height: MrTokens.space5),
            if (secondaryLabel != null) ...[
              MrButton(
                label: secondaryLabel!,
                variant: MrButtonVariant.secondary,
                onPressed: onSecondary,
              ),
              const SizedBox(height: MrTokens.space2),
            ],
            if (primaryLabel != null)
              MrButton(label: primaryLabel!, onPressed: onPrimary),
          ],
        ),
      ),
    );
  }
}
