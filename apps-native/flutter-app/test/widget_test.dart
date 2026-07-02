import 'package:flutter/material.dart';
import 'package:flutter_app/features/onboarding/onboarding_screen.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('OnboardingScreen renders the first slide', (tester) async {
    await tester.pumpWidget(
      MaterialAppWrapper(
        child: OnboardingScreen(onComplete: () {}),
      ),
    );

    expect(find.text('Welcome'), findsOneWidget);
  });
}

/// Minimal MaterialApp wrapper so widget tests don't need to depend on
/// the full `StarterApp` (which requires Firebase initialization).
class MaterialAppWrapper extends StatelessWidget {
  const MaterialAppWrapper({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(home: child);
  }
}
