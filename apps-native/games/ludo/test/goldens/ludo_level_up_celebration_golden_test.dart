import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ludo/src/state/reduced_motion_setting.dart';
import 'package:ludo/src/theme/ludo_theme.dart';
import 'package:ludo/src/theme/ludo_theme_tokens.dart';
import 'package:ludo/src/widgets/ludo_level_up_celebration.dart';

Widget _harness(Widget child) => MaterialApp(
  theme: buildLudoTheme(),
  home: Scaffold(
    backgroundColor: LudoThemeTokens.backgroundDeepBlue,
    body: child,
  ),
);

/// Golden test for the level-up celebration's static (reduced-motion)
/// frame (task 26e): under reduced motion, no [AnimationController] ever
/// runs, so the very first pumped frame *is* the final frame — the same
/// frame a screenshot would show at any later time. Run `flutter test
/// --update-goldens test/goldens/ludo_level_up_celebration_golden_test.dart`
/// after any intentional visual change.
void main() {
  testWidgets(
    'reduced motion shows a static confetti frame with the reward summary',
    (tester) async {
      final reducedMotion = ReducedMotionSetting(enabled: true);
      await tester.pumpWidget(
        _harness(
          LudoLevelUpCelebration(
            newLevel: 5,
            reward: const LudoLevelUpReward(
              coins: 200,
              diamonds: 5,
              themeUnlockName: 'Vortex',
            ),
            reducedMotion: reducedMotion,
            // Seeded so the golden's confetti layout is reproducible
            // (mirrors `ludo_effects_golden_test.dart`'s `win confetti
            // mid-fall` precedent).
            random: math.Random(7),
          ),
        ),
      );
      // No animation controller exists under reduced motion, so a single
      // `pump()` (no duration) already reaches the settled frame.
      await tester.pump();

      await expectLater(
        find.byType(LudoLevelUpCelebration),
        matchesGoldenFile('level_up_celebration_reduced_motion.png'),
      );
    },
  );
}
