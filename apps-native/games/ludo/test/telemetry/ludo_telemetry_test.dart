import 'package:flutter_test/flutter_test.dart';
import 'package:platform_core/platform_core.dart';

import 'package:ludo/src/app.dart' show ludoIdentity;
import 'package:ludo/src/telemetry/ludo_telemetry.dart';

AppContext _context() => AppContext(
  identity: ludoIdentity,
  environment: AppEnvironment.debug,
  appVersion: '0.1.0',
  sessionId: 'test-session',
);

LudoTelemetry _telemetry(MemoryTelemetrySink sink) => LudoTelemetry(
  context: _context(),
  clock: FixedClock(DateTime.utc(2026, 1, 1, 12)),
  sink: sink,
);

void main() {
  test(
    'onboardingCompleted records ludo_onboarding_completed with no fields',
    () {
      final sink = MemoryTelemetrySink();
      _telemetry(sink).onboardingCompleted();

      expect(sink.events, hasLength(1));
      expect(sink.events.single.name, 'ludo_onboarding_completed');
      expect(sink.events.single.fields, isEmpty);
    },
  );

  test('onboardingSkipped records ludo_onboarding_skipped with no fields', () {
    final sink = MemoryTelemetrySink();
    _telemetry(sink).onboardingSkipped();

    expect(sink.events, hasLength(1));
    expect(sink.events.single.name, 'ludo_onboarding_skipped');
    expect(sink.events.single.fields, isEmpty);
  });

  test(
    'matchStarted records ludo_match_started with variant/ruleset/seatCount',
    () {
      final sink = MemoryTelemetrySink();
      _telemetry(sink).matchStarted(
        variant: LudoMatchVariant.vsComputer,
        ruleset: 'quick',
        seatCount: 2,
      );

      expect(sink.events, hasLength(1));
      final event = sink.events.single;
      expect(event.name, 'ludo_match_started');
      expect(event.fields['action'], 'vs_computer');
      expect(event.fields['rule_version'], 'quick');
      expect(event.fields['score'], 2);
    },
  );

  test(
    'matchStarted records the pass_and_play variant for a Pass N Play match',
    () {
      final sink = MemoryTelemetrySink();
      _telemetry(sink).matchStarted(
        variant: LudoMatchVariant.passAndPlay,
        ruleset: 'classic',
        seatCount: 4,
      );

      expect(sink.events.single.fields['action'], 'pass_and_play');
    },
  );

  test(
    'matchFinished records ludo_match_finished with winner/ruleset/duration',
    () {
      final sink = MemoryTelemetrySink();
      _telemetry(sink).matchFinished(
        variant: LudoMatchVariant.vsComputer,
        ruleset: 'quick',
        winnerSeat: 0,
        duration: const Duration(minutes: 4, seconds: 30),
      );

      expect(sink.events, hasLength(1));
      final event = sink.events.single;
      expect(event.name, 'ludo_match_finished');
      expect(event.fields['action'], 'vs_computer');
      expect(event.fields['rule_version'], 'quick');
      expect(event.fields['score'], 0);
      expect(event.fields['ticks'], 270);
    },
  );

  test('turnTimedOut records ludo_turn_timed_out with the seat index', () {
    final sink = MemoryTelemetrySink();
    _telemetry(sink).turnTimedOut(seatIndex: 2);

    expect(sink.events, hasLength(1));
    final event = sink.events.single;
    expect(event.name, 'ludo_turn_timed_out');
    expect(event.fields['reason'], 'timeout');
    expect(event.fields['score'], 2);
  });

  test(
    'settingsChanged records ludo_settings_changed with the toggle name',
    () {
      final sink = MemoryTelemetrySink();
      _telemetry(sink).settingsChanged(toggle: 'sound');

      expect(sink.events, hasLength(1));
      final event = sink.events.single;
      expect(event.name, 'ludo_settings_changed');
      expect(event.fields['action'], 'sound');
    },
  );

  test('no LOCAL event field carries PII beyond the shared allow-list', () {
    final sink = MemoryTelemetrySink();
    final telemetry = _telemetry(sink);

    telemetry.onboardingCompleted();
    telemetry.onboardingSkipped();
    telemetry.matchStarted(
      variant: LudoMatchVariant.vsComputer,
      ruleset: 'quick',
      seatCount: 2,
    );
    telemetry.matchFinished(
      variant: LudoMatchVariant.passAndPlay,
      ruleset: 'classic',
      winnerSeat: 1,
      duration: const Duration(seconds: 90),
    );
    telemetry.turnTimedOut(seatIndex: 0);
    telemetry.settingsChanged(toggle: 'music');

    const allowedKeys = {
      'accepted',
      'action',
      'album_count',
      'caption',
      'details',
      'direction',
      'level_id',
      'loot_collected',
      'move_count',
      'reason',
      'rng_draws',
      'rule_version',
      'score',
      'score_delta',
      'species_id',
      'status',
      'ticks',
      'tool',
    };
    for (final event in sink.events) {
      expect(event.fields.keys, everyElement(isIn(allowedKeys)));
    }
  });
}
