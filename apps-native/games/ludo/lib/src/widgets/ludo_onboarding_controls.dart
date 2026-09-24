/// Small shared controls for the onboarding screens (task 07): a
/// consistently-labeled Skip action and a primary action button, both
/// guaranteed to meet the 48dp minimum tap target this task's acceptance
/// criteria require of every interactive control in the flow.
library;

import 'package:flutter/material.dart';

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
        child: TextButton(onPressed: onPressed, child: Text(label)),
      ),
    );
  }
}

/// A primary (filled) onboarding action button — "Get Started", "Continue",
/// "Finish", etc — with the same guaranteed 48dp+ tap target.
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
    return Semantics(
      button: true,
      enabled: onPressed != null,
      label: semanticsLabel ?? label,
      excludeSemantics: true,
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          minWidth: ludoOnboardingMinTapTarget,
          minHeight: ludoOnboardingMinTapTarget,
        ),
        child: FilledButton(onPressed: onPressed, child: Text(label)),
      ),
    );
  }
}
