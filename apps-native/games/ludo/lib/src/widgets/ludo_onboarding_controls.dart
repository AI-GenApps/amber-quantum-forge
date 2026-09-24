/// Small shared controls for the onboarding screens (task 07): a
/// consistently-labeled Skip action and a primary action button, both
/// guaranteed to meet the 48dp minimum tap target this task's acceptance
/// criteria require of every interactive control in the flow.
///
/// Task 12e restyles both onto the design system (12b): [LudoPrimaryButton]
/// now wraps [Ludo3dButton] and [LudoSkipButton] picks up the outlined gold
/// text treatment, so every onboarding screen that already builds on these
/// two shared widgets is restyled for free, with no per-screen button code
/// duplicated.
library;

import 'package:flutter/material.dart';

import '../theme/ludo_theme_tokens.dart';
import 'ludo_3d_button.dart';

/// Minimum tap-target side (dp) task 07 requires of every interactive
/// control in the onboarding screens.
const ludoOnboardingMinTapTarget = 48.0;

/// The Skip action shown on every onboarding screen. Always visible, never
/// gated behind any condition — skipping must be reachable from every step.
class LudoSkipButton extends StatelessWidget {
  const LudoSkipButton({
    super.key,
    required this.onPressed,
    this.label = 'Skip',
  });

  final VoidCallback onPressed;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      excludeSemantics: true,
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          minWidth: ludoOnboardingMinTapTarget,
          minHeight: ludoOnboardingMinTapTarget,
        ),
        child: TextButton(
          onPressed: onPressed,
          style: TextButton.styleFrom(
            foregroundColor: LudoThemeTokens.textOnDark,
            textStyle: const TextStyle(
              fontFamily: LudoThemeTokens.fontBody,
              fontWeight: FontWeight.w800,
            ),
          ),
          child: Text(label),
        ),
      ),
    );
  }
}

/// A primary (filled) onboarding action button — "Get Started", "Continue",
/// "Finish", etc — with the same guaranteed 48dp+ tap target, built on the
/// design system's chunky glossy [Ludo3dButton].
class LudoPrimaryButton extends StatelessWidget {
  const LudoPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.semanticsLabel,
  });

  final String label;
  final VoidCallback? onPressed;
  final String? semanticsLabel;

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: ludoOnboardingMinTapTarget),
      child: SizedBox(
        width: double.infinity,
        child: Ludo3dButton(
          semanticLabel: semanticsLabel ?? label,
          onPressed: onPressed,
          padding: const EdgeInsets.symmetric(
            horizontal: LudoThemeTokens.spaceLg,
            vertical: LudoThemeTokens.spaceMd,
          ),
          child: Text(label, style: const TextStyle(fontSize: 16)),
        ),
      ),
    );
  }
}
