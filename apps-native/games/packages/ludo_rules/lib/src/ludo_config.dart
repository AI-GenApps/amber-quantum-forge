/// Frozen rules configuration for the ludo_rules engine.
///
/// The physical board geometry (52 shared track squares, safe-cell layout)
/// is shared by every ruleset and lives in `ludo_board.dart`. This file
/// holds the *numeric* rules that vary between Classic and Quick mode.
library;

/// Schema version for [LudoRuleset.toJson] / [LudoRuleset.fromJson].
const ludoConfigSchemaVersion = 1;

/// Version tag for the rules implemented by this package. Bump this when
/// engine behavior changes in a way that would break cross-runtime replay
/// parity with task 17's TS port. Bumped to `LUDO-2` by task 12g, which
/// corrected Quick mode's replay semantics (see [LudoRuleset.quick]).
const ludoRulesVersion = 'LUDO-2';

/// How a match decides its winner. See [LudoRuleset.winCondition].
enum LudoWinCondition {
  /// Classic: the winner is the first player whose tokens are all
  /// [LudoTokenState.finished] (`LudoPlayerState.allFinished`).
  allTokensHome,

  /// Quick: the winner is the first player for whom both "has at least one
  /// finished token" and "has captured at least one opponent token during
  /// the match" become true, evaluated the instant either condition is
  /// newly satisfied (see `ludo_engine.dart`'s `applyMove`), not deferred
  /// to end-of-turn or to `allFinished`.
  oneHomeAndOneCapture,
}

/// A named, frozen set of numeric rules for a Ludo match.
///
/// [LudoRuleset.classic] implements the product-decided Classic Ludo King
/// rules (see task 01's Context/Decisions section in
/// `tasks/epics/15-ludo-launch/01-rules-core.md`).
///
/// [LudoRuleset.quick] implements Ludo King's actual official Quick Mode,
/// per the product decision recorded in task 12g's Context/Decisions
/// (`tasks/epics/15-ludo-launch/12g-quick-mode-alignment.md`), sourced from
/// Gametion's own blog post "Ludo King rolls out Quick Mode and 6 Player
/// Online Multiplayer updates" (see
/// `.agents/resources/2026-09-25/ludo-king-points/README.md`). Task 01's
/// original Quick config (a shortened `stepsToHomeEntry = 25` track with no
/// yard state at all) was an unverified guess and has been replaced:
///
/// - Quick uses the **same full-length track** as Classic
///   (`stepsToHomeEntry = 51`) — it is not a shorter race.
/// - Each player starts with [preReleasedTokensPerPlayer] of their tokens
///   already released onto their start square; the rest begin in the yard
///   exactly like Classic, and still require rolling a 6 to leave it
///   (`requiresYardExitRoll` stays `true`).
/// - The win condition is objective-based, not "all tokens home": see
///   [LudoWinCondition.oneHomeAndOneCapture].
///
/// All of these are named fields below (not a hardcoded `if (ruleset.id ==
/// 'quick')` branch in the engine) so this product decision is visible in
/// one place and can be revisited without touching `ludo_engine.dart`.
final class LudoRuleset {
  const LudoRuleset({
    required this.id,
    required this.tokensPerPlayer,
    required this.stepsToHomeEntry,
    required this.homeLength,
    required this.requiresYardExitRoll,
    required this.preReleasedTokensPerPlayer,
    required this.winCondition,
    required this.rulesVersion,
    this.schemaVersion = ludoConfigSchemaVersion,
  }) : assert(tokensPerPlayer > 0, 'tokensPerPlayer must be positive'),
       assert(stepsToHomeEntry > 0, 'stepsToHomeEntry must be positive'),
       assert(homeLength > 0, 'homeLength must be positive'),
       assert(
         preReleasedTokensPerPlayer >= 0 &&
             preReleasedTokensPerPlayer <= tokensPerPlayer,
         'preReleasedTokensPerPlayer must be between 0 and tokensPerPlayer',
       );

  /// Classic Ludo King rules: 4 tokens per player, must roll a 6 to leave
  /// the yard, and travel the full 51-square common-track arc (relative
  /// path positions 0..50, i.e. once around the 52-square shared track
  /// minus the token's own start square) before the 6-square home stretch.
  static const classic = LudoRuleset(
    id: 'classic',
    tokensPerPlayer: 4,
    stepsToHomeEntry: 51,
    homeLength: 6,
    requiresYardExitRoll: true,
    preReleasedTokensPerPlayer: 0,
    winCondition: LudoWinCondition.allTokensHome,
    // Classic's own replay semantics did not change in task 12g (only
    // Quick's did), and task 12g's Out-of-Scope constraint requires
    // Classic's committed fixtures to stay byte-identical. Keeping
    // Classic pinned at the pre-12g version (rather than sharing the
    // bumped [ludoRulesVersion]) — combined with [LudoRuleset.toJson]
    // and [LudoPlayerState.toJson] omitting the new Quick-only fields for
    // rulesets shaped like Classic's defaults — keeps Classic's fixture
    // schema frozen. Do not change this without re-checking that
    // constraint.
    rulesVersion: 'LUDO-1',
  );

  /// Quick mode. See this class's doc comment for the rationale behind
  /// these values.
  static const quick = LudoRuleset(
    id: 'quick',
    tokensPerPlayer: 4,
    stepsToHomeEntry: 51,
    homeLength: 6,
    requiresYardExitRoll: true,
    preReleasedTokensPerPlayer: 2,
    winCondition: LudoWinCondition.oneHomeAndOneCapture,
    rulesVersion: ludoRulesVersion,
  );

  /// All rulesets known to this package, keyed by [id].
  static const byId = {'classic': classic, 'quick': quick};

  final String id;
  final int tokensPerPlayer;

  /// Number of shared-track squares a token travels (relative to its own
  /// start square) before turning into its private home stretch.
  final int stepsToHomeEntry;

  /// Number of squares in the private home stretch, after leaving the
  /// shared track and before reaching the finished state.
  final int homeLength;

  /// Whether a token must roll a 6 to leave the yard and enter play. Quick
  /// still requires this — only its *starting placement* differs from
  /// Classic (see [preReleasedTokensPerPlayer]); a token sent back to the
  /// yard by a capture needs a 6 to re-enter in both rulesets.
  final bool requiresYardExitRoll;

  /// How many of each player's tokens (token ids `0..preReleasedTokensPerPlayer
  /// - 1`) start the match already placed on their start square (path
  /// position `0`) instead of in the yard. `0` for Classic; `2` for Quick.
  final int preReleasedTokensPerPlayer;

  /// How this ruleset decides its winner. See [LudoWinCondition].
  final LudoWinCondition winCondition;
  final String rulesVersion;
  final int schemaVersion;

  /// Total path distance (in single-square steps) a token travels from
  /// entering play (path position `0`) to being finished (path position
  /// `== pathLength`).
  int get pathLength => stepsToHomeEntry + homeLength;

  /// `pre_released_tokens_per_player` and `win_condition` are only
  /// serialized when they differ from Classic's pre-12g implicit values
  /// (`0` pre-released tokens, [LudoWinCondition.allTokensHome]). This
  /// keeps Classic's fixture/schema output byte-identical to what was
  /// committed before task 12g added these fields for Quick, per that
  /// task's Out-of-Scope constraint — Classic's own config/behavior did
  /// not change, so its serialized shape must not either. `fromJson`
  /// doesn't need these keys (it looks the ruleset up by `id`), so
  /// omitting them is safe for round-tripping.
  Map<String, Object> toJson() {
    final json = <String, Object>{
      'id': id,
      'tokens_per_player': tokensPerPlayer,
      'steps_to_home_entry': stepsToHomeEntry,
      'home_length': homeLength,
      'requires_yard_exit_roll': requiresYardExitRoll,
    };
    if (preReleasedTokensPerPlayer != 0) {
      json['pre_released_tokens_per_player'] = preReleasedTokensPerPlayer;
    }
    if (winCondition != LudoWinCondition.allTokensHome) {
      json['win_condition'] = winCondition.name;
    }
    json['rules_version'] = rulesVersion;
    json['schema_version'] = schemaVersion;
    return json;
  }

  /// Rebuilds a ruleset from JSON. Only the frozen [classic] / [quick]
  /// constants are recognized by [id]; custom rulesets are intentionally
  /// not supported, so fixtures and replay logs always refer to one of the
  /// two product-decided rulesets.
  static LudoRuleset fromJson(Map<String, Object?> json) {
    final id = json['id'];
    final ruleset = byId[id];
    if (ruleset == null) {
      throw FormatException('Unknown ludo ruleset id: $id');
    }
    return ruleset;
  }

  @override
  String toString() => 'LudoRuleset($id)';
}
