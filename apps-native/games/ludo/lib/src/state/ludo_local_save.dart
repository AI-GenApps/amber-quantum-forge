/// Durable local persistence for an in-progress local (Computer or Pass N
/// Play) match (task 11): the raw `ludo_rules` [LudoMatchState] plus the
/// originating [LudoLocalMatchConfig] (task 09) and per-seat
/// [LudoSeatIdentity] (task 09's setup, surfaced on the board via task 09's
/// `game_board_screen.dart`) it needs to resume directly onto
/// [GameBoardScreen] with the same chrome — not just the raw engine state.
/// Online matches (tasks 24-26) never use this: they resume from
/// server-authoritative state, not local storage.
///
/// Reuses `platform_core`'s [SaveStore]/[SaveEnvelope] mechanism — the same
/// local-persistence primitive `ludo_profile_settings.dart` (task 07) and
/// `ludo_settings_store.dart` (task 10) established for this app — under its
/// own [AppIdentity] (`ludo_local_match`) so this save never collides with
/// either of those on the same namespaced file.
library;

import 'package:ludo_rules/ludo_rules.dart';
import 'package:platform_core/platform_core.dart';

import '../screens/game_board_screen.dart' show LudoSeatIdentity;
import '../screens/mode_setup_sheet.dart'
    show LudoLocalMatchConfig, LudoSeatConfig;
import 'ludo_profile_settings.dart' show ludoDefaultSaveStore;

/// Schema version for [LudoLocalMatchSave.toJson] / `fromJson`.
const ludoLocalMatchSchemaVersion = 1;

/// The identity this save is namespaced under. Constructed directly (not via
/// `appIdentityFor`, which only resolves ids known to the generated game
/// registry) since this is a sub-namespace of the `ludo` app rather than a
/// registry entry of its own — matching `ludo_settings_store.dart`'s
/// `ludoSettingsIdentity` pattern.
final ludoLocalMatchIdentity = AppIdentity(
  stableId: 'ludo_local_match',
  canonicalName: 'Ludo Local Match',
  publicTitle: 'Ludo Local Match',
  subtitle: 'Ludo Local Match',
);

/// An in-progress local match: the engine state plus everything
/// [GameBoardScreen] needs to reconstruct its chrome (ruleset, seat colors,
/// bot difficulties, and each seat's display name/avatar).
final class LudoLocalMatchSave {
  const LudoLocalMatchSave({
    required this.state,
    required this.config,
    required this.seatIdentities,
  });

  final LudoMatchState state;
  final LudoLocalMatchConfig config;
  final List<LudoSeatIdentity> seatIdentities;

  Map<String, Object?> toJson() => {
    'state': state.toJson(),
    'config': _configToJson(config),
    'seat_identities': [
      for (final identity in seatIdentities) _identityToJson(identity),
    ],
  };

  static LudoLocalMatchSave fromJson(Map<String, Object?> json) {
    final stateJson = json['state'];
    final configJson = json['config'];
    final identitiesJson = json['seat_identities'];
    if (stateJson is! Map || configJson is! Map || identitiesJson is! List) {
      throw const FormatException('Invalid local match save');
    }
    return LudoLocalMatchSave(
      state: LudoMatchState.fromJson(stateJson.cast<String, Object?>()),
      config: _configFromJson(configJson.cast<String, Object?>()),
      seatIdentities: [
        for (final entry in identitiesJson)
          _identityFromJson((entry as Map).cast<String, Object?>()),
      ],
    );
  }
}

Map<String, Object?> _configToJson(LudoLocalMatchConfig config) => {
  'ruleset': config.ruleset.toJson(),
  'is_computer_match': config.isComputerMatch,
  'seats': [for (final seat in config.seats) _seatToJson(seat)],
};

LudoLocalMatchConfig _configFromJson(Map<String, Object?> json) {
  final rulesetJson = json['ruleset'];
  final isComputerMatch = json['is_computer_match'];
  final seatsJson = json['seats'];
  if (rulesetJson is! Map || isComputerMatch is! bool || seatsJson is! List) {
    throw const FormatException('Invalid local match config save');
  }
  return LudoLocalMatchConfig(
    ruleset: LudoRuleset.fromJson(rulesetJson.cast<String, Object?>()),
    isComputerMatch: isComputerMatch,
    seats: [
      for (final entry in seatsJson)
        _seatFromJson((entry as Map).cast<String, Object?>()),
    ],
  );
}

Map<String, Object?> _seatToJson(LudoSeatConfig seat) => {
  'color': seat.color.name,
  'is_bot': seat.isBot,
  'bot_difficulty': seat.botDifficulty,
};

LudoSeatConfig _seatFromJson(Map<String, Object?> json) {
  final colorName = json['color'];
  final isBot = json['is_bot'];
  final botDifficulty = json['bot_difficulty'];
  if (colorName is! String || isBot is! bool) {
    throw const FormatException('Invalid local match seat save');
  }
  return LudoSeatConfig(
    color: LudoColor.values.byName(colorName),
    isBot: isBot,
    botDifficulty: botDifficulty as String?,
  );
}

Map<String, Object?> _identityToJson(LudoSeatIdentity identity) => {
  'name': identity.name,
  'avatar_id': identity.avatarId,
};

LudoSeatIdentity _identityFromJson(Map<String, Object?> json) {
  final name = json['name'];
  final avatarId = json['avatar_id'];
  if (name is! String || avatarId is! String) {
    throw const FormatException('Invalid local match seat identity save');
  }
  return LudoSeatIdentity(name: name, avatarId: avatarId);
}

/// Loads/saves/clears the single in-progress local match slot through a
/// [SaveStore]. Only one in-progress local match is ever tracked at a time —
/// starting a new one overwrites the slot, and resuming-then-finishing (or
/// quitting-to-a-finish) clears it outright. There is no history of past
/// matches here.
class LudoLocalSave {
  LudoLocalSave({required this.saveStore, required this.appContext});

  final SaveStore saveStore;
  final AppContext appContext;

  /// Builds the production store: [ludoDefaultSaveStore] (the same
  /// file-backed root `ludo_profile_settings.dart`/`ludo_settings_store.dart`
  /// use, falling back to an in-memory store when `path_provider` is
  /// unavailable, e.g. under `flutter test`) namespaced under
  /// [ludoLocalMatchIdentity].
  static Future<LudoLocalSave> production() async {
    return LudoLocalSave(
      saveStore: await ludoDefaultSaveStore(),
      appContext: runtimeAppContext(identity: ludoLocalMatchIdentity),
    );
  }

  /// Loads the saved in-progress match, or `null` if nothing is saved, or if
  /// the saved envelope fails validation (corrupt/foreign save) or its
  /// payload fails to decode (e.g. an incompatible future schema). Either
  /// way resuming is simply unavailable rather than crashing the lobby.
  Future<LudoLocalMatchSave?> load() async {
    SaveEnvelope? envelope;
    try {
      envelope = await saveStore.read(appContext);
    } on SaveValidationException {
      envelope = null;
    }
    if (envelope == null) return null;
    try {
      return LudoLocalMatchSave.fromJson(envelope.payload);
    } on FormatException {
      return null;
    }
  }

  /// Persists [match] as the current in-progress local match, replacing any
  /// previous save.
  Future<void> save(
    LudoLocalMatchSave match, {
    DateTime Function() now = DateTime.now,
  }) async {
    final envelope = SaveEnvelope.create(
      context: appContext,
      schemaVersion: ludoLocalMatchSchemaVersion,
      savedAt: now(),
      payload: match.toJson(),
    );
    await saveStore.write(appContext, envelope);
  }

  /// Clears the saved slot (e.g. once a match finishes). A no-op if nothing
  /// was saved.
  Future<void> clear() async {
    await saveStore.delete(appContext);
  }
}
