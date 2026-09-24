import 'package:flutter_test/flutter_test.dart';
import 'package:platform_core/platform_core.dart';

import 'package:ludo/src/app.dart';
import 'package:ludo/src/state/ludo_profile_settings.dart';

AppContext _context() => AppContext(
  identity: ludoIdentity,
  environment: AppEnvironment.debug,
  appVersion: '0.1.0',
  sessionId: 'test-session',
);

void main() {
  testWidgets('boots offline and, once onboarded, reaches the home screen', (
    tester,
  ) async {
    final store = LudoProfileStore(
      saveStore: MemorySaveStore(),
      appContext: _context(),
    );
    await tester.pumpWidget(
      LudoApp(
        profileSettings: LudoProfileSettings(onboardingComplete: true),
        profileStore: store,
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));
    await tester.pumpAndSettle();

    // The app boots straight to the home lobby (after the splash's
    // local-only profile load) with zero Firebase/network dependency
    // anywhere in the widget tree.
    expect(find.byType(HomeLobbyScreen), findsOneWidget);
    // The design system's `LudoOutlinedTitle` (task 12e) stacks an outline
    // and fill layer, each an independent `Text` with the same string.
    expect(find.text('Ludo'), findsNWidgets(2));
    expect(find.text('Computer'), findsOneWidget);
  });
}
