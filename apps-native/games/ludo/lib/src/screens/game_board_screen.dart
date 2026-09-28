/// The game board screen (task 09, restyled by task 12d, board/layout
/// fidelity by task 12d2): composes task 05's `ludo_game.dart` Flame
/// widget with surrounding chrome — one [PlayerCornerCard] per occupied
/// board corner (the active seat's card also hosts its `DiceZone` roll
/// control), the [LudoBackground] painter as the screen's base layer, and
/// a small corner pause/menu icon button opening [PauseQuitDialog] (no
/// full-width title bar). Driven by local `ludo_rules` state for
/// Computer/Pass N Play matches; an online match instead supplies
/// [GameBoardScreen.onlineMatch] (task 25), whose
/// `LudoMatchStateSource` stream drives `_state`/the timer ring and whose
/// `quit()` sends the pause dialog's surrender/claim-timeout command —
/// rooms/matchmaking UI wiring that constructs it is task 26. Bot move
/// automation is task 12 — this screen only renders the bot-difficulty
/// choice made in [ModeSetupSheet], it never plays a bot's turn itself.
library;

import 'dart:async';

import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart';
import 'package:platform_core/platform_core.dart' show DeterministicRng;

import '../game/ludo_bot_turn_runner.dart';
import '../game/ludo_game.dart';
import '../net/ludo_engine_state_codec.dart';
import '../net/ludo_match_models.dart' as ludo_wire;
import '../net/ludo_match_state_source.dart';
import '../net/ludo_session_models.dart' show LudoMatchView;
import '../state/ludo_local_save.dart';
import '../state/ludo_settings_store.dart';
import '../state/ludo_sound_settings.dart';
import '../state/reduced_motion_setting.dart';
import '../telemetry/ludo_telemetry.dart';
import '../theme/ludo_background_painter.dart';
import '../theme/ludo_theme_tokens.dart';
import '../widgets/ludo_3d_button.dart';
import '../widgets/ludo_reconnecting_banner.dart';
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
    this.onlineMatch,
    this.onlineVariant,
  }) : assert(
         onlineMatch == null || onlineVariant != null,
         'onlineVariant is required whenever onlineMatch is supplied',
       );

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

  /// Task 25: when non-null, this match is online — `_state`/`_turnDeadline`
  /// are driven entirely by [LudoOnlineMatchSession.stateSource] instead of
  /// local `ludo_rules` calls, [initialState] supplies the first-known
  /// state (from the create/join response), and the pause dialog's Quit
  /// action sends a surrender/claim-timeout command through it instead of
  /// just popping the screen. `null` (the default) preserves every local
  /// (Computer/Pass N Play) behavior unchanged.
  final LudoOnlineMatchSession? onlineMatch;

  /// Task 26: which telemetry variant an online match's `ludo_match_finished`
  /// event uses — `online` for a matchmaking-search match, `room` for a
  /// private-room match. Required whenever [onlineMatch] is non-null;
  /// ignored (and may be left `null`) for a local match.
  final LudoMatchVariant? onlineVariant;

  @override
  State<GameBoardScreen> createState() => _GameBoardScreenState();
}

class _GameBoardScreenState extends State<GameBoardScreen>
    with WidgetsBindingObserver {
  late LudoGame _game;
  late LudoMatchState _state;
  late DeterministicRng _rng;
  late ReducedMotionSetting _reducedMotion;
  late Future<LudoLocalSave> _localSaveFuture;
  late LudoTelemetry _telemetry;
  late final DateTime _matchStartedAt;
  DateTime? _turnDeadline;
  Timer? _turnTimeoutTimer;
  StreamSubscription<LudoMatchView>? _onlineStatesSubscription;
  StreamSubscription<bool>? _onlineConnectedSubscription;

  /// `true` unless the active [LudoOnlineMatchSession.stateSource] most
  /// recently reported a connectivity drop ([LudoMatchStateSource.connected]
  /// emitting `false`) — drives [LudoReconnectingBanner]. Always `true` for
  /// a local (non-online) match, which never subscribes to this stream.
  bool _connected = true;

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

  /// Guards [_maybeNavigateToResults] against recording `ludo_match_finished`
  /// (and navigating to results) more than once for the same finished match
  /// — see that method's doc comment.
  bool _matchFinishedRecorded = false;

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
    if (widget.onlineMatch != null) {
      WidgetsBinding.instance.addObserver(this);
      // No deadline is known yet until the state source delivers its
      // first update (both implementations fetch/listen immediately on
      // construction, so this is a very short-lived gap); the timer ring
      // simply renders nothing until then rather than a stale local one.
      _turnDeadline = null;
      _onlineStatesSubscription = widget.onlineMatch!.stateSource.states.listen(
        _applyOnlineView,
      );
      _onlineConnectedSubscription = widget.onlineMatch!.stateSource.connected
          .listen((value) {
            if (mounted) setState(() => _connected = value);
          });
      return;
    }
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
    if (widget.onlineMatch != null) {
      WidgetsBinding.instance.removeObserver(this);
    }
    unawaited(_onlineStatesSubscription?.cancel());
    unawaited(_onlineConnectedSubscription?.cancel());
    // Disposes the state source too (cancels its polling timer/Firestore
    // subscription) — without this, an online match's background polling
    // would keep running forever after this screen is popped/replaced.
    // `LudoOnlineMatchSession.dispose`/`LudoMatchStateSource.dispose` are
    // both documented safe to call more than once.
    widget.onlineMatch?.dispose();
    super.dispose();
  }

  /// Task 25 reconnect handling: on returning to the foreground during an
  /// online match, re-fetch state via the gateway (ground truth) rather
  /// than continuing to show whatever was in memory before backgrounding —
  /// a stale state must never be shown as current.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && widget.onlineMatch != null) {
      unawaited(_refetchOnlineStateOnResume());
    }
  }

  Future<void> _refetchOnlineStateOnResume() async {
    try {
      final view = await widget.onlineMatch!.stateSource.refresh();
      if (mounted) _applyOnlineView(view);
    } on Object {
      // Swallow: a briefly-unavailable network on resume must never crash
      // the board screen. The state source's own stream (Firestore or
      // polling) will pick the next update up on its own.
    }
  }

  DateTime? _parseDeadline(String? deadlineAt) =>
      deadlineAt == null ? null : DateTime.tryParse(deadlineAt);

  /// Applies a server-published [LudoMatchView] to this screen's state:
  /// updates `_state`/`_turnDeadline` and snaps [_game]'s board straight to
  /// the new token layout (`animate: false` — [LudoGame.setMatchState],
  /// not [LudoGame.applyEvents]). Animating an *online* roll/move/capture
  /// the way a local turn does is out of this task's scope (task 25 only
  /// wires the state source itself), as is match-finish handling
  /// (results navigation, telemetry — task 26).
  void _applyOnlineView(LudoMatchView view) {
    if (!mounted) return;
    final engineState = _toEngineState(view.matchState);
    setState(() {
      _state = engineState;
      _turnDeadline = _parseDeadline(view.matchState.deadlineAt);
    });
    unawaited(_game.setMatchState(engineState, animate: false));
    // Task 26: a server-driven finish (the opponent's winning move, a
    // claimed timeout, a surrender) must navigate to results the same way
    // a local match's own finishing move does — `_maybeNavigateToResults`
    // is idempotent (`_matchFinishedRecorded`), so a later state-source
    // emission after this screen already navigated away is a safe no-op.
    _maybeNavigateToResults();
  }

  /// Converts the server's wire `LudoMatchState` (`ludo_match_models.dart`,
  /// mirroring `packages/api/src/games/ludo/contracts.ts`) into the
  /// `ludo_rules` engine state this screen (and [LudoGame]) render — the
  /// two types share every enum's Dart-side member names (`LudoColor`,
  /// `LudoMatchPhase`) by construction, so no server-side field rename can
  /// silently desync them without also failing `ludo_match_models.dart`'s
  /// own decode.
  LudoMatchState _toEngineState(ludo_wire.LudoMatchState wire) =>
      ludoEngineStateFromWire(wire);

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
  ///
  /// Always `false` for an online match: sending the roll/move command to
  /// the server is out of this task's scope (task 25 only wires the state
  /// source, timer deadline, reconnect and quit), so an online match's
  /// board renders whatever state the server publishes without accepting
  /// local dice/token input.
  bool get _canRoll =>
      widget.onlineMatch == null &&
      !_boardBusy &&
      _state.phase == LudoMatchPhase.awaitingRoll &&
      !widget.config.seats[_state.currentPlayerIndex].isBot;

  /// Whether it's a local human seat's turn to move a legal token. See
  /// [_canRoll]'s doc comment for why this is always `false` online.
  bool get _canMove =>
      widget.onlineMatch == null &&
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
    // Guards against double-recording/double-navigating: an online match
    // can observe more than one `finished` state-source emission (e.g. a
    // reconnect `refresh()` re-delivering the same final state after this
    // screen already handled the first one).
    if (_matchFinishedRecorded) return true;
    _matchFinishedRecorded = true;
    _telemetry.matchFinished(
      variant: widget.onlineMatch != null
          ? widget.onlineVariant!
          : (widget.config.isComputerMatch
                ? LudoMatchVariant.vsComputer
                : LudoMatchVariant.passAndPlay),
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
      onQuit: widget.onQuit ?? _defaultOnQuit,
    );
  }

  /// The Quit action's default effect when the caller supplies no
  /// [GameBoardScreen.onQuit] override: for an online match, sends
  /// surrender/claim-timeout through [LudoOnlineMatchSession.quit] and
  /// waits for it before popping (so a network failure there surfaces as
  /// this screen simply staying open rather than the match silently
  /// closing without the server ever hearing about it); for a local match,
  /// pops immediately as before.
  void _defaultOnQuit() {
    final onlineMatch = widget.onlineMatch;
    if (onlineMatch == null) {
      Navigator.of(context).maybePop();
      return;
    }
    unawaited(
      onlineMatch
          .quit(
            currentPlayerIndex: _state.currentPlayerIndex,
            turnDeadline: _turnDeadline,
          )
          .then((_) {
            if (mounted) Navigator.of(context).maybePop();
          })
          .catchError((Object _) {
            // A network failure sending surrender/claim-timeout leaves this
            // screen open rather than silently closing a match the server
            // never heard the quit for — the player can retry from the
            // pause dialog.
          }),
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
              if (widget.onlineMatch != null && !_connected)
                const LudoReconnectingBanner(),
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
      showCaptureIndicator:
          config.ruleset.winCondition ==
              LudoWinCondition.oneHomeAndOneCapture &&
          state.players[seat].hasCaptured,
    );
  }
}
