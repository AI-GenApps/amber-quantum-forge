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
/// parity with task 17's TS port.
const ludoRulesVersion = 'LUDO-1';

/// A named, frozen set of numeric rules for a Ludo match.
///
/// [LudoRuleset.classic] implements the product-decided Classic Ludo King
/// rules (see task 01's Context/Decisions section in
/// `tasks/epics/15-ludo-launch/01-rules-core.md`).
///
/// [LudoRuleset.quick] encodes this package's own definition of "Quick
/// mode", since no existing reference in this repo documents it precisely
/// (the Unity fixture only encodes a Classic-shaped board with blockades,
/// which this epic excludes, and the Ludo King reference notes only name an
/// unexplained "Rush Mode" / an unrelated "Quick Ludo" tutorial video).
/// From public knowledge of Ludo King's Quick Mode:
///
/// - Tokens start **pre-placed on the shared track**
///   (`requiresYardExitRoll = false`) instead of in the yard, so play
///   begins immediately without needing to roll a 6 to enter.
/// - The match is shortened by roughly halving the number of common-track
///   squares a token must travel before turning into its home column
///   (`stepsToHomeEntry = 25` vs Classic's `51`), so a Quick match finishes
///   in roughly half as many token-moves as Classic. The home stretch
///   itself (`homeLength = 6`) and the shared board geometry (52 physical
///   squares, same safe-cell layout) are unchanged, since Quick mode is a
///   shorter race on the same board, not a different board.
///
/// Both numbers are named constants below (not a hardcoded branch in the
/// engine) so this product decision is visible in one place and can be
/// revisited without touching `ludo_engine.dart`.
final class LudoRuleset {
  const LudoRuleset({
    required this.id,
    required this.tokensPerPlayer,
    required this.stepsToHomeEntry,
    required this.homeLength,
    required this.requiresYardExitRoll,
    this.rulesVersion = ludoRulesVersion,
    this.schemaVersion = ludoConfigSchemaVersion,
  }) : assert(tokensPerPlayer > 0, 'tokensPerPlayer must be positive'),
       assert(stepsToHomeEntry > 0, 'stepsToHomeEntry must be positive'),
       assert(homeLength > 0, 'homeLength must be positive');

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
  );

  /// Quick mode. See this class's doc comment for the rationale behind
  /// these numbers.
  static const quick = LudoRuleset(
    id: 'quick',
    tokensPerPlayer: 4,
    stepsToHomeEntry: 25,
    homeLength: 6,
    requiresYardExitRoll: false,
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

  /// Whether a token must roll a 6 to leave the yard and enter play. When
  /// `false`, every token starts already on the shared track (path
  /// position 0) and there is no yard state at all.
  final bool requiresYardExitRoll;
  final String rulesVersion;
  final int schemaVersion;

  /// Total path distance (in single-square steps) a token travels from
  /// entering play (path position `0`) to being finished (path position
  /// `== pathLength`).
  int get pathLength => stepsToHomeEntry + homeLength;

  Map<String, Object> toJson() => {
    'id': id,
    'tokens_per_player': tokensPerPlayer,
    'steps_to_home_entry': stepsToHomeEntry,
    'home_length': homeLength,
    'requires_yard_exit_roll': requiresYardExitRoll,
    'rules_version': rulesVersion,
    'schema_version': schemaVersion,
  };

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
