/// Goldens for the online screens/states task 26x restyles: the
/// matchmaking "searching" indicator (now the themed
/// [LudoSearchingIndicator] instead of a Material `CircularProgressIndicator`)
/// and its failed/offline state, plus the Play-with-Friends create/join
/// sheet (including a pre-filled join code, as a routed invite link
/// leaves it). Run `flutter test --update-goldens
/// test/goldens/online_screens_golden_test.dart` after any intentional
/// visual change.
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ludo/src/net/ludo_match_models.dart' show LudoMode;
import 'package:ludo/src/net/ludo_online_controller.dart';
import 'package:ludo/src/net/ludo_preview_online.dart'
    show createLudoPreviewOnlineClient;
import 'package:ludo/src/screens/matchmaking_search_screen.dart';
import 'package:ludo/src/screens/mode_setup_sheet.dart';
import 'package:ludo/src/theme/ludo_theme.dart';
import 'package:ludo/src/theme/ludo_theme_tokens.dart';
import 'package:ludo/src/widgets/ludo_reconnecting_banner.dart';

Widget _wrap(Widget child) => MaterialApp(
  theme: buildLudoTheme(),
  home: Scaffold(body: child),
);

/// A [LudoOnlineController] whose `startMatchmaking` wait never resolves
/// during the test (the preview client's real matchmaking delay is many
/// seconds — far longer than any `pump` below advances), so the
/// "searching" golden captures a genuinely in-flight state.
LudoOnlineController _neverResolvingController() =>
    createLudoPreviewOnlineClient(
      matchmakingDelay: const Duration(minutes: 10),
      roomFillDelay: const Duration(minutes: 10),
    ).onlineController;

void main() {
  testWidgets('matchmaking search shows the themed searching indicator', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(420, 933);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    final controller = _neverResolvingController();
    final wait = controller.startMatchmaking(
      mode: LudoMode.classic,
      seatTarget: 4,
    );

    await tester.pumpWidget(_wrap(MatchmakingSearchScreen(wait: wait)));
    // A few short pumps to let the die-face timer/ring animation advance
    // without ever calling `pumpAndSettle` (which would hang on the
    // continuously-repeating `AnimationController`).
    for (var i = 0; i < 3; i++) {
      await tester.pump(const Duration(milliseconds: 220));
    }

    await expectLater(
      find.byType(MatchmakingSearchScreen),
      matchesGoldenFile('matchmaking_search_screen.png'),
    );

    // Tear down every pending timer (the searching indicator's face
    // ticker, the preview transport's own scripted matchmaking-delay
    // timer) explicitly and in-test, since
    // `AutomatedTestWidgetsFlutterBinding` asserts no timer is left
    // pending once the test body returns: advancing past the (very long,
    // deliberately never-reached-during-capture) matchmaking delay lets
    // the transport's internal `Timer` fire and settle harmlessly, rather
    // than trying to cancel an object this test has no handle on.
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(minutes: 11));
  });

  testWidgets(
    'room-fill wait shows a legible room code with copy/share affordances',
    (tester) async {
      tester.view.physicalSize = const Size(420, 933);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      final controller = _neverResolvingController();
      final wait = controller.startMatchmaking(
        mode: LudoMode.classic,
        seatTarget: 4,
      );

      await tester.pumpWidget(
        _wrap(
          MatchmakingSearchScreen(
            wait: wait,
            title: 'Waiting for a friend...',
            roomCode: 'ROOM001',
            inviteLink: 'w3dev-ludo://room/ROOM001',
            shareInviteLink: (_) async {},
          ),
        ),
      );
      for (var i = 0; i < 3; i++) {
        await tester.pump(const Duration(milliseconds: 220));
      }

      await expectLater(
        find.byType(MatchmakingSearchScreen),
        matchesGoldenFile('room_fill_wait_with_code.png'),
      );

      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pump(const Duration(minutes: 11));
    },
  );

  testWidgets('friends setup sheet create tab uses design-system chrome', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(420, 933);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(_wrap(const FriendsSetupSheet()));
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(FriendsSetupSheet),
      matchesGoldenFile('friends_setup_sheet_create.png'),
    );
  });

  testWidgets('friends setup sheet join tab pre-fills a routed invite code', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(420, 933);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      _wrap(const FriendsSetupSheet(initialJoinCode: 'ABC123')),
    );
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(FriendsSetupSheet),
      matchesGoldenFile('friends_setup_sheet_join_prefilled.png'),
    );
  });

  testWidgets(
    'reconnecting banner uses design-system chrome, not a Material banner',
    (tester) async {
      tester.view.physicalSize = const Size(420, 933);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      await tester.pumpWidget(
        _wrap(
          Container(
            color: LudoThemeTokens.backgroundMidBlue,
            child: const LudoReconnectingBanner(),
          ),
        ),
      );
      for (var i = 0; i < 3; i++) {
        await tester.pump(const Duration(milliseconds: 220));
      }

      await expectLater(
        find.byType(LudoReconnectingBanner),
        matchesGoldenFile('reconnecting_banner.png'),
      );

      await tester.pumpWidget(const SizedBox.shrink());
    },
  );
}
