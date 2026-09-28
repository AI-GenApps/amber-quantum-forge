/// A themed "reconnecting" banner (task 26x): shown over
/// `game_board_screen.dart` during an online match whenever the active
/// [LudoMatchStateSource] reports its connectivity has dropped (a failed
/// poll tick, or a Firestore stream hiccup while still on the primary
/// listener) and hidden again the moment it reports connectivity restored.
/// Deliberately not a Material `SnackBar`/`Banner` — a small pill using the
/// same gold/navy chrome and bundled display font as every other online
/// surface this task restyled, per this task's "no Material-default
/// styling anywhere in the online flow" Context/Decisions.
library;

import 'package:flutter/material.dart';

import '../theme/ludo_theme_tokens.dart';
import 'ludo_searching_indicator.dart';

/// A compact, top-anchored pill reading "Reconnecting...". Purely
/// presentational — the caller decides when to show/hide it based on
/// [LudoMatchStateSource.connected]'s latest value.
class LudoReconnectingBanner extends StatelessWidget {
  const LudoReconnectingBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.topCenter,
      child: SafeArea(
        child: Container(
          margin: const EdgeInsets.only(top: LudoThemeTokens.spaceSm),
          padding: const EdgeInsets.symmetric(
            horizontal: LudoThemeTokens.spaceLg,
            vertical: LudoThemeTokens.spaceSm,
          ),
          decoration: BoxDecoration(
            color: LudoThemeTokens.backgroundDeepBlue,
            borderRadius: BorderRadius.circular(LudoThemeTokens.radiusPill),
            border: Border.all(color: LudoThemeTokens.gold, width: 2),
            boxShadow: LudoThemeTokens.shadowPanel,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Reuses the same tumbling-die/gold-ring indicator the
              // matchmaking screen already uses (task 26x), at banner
              // scale, rather than a bare Material spinner.
              const LudoSearchingIndicator(size: 20),
              const SizedBox(width: LudoThemeTokens.spaceSm),
              Text(
                'Reconnecting…',
                style: TextStyle(
                  fontFamily: LudoThemeTokens.fontDisplay,
                  color: LudoThemeTokens.textOnDark,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
