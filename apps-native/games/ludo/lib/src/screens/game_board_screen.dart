/// The game board screen (task 09): composes task 05's `ludo_game.dart`
/// Flame widget with surrounding chrome — one [PlayerPanel] per seat, a
/// [DiceZone], and a menu button opening [PauseQuitDialog]. Driven by
/// local `ludo_rules` state; server/online wiring is tasks 24-26 and bot
/// move automation is task 12 — this screen only renders the bot-difficulty
/// choice made in [ModeSetupSheet], it never plays a bot's turn itself.
library;

import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart';
import 'package:platform_core/platform_core.dart' show DeterministicRng;

import '../game/ludo_game.dart';
import '../state/ludo_settings_store.dart';
import '../state/ludo_sound_settings.dart';
import '../state/reduced_motion_setting.dart';
import '../widgets/dice_zone.dart';
import '../widgets/player_panel.dart';
import 'mode_setup_sheet.dart';
import 'pause_quit_dialog.dart';
import 'results_screen.dart';

/// The turn-phase duration the timer ring counts down. Purely
/// presentational in this task; task 25 swaps in a server-provided
/// deadline without this screen changing its rendering logic.
const ludoTurnDuration = Duration(seconds: 30);

/// One seat's display identity (name/avatar), supplied by the caller so
/// this screen never has to guess a bot's name/avatar or reach into
/// onboarding state itself.
final class LudoSeatIdentity {
  const LudoSeatIdentity({required this.name, required this.avatarId});

  final String name;
  final String avatarId;
}

/// The game board screen. Always seat 0 is the local human player; every
/// other seat is either another local human (Pass N Play) or a bot
/// (Computer) per [config]'s [LudoSeatConfig.isBot] — this task renders
/// that distinction but does not automate a bot's turn (task 12).
class GameBoardScreen extends StatefulWidget {
  const GameBoardScreen({
    super.key,
    required this.config,
    required this.seatIdentities,
    required this.soundSettings,
    this.diceSeed,
    this.onQuit,
    this.reducedMotion,
    this.settingsStore,
  });

  /// The match configuration returned by [ModeSetupSheet].
  final LudoLocalMatchConfig config;

  /// Display identity per seat, in seat order; must be the same length as
  /// `config.seats`.
  final List<LudoSeatIdentity> seatIdentities;

  final LudoSoundSettings soundSettings;

  /// Test seam: seeds the dice source deterministically. Production uses a
  /// fresh time-based seed.
  final int? diceSeed;

  /// Invoked when Quit is confirmed in the pause dialog. Defaults to
  /// popping this screen (ending the local match with no penalty, per this
  /// task's Context/Decisions).
  final VoidCallback? onQuit;

  /// Test seam threaded down to the `LudoGame` (and, via [SettingsScreen],
  /// to whatever settings link the pause dialog offers): enabling it makes
  /// hop/flight/tumble animations resolve on the next microtask instead of
  /// over several real-duration frames, so tests never have to wait on a
  /// live game loop to go idle. `null` (the default) still leaves motion
  /// enabled in production, but this screen always allocates one concrete
  /// [ReducedMotionSetting] instance either way (see [_reducedMotion]) so
  /// toggling it from the settings screen reached through the pause dialog
  /// measurably affects *this* running match's components, not a
  /// throwaway instance.
  final ReducedMotionSetting? reducedMotion;

  /// Test seam: persists sound/reduced-motion toggles changed from the
  /// settings screen reached through the pause dialog. `null` (the
  /// default) disables persistence.
  final LudoSettingsStore? settingsStore;

  @override
  State<GameBoardScreen> createState() => _GameBoardScreenState();
}

class _GameBoardScreenState extends State<GameBoardScreen> {
  late LudoGame _game;
  late LudoMatchState _state;
  late DeterministicRng _rng;
  late ReducedMotionSetting _reducedMotion;
  DateTime? _turnDeadline;

  @override
  void initState() {
    super.initState();
    assert(widget.seatIdentities.length == widget.config.seats.length);
    _rng = DeterministicRng(
      widget.diceSeed ?? DateTime.now().millisecondsSinceEpoch,
    );
    _reducedMotion = widget.reducedMotion ?? ReducedMotionSetting();
    _state = LudoMatchState.initial(
      ruleset: widget.config.ruleset,
      subjects: [
        for (var i = 0; i < widget.config.seats.length; i++)
          widget.config.seats[i].isBot ? 'bot-$i' : 'local-$i',
      ],
    );
    _game = LudoGame(initialState: _state, reducedMotion: _reducedMotion)
      ..onTokenTap = _handleTokenTap;
    _armDeadlineForCurrentTurn();
  }

  void _armDeadlineForCurrentTurn() {
    _turnDeadline = DateTime.now().add(ludoTurnDuration);
  }

  /// Whether it's the local human seat's (seat 0) turn to roll right now.
  bool get _canRoll =>
      _state.phase == LudoMatchPhase.awaitingRoll &&
      _state.currentPlayerIndex == 0 &&
      !widget.config.seats[0].isBot;

  /// Whether it's the local human seat's turn to move a legal token.
  bool get _canMove =>
      _state.phase == LudoMatchPhase.awaitingMove &&
      _state.currentPlayerIndex == 0 &&
      !widget.config.seats[0].isBot;

  Future<void> _rollDice() async {
    if (!_canRoll) return;
    final result = rollDice(
      _state,
      FunctionDiceSource(() => _rng.nextInt(6) + 1),
    );
    setState(() {
      _state = result.state;
      _armDeadlineForCurrentTurn();
    });
    await _game.applyEvents(result.events, result.state);
    _maybeNavigateToResults();
  }

  Future<void> _handleTokenTap(LudoColor color, int tokenId) async {
    if (!_canMove) return;
    final localColor = _state.players[0].color;
    if (color != localColor) return;
    if (!legalMoves(_state).contains(tokenId)) return;
    final result = applyMove(_state, tokenId);
    setState(() {
      _state = result.state;
      _armDeadlineForCurrentTurn();
    });
    await _game.applyEvents(result.events, result.state);
    _maybeNavigateToResults();
  }

  /// Pushes [ResultsScreen], replacing this screen, once [_state] reaches
  /// [LudoMatchPhase.finished]. A no-op otherwise.
  void _maybeNavigateToResults() {
    if (_state.phase != LudoMatchPhase.finished) return;
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => ResultsScreen(
          state: _state,
          config: widget.config,
          seatIdentities: widget.seatIdentities,
          soundSettings: widget.soundSettings,
          reducedMotion: _reducedMotion,
          onQuit: widget.onQuit,
        ),
      ),
    );
  }

  void _openPauseDialog() {
    showPauseQuitDialog(
      context,
      soundSettings: widget.soundSettings,
      reducedMotion: _reducedMotion,
      settingsStore: widget.settingsStore,
      onQuit: widget.onQuit ?? () => Navigator.of(context).maybePop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ludo'),
        actions: [
          IconButton(
            key: const Key('game-board-menu-button'),
            icon: const Icon(Icons.pause_circle_outline),
            tooltip: 'Pause',
            onPressed: _openPauseDialog,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            _PlayerPanelRow(
              config: widget.config,
              identities: widget.seatIdentities,
              state: _state,
              turnDeadline: _turnDeadline,
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: GameWidget(game: _game),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: DiceZone(
                enabled: _canRoll,
                lastRoll: _state.currentRoll,
                onRoll: _rollDice,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PlayerPanelRow extends StatelessWidget {
  const _PlayerPanelRow({
    required this.config,
    required this.identities,
    required this.state,
    required this.turnDeadline,
  });

  final LudoLocalMatchConfig config;
  final List<LudoSeatIdentity> identities;
  final LudoMatchState state;
  final DateTime? turnDeadline;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (var seat = 0; seat < config.seats.length; seat++)
            PlayerPanel(
              key: ValueKey('player-panel-$seat'),
              name: identities[seat].name,
              avatarId: identities[seat].avatarId,
              color: config.seats[seat].color,
              isActive:
                  state.phase != LudoMatchPhase.finished &&
                  state.currentPlayerIndex == seat,
              deadline: state.currentPlayerIndex == seat ? turnDeadline : null,
              turnDuration: ludoTurnDuration,
            ),
        ],
      ),
    );
  }
}
