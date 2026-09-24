/// Task 12d's parameterized overflow guard: the four-corner-card layout
/// must never `RenderFlex` overflow or clip text, from a small phone
/// (360x640) up to the baseline device (1080x2400) — for both a 2-player
/// and a 4-player match, since 2p occupies only two of the four corner
/// slots and 4p occupies all of them.
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo_rules/ludo_rules.dart';

import 'package:ludo/src/screens/game_board_screen.dart';
import 'package:ludo/src/screens/mode_setup_sheet.dart';
import 'package:ludo/src/state/ludo_sound_settings.dart';
import 'package:ludo/src/state/reduced_motion_setting.dart';

const _seedRollingFour = 1;

const _twoPlayerConfig = LudoLocalMatchConfig(
  ruleset: LudoRuleset.quick,
  isComputerMatch: true,
  seats: [
    LudoSeatConfig(color: LudoColor.red, isBot: false),
    LudoSeatConfig(color: LudoColor.green, isBot: true, botDifficulty: 'easy'),
  ],
);

const _fourPlayerConfig = LudoLocalMatchConfig(
  ruleset: LudoRuleset.classic,
  isComputerMatch: true,
  seats: [
    LudoSeatConfig(color: LudoColor.red, isBot: false),
    LudoSeatConfig(color: LudoColor.green, isBot: true, botDifficulty: 'easy'),
    LudoSeatConfig(color: LudoColor.yellow, isBot: true, botDifficulty: 'easy'),
    LudoSeatConfig(color: LudoColor.blue, isBot: true, botDifficulty: 'easy'),
  ],
);

const _twoPlayerIdentities = [
  LudoSeatIdentity(name: 'You', avatarId: 'red-face'),
  LudoSeatIdentity(name: 'Bot', avatarId: 'green-face'),
];

const _fourPlayerIdentities = [
  LudoSeatIdentity(name: 'You', avatarId: 'red-face'),
  LudoSeatIdentity(name: 'A Fairly Long Bot Name', avatarId: 'green-face'),
  LudoSeatIdentity(name: 'Bot 2', avatarId: 'yellow-face'),
  LudoSeatIdentity(name: 'Bot 3', avatarId: 'blue-face'),
];

Widget _wrap(Widget child) =>
    MaterialApp(theme: ThemeData(useMaterial3: true), home: child);

/// Pumps past the game widget's own render loop without ever waiting for
/// it to go idle (a live `FlameGame` reschedules every frame, so
/// `pumpAndSettle` would hang) — mirrors `game_board_screen_test.dart`'s
/// `_pumpGame` helper.
Future<void> _pumpGame(WidgetTester tester) async {
  const step = Duration(milliseconds: 50);
  const total = Duration(milliseconds: 300);
  var elapsed = Duration.zero;
  while (elapsed < total) {
    await tester.pump(step);
    elapsed += step;
  }
}

/// The physical sizes (device px, at devicePixelRatio 1 so they equal
/// logical px) this guard sweeps, from a small phone up to the baseline
/// Samsung A52 device this epic verifies on.
const _sizesToCheck = [
  Size(360, 640),
  Size(390, 844),
  Size(768, 1024),
  Size(1080, 2400),
];

void main() {
  for (final size in _sizesToCheck) {
    for (final entry in [
      (
        label: '2-player',
        config: _twoPlayerConfig,
        identities: _twoPlayerIdentities,
      ),
      (
        label: '4-player',
        config: _fourPlayerConfig,
        identities: _fourPlayerIdentities,
      ),
    ]) {
      testWidgets('${entry.label} game board at ${size.width.toInt()}x'
          '${size.height.toInt()} renders with no RenderFlex overflow or '
          'clipped text', (tester) async {
        tester.view.physicalSize = size;
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.reset);

        await tester.pumpWidget(
          _wrap(
            GameBoardScreen(
              config: entry.config,
              seatIdentities: entry.identities,
              soundSettings: LudoSoundSettings(),
              diceSeed: _seedRollingFour,
              reducedMotion: ReducedMotionSetting(enabled: true),
            ),
          ),
        );
        await _pumpGame(tester);

        // A RenderFlex overflow (or any other layout/render exception)
        // surfaces here as a caught `FlutterError`, not a thrown one —
        // `takeException()` is the correct way to observe it in a
        // widget test.
        expect(
          tester.takeException(),
          isNull,
          reason:
              '${entry.label} board overflowed or errored at '
              '${size.width.toInt()}x${size.height.toInt()}',
        );
      });
    }
  }
}
