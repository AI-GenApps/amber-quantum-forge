// Loads every checked-in fixture under `test/fixtures/` and asserts that
// replaying its recorded event log through `ludo_replay.dart`'s `replay()`
// reproduces its recorded final state exactly. This is this task's own
// confidence that the fixtures are internally self-consistent; the actual
// cross-runtime (Dart vs TS) parity mechanism is task 17's concern (see
// `tasks/epics/15-ludo-launch/02-rules-bots-fixtures.md`).
import 'dart:convert';
import 'dart:io';

import 'package:ludo_rules/ludo_rules.dart';
import 'package:test/test.dart';

void main() {
  final fixturesDir = Directory('test/fixtures');
  final fixtureFiles =
      fixturesDir
          .listSync()
          .whereType<File>()
          .where((f) => f.path.endsWith('.json'))
          .toList()
        ..sort((a, b) => a.path.compareTo(b.path));

  test('at least 8 fixtures are checked in', () {
    expect(fixtureFiles.length, greaterThanOrEqualTo(8));
  });

  for (final file in fixtureFiles) {
    test(
      '${file.uri.pathSegments.last} replays to its recorded final state',
      () {
        final decoded = jsonDecode(file.readAsStringSync());
        if (decoded is! Map) {
          fail('${file.path}: fixture must be a JSON object');
        }
        final fixture = decoded.cast<String, Object?>();

        final rulesetJson = fixture['ruleset'];
        final eventsJson = fixture['events'];
        final finalStateJson = fixture['final_state'];
        final subjectsJson = fixture['subjects'];
        if (rulesetJson is! String ||
            eventsJson is! List ||
            finalStateJson is! Map ||
            subjectsJson is! List) {
          fail(
            '${file.path}: fixture requires string ruleset, events list, '
            'final_state object, subjects list',
          );
        }

        final ruleset = LudoRuleset.byId[rulesetJson];
        if (ruleset == null) {
          fail('${file.path}: unknown ruleset $rulesetJson');
        }

        final subjects = subjectsJson.cast<String>();
        // Mirrors `LudoMatchState.initial`'s starting placement (yard vs.
        // pre-released token count varies by ruleset — see
        // `ludo_config.dart`'s `preReleasedTokensPerPlayer`), since a
        // fixture's recorded event log assumes the match began that way.
        final initialPlayers = [
          for (var seat = 0; seat < subjects.length; seat++)
            LudoPlayerState(
              seat: seat,
              subject: subjects[seat],
              color: LudoColor.values[seat],
              tokens: List.generate(ruleset.tokensPerPlayer, (id) {
                if (!ruleset.requiresYardExitRoll) return LudoToken.onTrack(id);
                return id < ruleset.preReleasedTokensPerPlayer
                    ? LudoToken.onTrack(id)
                    : LudoToken.inYard(id);
              }),
            ),
        ];

        final events = eventsJson
            .map(
              (e) =>
                  LudoReplayEvent.fromJson((e as Map).cast<String, Object?>()),
            )
            .toList();

        final replayed = replay(
          events,
          ruleset: ruleset,
          initialPlayers: initialPlayers,
        );

        expect(
          replayed.toJson(),
          finalStateJson,
          reason:
              '${file.path}: replay() did not reproduce the recorded '
              'final state',
        );
      },
    );
  }
}
