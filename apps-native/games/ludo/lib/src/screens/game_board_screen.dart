/// The game board screen (task 09, restyled by task 12d, board/layout
/// fidelity by task 12d2): composes task 05's `ludo_game.dart` Flame
/// widget with surrounding chrome — one [PlayerCornerCard] per occupied
/// board corner (the active seat's card also hosts its `DiceZone` roll
/// control), the [LudoBackground] painter as the screen's base layer, and
/// a small corner pause/menu icon button opening [PauseQuitDialog] (no
/// full-width title bar). Driven by local `ludo_rules` state;
/// server/online wiring is tasks 24-26 and bot move automation is task 12
/// — this screen only renders the bot-difficulty choice made in
/// [ModeSetupSheet], it never plays a bot's turn itself.
library;

import 'dart:async';

import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart';
import 'package:platform_core/platform_core.dart' show DeterministicRng;

import '../game/ludo_bot_turn_runner.dart';
import '../game/ludo_game.dart';
import '../state/ludo_local_save.dart';
import '../state/ludo_settings_store.dart';
import '../state/ludo_sound_settings.dart';
import '../state/reduced_motion_setting.dart';
import '../telemetry/ludo_telemetry.dart';
import '../theme/ludo_background_painter.dart';
import '../theme/ludo_theme_tokens.dart';
import '../widgets/ludo_3d_button.dart';
import '../widgets/player_corner_card.dart';
import 'mode_setup_sheet.dart';
import 'pass_and_play_interstitial.dart';
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
    this.initialState,
    this.localSave,
    this.telemetry,
    this.botTurnDelay = const Duration(milliseconds: 700),
  });

  /// The match configuration returned by [ModeSetupSheet].
  final LudoLocalMatchConfig config;

  /// Display identity per seat, in seat order; must be the same length as
  /// `config.seats`.
  final List<LudoSeatIdentity> seatIdentities;

  final LudoSoundSettings soundSettings;

  /// A previously-saved engine state to resume onto this board instead of
  /// starting a fresh match (task 11's resume flow, populated from
  /// `ludo_local_save.dart`). `null` (the default) starts a fresh match via
  /// `LudoMatchState.initial`, as before this task.
  final LudoMatchState? initialState;

  /// Test seam: the save this screen persists the running match to after
  /// every applied move, and clears once the match finishes. `null` (the
  /// default) resolves the production save (`LudoLocalSave.production`)
  /// lazily, so callers never need to wire it explicitly.
  final LudoLocalSave? localSave;

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

  /// Test seam: the telemetry sink `ludo_match_finished`/
  /// `ludo_turn_timed_out` record through. `null` (the default) resolves a
  /// fresh production [LudoTelemetry].
  final LudoTelemetry? telemetry;

  /// How long the bot-turn runner (task 12) pauses between each automated
  /// roll/move so the board animation is perceptible. Tests pass
  /// [Duration.zero] so a full bot sequence resolves without a real wait.
  final Duration botTurnDelay;

  @override
  State<GameBoardScreen> createState() => _GameBoardScreenState();
}

class _GameBoardScreenState extends State<GameBoardScreen> {
  late LudoGame _game;
  late LudoMatchState _state;
  late DeterministicRng _rng;
  late ReducedMotionSetting _reducedMotion;
  late Future<LudoLocalSave> _localSaveFuture;
  late LudoTelemetry _telemetry;
  late final DateTime _matchStartedAt;
  DateTime? _turnDeadline;
  Timer? _turnTimeoutTimer;

  /// Set once "don't show again" is checked on a Pass N Play interstitial;
  /// suppresses every further interstitial for the rest of this running
  /// screen instance (a session, per this task's Context/Decisions).
  bool _suppressPassAndPlayInterstitial = false;

  /// Guards against re-entrant bot-turn/interstitial handling while one is
  /// already in flight (e.g. a stray extra tap during a bot sequence).
  bool _turnAdvanceInFlight = false;

  /// `true` while a roll/move's board animation (`_game.applyEvents`,
  /// e.g. the dice tumble or a token hop) is still resolving.
  ///
  /// Root cause of the stuck-turn bug this task fixes: `_state` (and thus
  /// `_canRoll`/`_canMove`, both phase-gate checks) was updated via
  /// `setState` *before* `_game.applyEvents` finished animating, so the
  /// board/dice zone looked interactive again — and genuinely accepted a
  /// human tap — while the previous action's animation was still
  /// in-flight. A second concurrent `_rollDice`/`_handleTokenTap` call
  /// then re-entered `LudoGame.applyEvents` while the first call was still
  /// awaiting it, and because `LudoDiceComponent`/`LudoTokenComponent`
  /// silently drop an in-flight animation's completer when a new one
  /// starts (see the fixes in those files), the *first* call's `await`
  /// never resolved — permanently stranding the turn-advance logic
  /// (`_handleTurnAdvanced`, which starts the bot-turn runner) that was
  /// chained after it, even though `_state` already showed the next
  /// seat's turn. Gating `_canRoll`/`_canMove` on this flag closes the
  /// window entirely: no second `applyEvents` call can start before the
  /// first one's animation has actually finished.
  bool _boardBusy = false;

  @override
  void initState() {
    super.initState();
    assert(widget.seatIdentities.length == widget.config.seats.length);
    _rng = DeterministicRng(
      widget.diceSeed ?? DateTime.now().millisecondsSinceEpoch,
    );
    _reducedMotion = widget.reducedMotion ?? ReducedMotionSetting();
    _telemetry = widget.telemetry ?? LudoTelemetry();
    _matchStartedAt = DateTime.now();
    _localSaveFuture = widget.localSave != null
        ? Future.value(widget.localSave)
        : LudoLocalSave.production();
    _state =
        widget.initialState ??
        LudoMatchState.initial(
          ruleset: widget.config.ruleset,
          subjects: [
            for (var i = 0; i < widget.config.seats.length; i++)
              widget.config.seats[i].isBot ? 'bot-$i' : 'local-$i',
          ],
        );
    _game = LudoGame(initialState: _state, reducedMotion: _reducedMotion)
      ..onTokenTap = _handleTokenTap;
    _armDeadlineForCurrentTurn();
    // Seat 0 is always the local human player, so a *freshly-started*
    // match never opens on a bot's turn — but a *resumed* match (task 11)
    // can, if the app was killed right after the human's turn handed off
    // to a bot. Cover that case at construction time too, so resuming
    // mid-bot-sequence doesn't strand the match waiting on a seat that
    // will never act.
    if (widget.config.seats[_state.currentPlayerIndex].isBot) {
      scheduleMicrotask(_runBotTurns);
    }
  }

  @override
  void dispose() {
    _turnTimeoutTimer?.cancel();
    super.dispose();
  }

  /// Persists [_state] to [_localSaveFuture]'s save after every applied
  /// move (task 11), or clears it once the match reaches
  /// [LudoMatchPhase.finished] so no stale resumable save is left behind.
  Future<void> _persistLocalSave() async {
    final save = await _localSaveFuture;
    if (_state.phase == LudoMatchPhase.finished) {
      await save.clear();
      return;
    }
    await save.save(
      LudoLocalMatchSave(
        state: _state,
        config: widget.config,
        seatIdentities: widget.seatIdentities,
      ),
    );
  }

  void _armDeadlineForCurrentTurn() {
    _turnTimeoutTimer?.cancel();
    _turnDeadline = DateTime.now().add(ludoTurnDuration);
    // Only a human seat's turn is worth tracking a real timeout for; a
    // bot's own "turn" is driven synchronously by the bot-turn runner and
    // never sits idle. This timer only ever records telemetry — no local
    // auto-pass/forfeit action follows from it, matching this task's
    // Context/Decisions (turn-timeout *enforcement* is server-authoritative
    // online play, task 19).
    final seatIndex = _state.currentPlayerIndex;
    if (_state.phase != LudoMatchPhase.finished &&
        !widget.config.seats[seatIndex].isBot) {
      _turnTimeoutTimer = Timer(
        ludoTurnDuration,
        () => _telemetry.turnTimedOut(seatIndex: seatIndex),
      );
    }
  }

  /// Whether it's a local human seat's turn to roll right now. Any seat
  /// that isn't a bot may act when it's their turn — seat 0 in a
  /// vs-Computer match, or whichever seat is active in a Pass N Play
  /// match sharing this device.
  bool get _canRoll =>
      !_boardBusy &&
      _state.phase == LudoMatchPhase.awaitingRoll &&
      !widget.config.seats[_state.currentPlayerIndex].isBot;

  /// Whether it's a local human seat's turn to move a legal token.
  bool get _canMove =>
      !_boardBusy &&
      _state.phase == LudoMatchPhase.awaitingMove &&
      !widget.config.seats[_state.currentPlayerIndex].isBot;

  Future<void> _rollDice() async {
    if (!_canRoll) return;
    final previousSeat = _state.currentPlayerIndex;
    final result = rollDice(
      _state,
      FunctionDiceSource(() => _rng.nextInt(6) + 1),
    );
    setState(() {
      _state = result.state;
      _boardBusy = true;
      _armDeadlineForCurrentTurn();
    });
    try {
      await _game.applyEvents(result.events, result.state);
    } finally {
      if (mounted) setState(() => _boardBusy = false);
    }
    await _persistLocalSave();
    if (_maybeNavigateToResults()) return;
    await _handleTurnAdvanced(previousSeat);
  }

  Future<void> _handleTokenTap(LudoColor color, int tokenId) async {
    if (!_canMove) return;
    final previousSeat = _state.currentPlayerIndex;
    final localColor = _state.players[_state.currentPlayerIndex].color;
    if (color != localColor) return;
    if (!legalMoves(_state).contains(tokenId)) return;
    final result = applyMove(_state, tokenId);
    setState(() {
      _state = result.state;
      _boardBusy = true;
      _armDeadlineForCurrentTurn();
    });
    try {
      await _game.applyEvents(result.events, result.state);
    } finally {
      if (mounted) setState(() => _boardBusy = false);
    }
    await _persistLocalSave();
    if (_maybeNavigateToResults()) return;
    await _handleTurnAdvanced(previousSeat);
  }

  /// After a roll/move resolves, drives whatever the *new* active seat
  /// needs: nothing if it's still the same seat (a bonus roll), the
  /// bot-turn runner if it's a bot seat, or the Pass N Play interstitial if
  /// it's a different human seat in a Pass N Play match. Never both — a
  /// vs-Computer match has at most one human seat, and a Pass N Play match
  /// has no bot seats at all.
  Future<void> _handleTurnAdvanced(int previousSeat) async {
    if (_turnAdvanceInFlight) return;
    if (_state.phase == LudoMatchPhase.finished) return;
    final currentSeat = _state.currentPlayerIndex;
    if (currentSeat == previousSeat) return;
    _turnAdvanceInFlight = true;
    try {
      if (widget.config.seats[currentSeat].isBot) {
        await _runBotTurns();
      } else if (!widget.config.isComputerMatch &&
          !_suppressPassAndPlayInterstitial) {
        await _showPassAndPlayInterstitial(currentSeat);
      }
    } finally {
      _turnAdvanceInFlight = false;
    }
  }

  /// Drives every consecutive bot seat's turn from the current state via
  /// [LudoBotTurnRunner], applying each step's animation/persistence one at
  /// a time (never jumping straight to the end of the bot sequence), then
  /// navigates to results if that sequence ended the match.
  Future<void> _runBotTurns() async {
    final runner = LudoBotTurnRunner(
      seats: [
        for (final seat in widget.config.seats)
          LudoBotSeat(isBot: seat.isBot, difficulty: seat.botDifficulty),
      ],
      delayBetweenSteps: widget.botTurnDelay,
    );
    await runner.run(
      _state,
      _rng,
      onStep: (step) async {
        if (!mounted) return;
        setState(() {
          _state = step.state;
          _boardBusy = true;
          _armDeadlineForCurrentTurn();
        });
        try {
          await _game.applyEvents(step.events, step.state);
        } finally {
          if (mounted) setState(() => _boardBusy = false);
        }
        await _persistLocalSave();
      },
    );
    _maybeNavigateToResults();
  }

  /// Shows the Pass N Play "Pass to `<player>`" interstitial for
  /// [seatIndex] and awaits its dismissal before returning, so play only
  /// resumes once the device has (ostensibly) actually changed hands.
  Future<void> _showPassAndPlayInterstitial(int seatIndex) async {
    if (!mounted) return;
    final identity = widget.seatIdentities[seatIndex];
    final dontShowAgain = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(
        builder: (routeContext) => PassAndPlayInterstitial(
          playerName: identity.name,
          avatarId: identity.avatarId,
          onContinue: (value) => Navigator.of(routeContext).pop(value),
        ),
      ),
    );
    if (dontShowAgain == true) {
      _suppressPassAndPlayInterstitial = true;
    }
  }

  /// Pushes [ResultsScreen], replacing this screen, once [_state] reaches
  /// [LudoMatchPhase.finished] — recording `ludo_match_finished` first.
  /// Returns whether it navigated, so callers can skip any further
  /// turn-advance handling (bot runner / interstitial) once the match is
  /// over. A no-op (returns `false`) otherwise.
  bool _maybeNavigateToResults() {
    if (_state.phase != LudoMatchPhase.finished) return false;
    _telemetry.matchFinished(
      variant: widget.config.isComputerMatch
          ? LudoMatchVariant.vsComputer
          : LudoMatchVariant.passAndPlay,
      ruleset: widget.config.ruleset.id,
      winnerSeat: _state.winnerOrder.isNotEmpty
          ? _state.winnerOrder.first
          : _state.currentPlayerIndex,
      duration: DateTime.now().difference(_matchStartedAt),
    );
    if (!mounted) return true;
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
    return true;
  }

  void _openPauseDialog() {
    showPauseQuitDialog(
      context,
      soundSettings: widget.soundSettings,
      reducedMotion: _reducedMotion,
      settingsStore: widget.settingsStore,
      telemetry: _telemetry,
      onQuit: widget.onQuit ?? () => Navigator.of(context).maybePop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final sideMargin = MediaQuery.sizeOf(context).width * 0.025;
    return Scaffold(
      backgroundColor: LudoThemeTokens.backgroundDeepBlue,
      body: LudoBackground(
        child: SafeArea(
          child: Stack(
            children: [
              Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: LudoThemeTokens.spaceXs,
                  vertical: LudoThemeTokens.spaceXs,
                ),
                child: Column(
                  children: [
                    // A small top-left pause/menu icon button occupies
                    // this space instead (see the `Positioned` button
                    // below), so the top corner cards sit right under
                    // the safe-area edge with no full-width title bar
                    // pushing them down (task 12d2 removes the "Ludo"
                    // title bar the user feedback called out).
                    const SizedBox(height: LudoThemeTokens.spaceXl),
                    _PlayerCornerRow(
                      corners: const [_Corner.topLeft, _Corner.topRight],
                      config: widget.config,
                      identities: widget.seatIdentities,
                      state: _state,
                      turnDeadline: _turnDeadline,
                      canRoll: _canRoll,
                      onRoll: _rollDice,
                    ),
                    Expanded(
                      // The Flame `GameWidget` fills whatever box it's
                      // given, and `LudoGame` sizes its board to the
                      // *smaller* of that box's two dimensions (see
                      // `LudoGame._boardSize`) — so without this
                      // `AspectRatio`, the `Expanded` region here is
                      // taller (or wider) than it is square, and the
                      // leftover strip the board doesn't paint into
                      // renders as a solid black rectangle (Flame's
                      // default canvas background). Constraining the
                      // widget itself to a 1:1 box before Flame ever
                      // sees it means the canvas *is* the board, with
                      // no unpainted area left over. Only a small
                      // (~2-3% of screen width) side margin separates
                      // the board from the screen edge, per task
                      // 12d2's "board fills the screen width" spec.
                      child: Center(
                        child: Padding(
                          padding: EdgeInsets.symmetric(horizontal: sideMargin),
                          child: AspectRatio(
                            aspectRatio: 1,
                            child: GameWidget(game: _game),
                          ),
                        ),
                      ),
                    ),
                    _PlayerCornerRow(
                      corners: const [_Corner.bottomLeft, _Corner.bottomRight],
                      config: widget.config,
                      identities: widget.seatIdentities,
                      state: _state,
                      turnDeadline: _turnDeadline,
                      canRoll: _canRoll,
                      onRoll: _rollDice,
                    ),
                  ],
                ),
              ),
              Positioned(
                top: LudoThemeTokens.spaceXs,
                left: LudoThemeTokens.spaceXs,
                child: Ludo3dButton(
                  key: const Key('game-board-menu-button'),
                  semanticLabel: 'Pause',
                  onPressed: _openPauseDialog,
                  padding: const EdgeInsets.all(LudoThemeTokens.spaceSm),
                  borderRadius: LudoThemeTokens.radiusSm,
                  child: const Icon(
                    Icons.pause,
                    color: LudoThemeTokens.textOutline,
                    size: 20,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The four board quadrants a corner card can occupy, matching this
/// screen's on-board layout (two above the board, two below).
enum _Corner { topLeft, topRight, bottomLeft, bottomRight }

/// Which corner each [LudoColor] seat renders its card in — the same
/// quadrant that color's tokens/home/base occupy on the board itself (see
/// `ludo_board_geometry.dart`'s `ludoHomeOrigin`: red top-left, green
/// top-right, yellow bottom-right, blue bottom-left). Deriving the corner
/// from the seat's own color, rather than hardcoding per-player-count
/// layouts, means a 2-player match naturally reads as top/bottom or
/// diagonal depending on which two colors were chosen (e.g. the
/// Quick-mode red+green default lands top-left/top-right, while a
/// red+yellow pairing lands diagonally) — always visually adjacent to
/// that seat's own quadrant, which is what makes the four-corner layout
/// legible at a glance (task 12d's Context/Decisions).
const _cornerForColor = {
  LudoColor.red: _Corner.topLeft,
  LudoColor.green: _Corner.topRight,
  LudoColor.yellow: _Corner.bottomRight,
  LudoColor.blue: _Corner.bottomLeft,
};

/// One row of up to two [PlayerCornerCard]s (the top pair or the bottom
/// pair). A corner with no seat assigned renders as an empty flexible
/// spacer so its sibling stays aligned to its own side; a row with
/// neither corner occupied (e.g. the bottom row in a 2-player match where
/// both seats' colors map to the top row) collapses to nothing.
class _PlayerCornerRow extends StatelessWidget {
  const _PlayerCornerRow({
    required this.corners,
    required this.config,
    required this.identities,
    required this.state,
    required this.turnDeadline,
    required this.canRoll,
    required this.onRoll,
  });

  final List<_Corner> corners;
  final LudoLocalMatchConfig config;
  final List<LudoSeatIdentity> identities;
  final LudoMatchState state;
  final DateTime? turnDeadline;
  final bool canRoll;
  final VoidCallback onRoll;

  Map<_Corner, int> get _seatByCorner {
    final map = <_Corner, int>{};
    for (var seat = 0; seat < config.seats.length; seat++) {
      map[_cornerForColor[config.seats[seat].color]!] = seat;
    }
    return map;
  }

  @override
  Widget build(BuildContext context) {
    final seatByCorner = _seatByCorner;
    if (!corners.any(seatByCorner.containsKey)) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: LudoThemeTokens.spaceXs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final corner in corners)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: LudoThemeTokens.spaceXs,
                ),
                child: _cornerCard(seatByCorner[corner]),
              ),
            ),
        ],
      ),
    );
  }

  Widget _cornerCard(int? seat) {
    if (seat == null) return const SizedBox.shrink();
    final isActive =
        state.phase != LudoMatchPhase.finished &&
        state.currentPlayerIndex == seat;
    return PlayerCornerCard(
      key: ValueKey('player-corner-card-$seat'),
      name: identities[seat].name,
      avatarId: identities[seat].avatarId,
      color: config.seats[seat].color,
      isActive: isActive,
      deadline: isActive ? turnDeadline : null,
      turnDuration: ludoTurnDuration,
      showDice: isActive,
      diceEnabled: canRoll,
      lastRoll: state.currentRoll,
      onRoll: onRoll,
    );
  }
}
