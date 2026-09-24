import 'package:flutter_test/flutter_test.dart';
import 'package:platform_core/platform_core.dart';

import 'package:ludo/src/app.dart';
import 'package:ludo/src/assets/ludo_art_manifest.dart';
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
    // The lobby header now shows the Ludo Vortex wordmark art (task 12g)
    // instead of a text title.
    expect(find.bySemanticsLabel('Ludo Vortex'), findsOneWidget);
    expect(
      find.byWidgetPredicate(
        (widget) =>
            widget is LudoArtSlot &&
            widget.slot == LudoArtManifest.logoWideSlot,
      ),
      findsOneWidget,
    );
    expect(find.text('Computer'), findsOneWidget);
  });
}
