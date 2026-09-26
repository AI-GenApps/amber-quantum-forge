/// The `ludo` telemetry namespace (task 12): wraps `platform_core`'s
/// [TelemetryRecorder] with every LOCAL event this epic's client emits.
/// Task 26 extends this same file with ONLINE events (`ludo_room_created`,
/// `ludo_matchmaking_started`, etc.) — this file is the single home for
/// all Ludo telemetry, matching how `merge_relay`/`sixty_second_heist`/
/// `pocket_biome` each centralize their own event emission behind one
/// `telemetry`-shaped accessor rather than calling `TelemetryRecorder`
/// directly from screens.
///
/// `platform_core`'s [sanitizeFields] only forwards a fixed, shared
/// allow-list of field keys (`action`, `details`, `reason`, `rule_version`,
/// `score`, `ticks`, `status`, ...) used identically by every game in this
/// workspace — the same convention `merge_relay`'s telemetry call sites
/// follow (e.g. `action` for a mode/variant name, `rule_version` for a
/// ruleset id, `ticks` for a duration). Every field below is deliberately
/// chosen from that allow-list; a field name that is not on it is silently
/// dropped rather than rejected, so this file never invents new keys.
library;

import 'package:platform_core/platform_core.dart';

import '../app.dart' show ludoIdentity;

/// Which mode a match was started/finished in. `vsComputer`/`passAndPlay`
/// are local (task 12); `online`/`room` are the online-mode variants task
/// 26 adds, fired from the matchmaking-search and room flows respectively
/// once either lands on the board.
enum LudoMatchVariant {
  vsComputer,
  passAndPlay,
  online,
  room;

  String get telemetryAction => switch (this) {
    LudoMatchVariant.vsComputer => 'vs_computer',
    LudoMatchVariant.passAndPlay => 'pass_and_play',
    LudoMatchVariant.online => 'online',
    LudoMatchVariant.room => 'room',
  };
}

/// Wraps a `platform_core` [TelemetryRecorder] with typed methods for every
/// Ludo LOCAL event. Construct one instance per screen/session (production
/// call sites pass no arguments — this app has no telemetry upload
/// pipeline yet, so, matching every other game in this workspace, events
/// simply accumulate in an in-memory [sink] rather than call sites needing
/// an async production resolver); tests construct one with an explicit
/// [sink] (and often a [clock]) and assert on that same instance.
final class LudoTelemetry {
  LudoTelemetry({AppContext? context, Clock? clock, TelemetrySink? sink})
    : context = context ?? runtimeAppContext(identity: ludoIdentity),
      clock = clock ?? const SystemClock(),
      sink = sink ?? MemoryTelemetrySink();

  final AppContext context;
  final Clock clock;
  final TelemetrySink sink;

  TelemetryRecorder get _recorder =>
      TelemetryRecorder(context: context, clock: clock, sink: sink);

  /// Onboarding was completed by reaching the end of the tutorial (task
  /// 07). Fired once, from `onboarding_tutorial_screen.dart`.
  void onboardingCompleted() {
    _recorder.record('ludo_onboarding_completed');
  }

  /// Onboarding was skipped from the welcome screen, the profile screen,
  /// or the tutorial's own Skip action (task 07) — any of the three counts
  /// as "skipped" rather than "completed".
  void onboardingSkipped() {
    _recorder.record('ludo_onboarding_skipped');
  }

  /// A local match (vs Computer or Pass N Play) started. Fired from
  /// `home_lobby_screen.dart`'s `startLudoLocalMatch`, once
  /// `ModeSetupSheet` returns a config — never fired for a *resumed*
  /// match, since that match already started earlier.
  void matchStarted({
    required LudoMatchVariant variant,
    required String ruleset,
    required int seatCount,
  }) {
    _recorder.record(
      'ludo_match_started',
      fields: {
        'action': variant.telemetryAction,
        'rule_version': ruleset,
        'score': seatCount,
      },
    );
  }

  /// A local match reached [LudoMatchPhase.finished]. Fired from
  /// `game_board_screen.dart` right before navigating to
  /// `ResultsScreen`.
  void matchFinished({
    required LudoMatchVariant variant,
    required String ruleset,
    required int winnerSeat,
    required Duration duration,
  }) {
    _recorder.record(
      'ludo_match_finished',
      fields: {
        'action': variant.telemetryAction,
        'rule_version': ruleset,
        'score': winnerSeat,
        'ticks': duration.inSeconds,
      },
    );
  }

  /// A local human seat's turn deadline elapsed. Fired from
  /// `game_board_screen.dart`'s turn-deadline timer; informational only —
  /// no local auto-pass action follows from it (turn-timeout enforcement
  /// is server-authoritative, task 19).
  void turnTimedOut({required int seatIndex}) {
    _recorder.record(
      'ludo_turn_timed_out',
      fields: {'reason': 'timeout', 'score': seatIndex},
    );
  }

  /// A settings toggle changed, from either the pause dialog or the
  /// settings screen (task 10) — [toggle] is one of `sound`, `music`,
  /// `vibration`, `reduced_motion`.
  void settingsChanged({required String toggle}) {
    _recorder.record('ludo_settings_changed', fields: {'action': toggle});
  }

  // ---------------------------------------------------------------------
  // ONLINE events (task 26). No field here ever carries a room code, ticket
  // id, match id, or display name — only the shared allow-list's
  // rule_version/score/ticks/status, matching every LOCAL event above.
  // ---------------------------------------------------------------------

  /// A private room was created from the "Play with Friends" flow, fired
  /// once the create-room gateway call succeeds.
  void roomCreated({required String mode, required int seatTarget}) {
    _recorder.record(
      'ludo_room_created',
      fields: {'rule_version': mode, 'score': seatTarget},
    );
  }

  /// This device joined another player's room by code, fired once the
  /// join-room gateway call succeeds.
  void roomJoined({required String mode, required int seatTarget}) {
    _recorder.record(
      'ludo_room_joined',
      fields: {'rule_version': mode, 'score': seatTarget},
    );
  }

  /// A random-matchmaking ticket was submitted, fired once the
  /// create-ticket gateway call succeeds.
  void matchmakingStarted({required String mode, required int seatTarget}) {
    _recorder.record(
      'ludo_matchmaking_started',
      fields: {'rule_version': mode, 'score': seatTarget},
    );
  }

  /// A matchmaking search resolved to a match (human-filled or bot-filled),
  /// fired once the search poll observes the ticket's `matched` status.
  void matchmakingMatched({
    required String mode,
    required int seatCount,
    required Duration searchDuration,
  }) {
    _recorder.record(
      'ludo_matchmaking_matched',
      fields: {
        'rule_version': mode,
        'score': seatCount,
        'ticks': searchDuration.inSeconds,
      },
    );
  }

  /// A matchmaking search's match came back with one or more bot-filled
  /// seats, fired alongside [matchmakingMatched] when at least one seat's
  /// subject carries the server's `bot:` prefix.
  void botFillTriggered({required String mode, required int botCount}) {
    _recorder.record(
      'ludo_bot_fill_triggered',
      fields: {'rule_version': mode, 'score': botCount},
    );
  }
}
