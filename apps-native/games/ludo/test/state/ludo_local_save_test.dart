import 'package:flutter_test/flutter_test.dart';
import 'package:ludo_rules/ludo_rules.dart';
import 'package:platform_core/platform_core.dart';

import 'package:ludo/src/screens/game_board_screen.dart' show LudoSeatIdentity;
import 'package:ludo/src/screens/mode_setup_sheet.dart';
import 'package:ludo/src/state/ludo_local_save.dart';

LudoLocalSave _newSave() => LudoLocalSave(
  saveStore: MemorySaveStore(),
  appContext: runtimeAppContext(identity: ludoLocalMatchIdentity),
);

const _config = LudoLocalMatchConfig(
  ruleset: LudoRuleset.quick,
  isComputerMatch: true,
  seats: [
    LudoSeatConfig(color: LudoColor.red, isBot: false),
    LudoSeatConfig(color: LudoColor.green, isBot: true, botDifficulty: 'hard'),
  ],
);

const _identities = [
  LudoSeatIdentity(name: 'You', avatarId: 'red-face'),
  LudoSeatIdentity(name: 'Bot', avatarId: 'green-face'),
];

/// A mid-match state (seat 0 has rolled a 4, one legal move pending) reached
/// by driving the real engine, so this exercises the actual shape
/// `game_board_screen.dart` persists rather than a hand-built stand-in.
LudoMatchState _midMatchState() {
  final initial = LudoMatchState.initial(
    ruleset: _config.ruleset,
    subjects: const ['local-0', 'bot-1'],
  );
  final result = rollDice(initial, FunctionDiceSource(() => 4));
  return result.state;
}

/// A finished match: every one of seat 0's tokens has reached the end of the
/// path, with seat 1 recorded as the sole remaining (auto-last) player.
LudoMatchState _finishedState() {
  final ruleset = _config.ruleset;
  LudoToken finishedToken(int id) =>
      LudoToken(id: id, pathPosition: ruleset.pathLength);
  return LudoMatchState(
    ruleset: ruleset,
    players: [
      LudoPlayerState(
        seat: 0,
        subject: 'local-0',
        color: LudoColor.red,
        tokens: List.generate(ruleset.tokensPerPlayer, finishedToken),
      ),
      LudoPlayerState(
        seat: 1,
        subject: 'bot-1',
        color: LudoColor.green,
        tokens: List.generate(ruleset.tokensPerPlayer, finishedToken),
      ),
    ],
    currentPlayerIndex: 1,
    phase: LudoMatchPhase.finished,
    winnerOrder: const [0],
  );
}

void main() {
  test(
    'save-then-load round-trips a match state and its config exactly',
    () async {
      final save = _newSave();
      final match = LudoLocalMatchSave(
        state: _midMatchState(),
        config: _config,
        seatIdentities: _identities,
      );

      await save.save(match);
      final loaded = await save.load();

      expect(loaded, isNotNull);
      expect(loaded!.state.toJson(), match.state.toJson());
      expect(loaded.config.ruleset.id, _config.ruleset.id);
      expect(loaded.config.isComputerMatch, _config.isComputerMatch);
      expect(loaded.config.seats.length, _config.seats.length);
      for (var i = 0; i < _config.seats.length; i++) {
        expect(loaded.config.seats[i].color, _config.seats[i].color);
        expect(loaded.config.seats[i].isBot, _config.seats[i].isBot);
        expect(
          loaded.config.seats[i].botDifficulty,
          _config.seats[i].botDifficulty,
        );
      }
      expect(loaded.seatIdentities.length, _identities.length);
      for (var i = 0; i < _identities.length; i++) {
        expect(loaded.seatIdentities[i].name, _identities[i].name);
        expect(loaded.seatIdentities[i].avatarId, _identities[i].avatarId);
      }
    },
  );

  test('a finished match is cleared, not saved', () async {
    final save = _newSave();
    final finished = LudoLocalMatchSave(
      state: _finishedState(),
      config: _config,
      seatIdentities: _identities,
    );

    // Simulate a caller writing a finished state then clearing it (this is
    // `game_board_screen.dart`'s own contract: it never writes a finished
    // state, it clears instead — but this proves clear() actually removes
    // whatever was there).
    await save.save(finished);
    await save.clear();

    expect(await save.load(), isNull);
  });

  test('loading with no saved state returns null cleanly', () async {
    final save = _newSave();
    expect(await save.load(), isNull);
  });

  test('clearing an already-empty slot is a no-op, not an error', () async {
    final save = _newSave();
    await save.clear();
    expect(await save.load(), isNull);
  });

  test(
    'a save from a different app context is rejected, not returned',
    () async {
      final saveStore = MemorySaveStore();
      final foreignSave = LudoLocalSave(
        saveStore: saveStore,
        appContext: runtimeAppContext(
          identity: AppIdentity(
            stableId: 'ludo_settings',
            canonicalName: 'Ludo Settings',
            publicTitle: 'Ludo Settings',
            subtitle: 'Ludo Settings',
          ),
        ),
      );
      await foreignSave.save(
        LudoLocalMatchSave(
          state: _midMatchState(),
          config: _config,
          seatIdentities: _identities,
        ),
      );

      final matchSave = LudoLocalSave(
        saveStore: saveStore,
        appContext: runtimeAppContext(identity: ludoLocalMatchIdentity),
      );
      expect(await matchSave.load(), isNull);
    },
  );
}
