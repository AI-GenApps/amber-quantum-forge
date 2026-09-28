/// Behavior tests for [MatchmakingSearchScreen]'s room-code chip (task
/// 26x's "clearly legible room code with copy and native-share
/// affordances" polish target): tapping copy puts the code on the
/// clipboard and flips the icon to a checkmark, and tapping share invokes
/// the injected share seam with the full invite link — never the platform
/// channel, which doesn't exist in a `flutter test` host process.
library;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ludo/src/net/ludo_match_models.dart' show LudoMode;
import 'package:ludo/src/net/ludo_preview_online.dart'
    show createLudoPreviewOnlineClient;
import 'package:ludo/src/screens/matchmaking_search_screen.dart';

Widget _wrap(Widget child) =>
    MaterialApp(theme: ThemeData(useMaterial3: true), home: child);

void main() {
  testWidgets('tapping copy puts the room code on the clipboard', (
    tester,
  ) async {
    String? clipboardText;
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      (call) async {
        if (call.method == 'Clipboard.setData') {
          clipboardText = (call.arguments as Map)['text'] as String?;
        }
        return null;
      },
    );
    addTearDown(
      () => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        SystemChannels.platform,
        null,
      ),
    );

    final controller = createLudoPreviewOnlineClient(
      matchmakingDelay: const Duration(minutes: 10),
    ).onlineController;
    final wait = controller.startMatchmaking(
      mode: LudoMode.classic,
      seatTarget: 4,
    );

    await tester.pumpWidget(
      _wrap(
        MatchmakingSearchScreen(
          wait: wait,
          roomCode: 'ROOM001',
          inviteLink: 'w3dev-ludo://room/ROOM001',
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.byKey(const Key('room-code-copy-button')), findsOneWidget);
    await tester.tap(find.byKey(const Key('room-code-copy-button')));
    await tester.pump();

    expect(clipboardText, 'ROOM001');
    expect(find.byIcon(Icons.check_rounded), findsOneWidget);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(minutes: 11));
  });

  testWidgets('tapping share invokes the injected share seam with the link', (
    tester,
  ) async {
    final shared = <String>[];
    final controller = createLudoPreviewOnlineClient(
      matchmakingDelay: const Duration(minutes: 10),
    ).onlineController;
    final wait = controller.startMatchmaking(
      mode: LudoMode.classic,
      seatTarget: 4,
    );

    await tester.pumpWidget(
      _wrap(
        MatchmakingSearchScreen(
          wait: wait,
          roomCode: 'ROOM001',
          inviteLink: 'w3dev-ludo://room/ROOM001',
          shareInviteLink: (link) async => shared.add(link),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 50));

    await tester.tap(find.byKey(const Key('room-code-share-button')));
    await tester.pump();

    expect(shared, ['w3dev-ludo://room/ROOM001']);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(minutes: 11));
  });

  testWidgets('no room code means no room-code chip at all', (tester) async {
    final controller = createLudoPreviewOnlineClient(
      matchmakingDelay: const Duration(minutes: 10),
    ).onlineController;
    final wait = controller.startMatchmaking(
      mode: LudoMode.classic,
      seatTarget: 4,
    );

    await tester.pumpWidget(_wrap(MatchmakingSearchScreen(wait: wait)));
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.byKey(const Key('room-code-copy-button')), findsNothing);
    expect(find.byKey(const Key('room-code-share-button')), findsNothing);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(minutes: 11));
  });
}
