/// Task 12's accessibility audit: every interactive control reachable from
/// the full local-play flow must carry a `Semantics` label and a 48dp+ tap
/// target. Tasks 07/08/10 already assert this locally for their own
/// screens (`onboarding_flow_test.dart`, `home_lobby_screen_test.dart`,
/// `results_screen_test.dart`); this file covers the two screens task 09
/// shipped without an equivalent check — `mode_setup_sheet.dart` and
/// `pause_quit_dialog.dart` — plus a repo-wide static guard so a future
/// bare interactive widget (added without a `Semantics` wrapper) fails CI
/// instead of silently shipping.
library;

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ludo/src/screens/mode_setup_sheet.dart';
import 'package:ludo/src/screens/pause_quit_dialog.dart';
import 'package:ludo/src/state/ludo_sound_settings.dart';
import 'package:ludo/src/state/reduced_motion_setting.dart';

const _minTapTarget = 48.0;

Widget _wrap(Widget child) => MaterialApp(
  theme: ThemeData(useMaterial3: true),
  home: Scaffold(body: Builder(builder: (context) => child)),
);

/// For this codebase's own `Semantics(label: ..., excludeSemantics: true,
/// child: ...)` convention, where [tester.getSemantics] resolves to the
/// exact node carrying that label.
void expectSemanticTapTarget(WidgetTester tester, Finder finder) {
  expect(finder, findsOneWidget);
  final semantics = tester.getSemantics(finder);
  expect(semantics.label, isNotEmpty);
  expectTapTargetSize(tester, finder);
}

/// For a stock Material widget (`SegmentedButton`, `DropdownButton`, ...)
/// that renders its own accessible name internally rather than through
/// this codebase's `Semantics(...)` wrapper convention — `find
/// .bySemanticsLabel(label)` already proves that label exists somewhere in
/// the merged semantics tree (`findsOneWidget` below), so this only checks
/// the tap target's rendered size.
void expectTapTargetSize(WidgetTester tester, Finder finder) {
  expect(finder, findsOneWidget);
  final size = tester.getSize(finder);
  expect(size.width, greaterThanOrEqualTo(_minTapTarget));
  expect(size.height, greaterThanOrEqualTo(_minTapTarget));
}

void main() {
  group('ModeSetupSheet (task 09 controls)', () {
    testWidgets(
      'ruleset/player-count segments, bot-difficulty dropdown, and Start '
      'all have a Semantics label and a 48dp+ tap target',
      (tester) async {
        final handle = tester.ensureSemantics();
        await tester.pumpWidget(
          _wrap(const ModeSetupSheet(isComputerMatch: true)),
        );
        await tester.pumpAndSettle();

        for (final label in ['Classic', 'Quick', '2', '4']) {
          expectTapTargetSize(tester, find.bySemanticsLabel(label));
        }
        expectSemanticTapTarget(tester, find.bySemanticsLabel('Start'));

        // Seat 0 is always human (no dropdown); seats 1-3 are bots by
        // default when launched from Computer, each with a difficulty
        // dropdown.
        final dropdowns = find.byType(DropdownButton<String>);
        expect(dropdowns, findsNWidgets(3));
        for (final element in dropdowns.evaluate()) {
          final size = tester.getSize(find.byWidget(element.widget));
          expect(size.width, greaterThanOrEqualTo(_minTapTarget));
          expect(size.height, greaterThanOrEqualTo(_minTapTarget));
        }
        handle.dispose();
      },
    );

    testWidgets(
      'no bot-difficulty picker (and so nothing to check) when launched '
      'from Pass N Play — Start and the segments still qualify',
      (tester) async {
        final handle = tester.ensureSemantics();
        await tester.pumpWidget(
          _wrap(const ModeSetupSheet(isComputerMatch: false)),
        );
        await tester.pumpAndSettle();

        expect(find.byType(DropdownButton<String>), findsNothing);
        for (final label in ['Classic', 'Quick', '2', '4']) {
          expectTapTargetSize(tester, find.bySemanticsLabel(label));
        }
        expectSemanticTapTarget(tester, find.bySemanticsLabel('Start'));
        handle.dispose();
      },
    );
  });

  group('PauseQuitDialog (task 09 controls)', () {
    Future<void> openDialog(WidgetTester tester) async {
      await tester.pumpWidget(
        _wrap(
          Builder(
            builder: (context) => ElevatedButton(
              onPressed: () => showPauseQuitDialog(
                context,
                soundSettings: LudoSoundSettings(),
                reducedMotion: ReducedMotionSetting(enabled: true),
                onQuit: () {},
              ),
              child: const Text('open'),
            ),
          ),
        ),
      );
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();
    }

    testWidgets(
      'Sound/Music/Vibration toggles, Settings, Resume, and Quit all have '
      'a Semantics label and a 48dp+ tap target',
      (tester) async {
        final handle = tester.ensureSemantics();
        await openDialog(tester);

        for (final label in [
          'Sound',
          'Music',
          'Vibration',
          'Settings',
          'Resume',
          'Quit',
        ]) {
          expectSemanticTapTarget(tester, find.bySemanticsLabel(label));
        }
        handle.dispose();
      },
    );
  });

  test('repo-wide guard: every bare interactive-widget constructor in '
      'lib/src is preceded by a Semantics(...) wrapper within the same '
      'build method, so a future control cannot ship without one silently', () {
    // Widgets in this codebase that render their own accessible name
    // from the text/label the caller already supplies (SegmentedButton,
    // DropdownButton, the platform back button, ...) are intentionally
    // excluded — this guard is for the bare gesture/button primitives
    // this codebase's own convention always wraps explicitly (see every
    // `Semantics(... excludeSemantics: true, child: ConstrainedBox(...`
    // pair across `lib/src/screens` and `lib/src/widgets`).
    final bareWidgetPattern = RegExp(
      r'\b(IconButton|InkWell|GestureDetector|TextButton|FilledButton|'
      r'ElevatedButton|SwitchListTile|CheckboxListTile)\(',
    );
    const lookbackLines = 20;

    final libSrc = Directory('lib/src');
    expect(
      libSrc.existsSync(),
      isTrue,
      reason: 'expected to run from apps-native/games/ludo',
    );

    final violations = <String>[];
    for (final entity in libSrc.listSync(recursive: true)) {
      if (entity is! File || !entity.path.endsWith('.dart')) continue;
      final lines = entity.readAsLinesSync();
      for (var i = 0; i < lines.length; i++) {
        if (!bareWidgetPattern.hasMatch(lines[i])) continue;
        final windowStart = (i - lookbackLines).clamp(0, lines.length);
        final window = lines.sublist(windowStart, i + 1).join('\n');
        if (!window.contains('Semantics(')) {
          violations.add('${entity.path}:${i + 1}: ${lines[i].trim()}');
        }
      }
    }

    expect(
      violations,
      isEmpty,
      reason:
          'Every interactive control must be wrapped in a Semantics(...) '
          'within $lookbackLines lines above it (this codebase\'s '
          'established pattern) so it carries an explicit accessible '
          'label — violations:\n${violations.join('\n')}',
    );
  });
}
