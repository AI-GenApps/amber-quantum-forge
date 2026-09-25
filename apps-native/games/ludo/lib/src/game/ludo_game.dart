/// The `FlameGame` that composes the board, tokens, highlight layers
/// (task 04), and the animated dice / capture / home-arrival / confetti
/// effects (task 05) into one renderable game.
///
/// Driven by a `LudoMatchState`-shaped input (from `ludo_rules`), supplied
/// locally for now via [setMatchState] / [applyEvents] — task 12 wires a
/// real match-state source (local play controller / server sync) on top of
/// this same class.
library;

import 'dart:ui';

import 'package:flame/game.dart';
import 'package:ludo_rules/ludo_rules.dart';

import '../state/reduced_motion_setting.dart';
import 'ludo_board_component.dart';
import 'ludo_board_geometry.dart';
import 'ludo_capture_particles.dart';
import 'ludo_confetti.dart';
import 'ludo_dice_component.dart';
import 'ludo_home_arrival_burst.dart';
import 'ludo_legal_move_highlight.dart';
import 'ludo_token_component.dart';
import 'ludo_turn_highlight.dart';

const _board = LudoBoard();

/// Composes [LudoBoardComponent], one [LudoTokenComponent] per token,
/// [LudoLegalMoveHighlightComponent], [LudoTurnHighlightComponent] and
/// [LudoDiceComponent] into a single `FlameGame`, and spawns the
/// [LudoCaptureBurstComponent] / [LudoHomeArrivalBurstComponent] /
/// [LudoConfettiComponent] effects as [applyEvents] observes the
/// corresponding `ludo_rules` events.
class LudoGame extends FlameGame {
  LudoGame({LudoMatchState? initialState, ReducedMotionSetting? reducedMotion})
    : reducedMotion = reducedMotion ?? ReducedMotionSetting(),
      _pendingState = initialState;

  /// Consulted by every token/dice this game creates: see
  /// [LudoTokenComponent.hopTo] and [LudoDiceComponent.rollTo].
  final ReducedMotionSetting reducedMotion;

  /// Invoked when any token on the board is tapped, with that token's
  /// color and id. Set by `GameBoardScreen` (task 09) to wire taps to
  /// `applyMove`; this game never decides move legality itself.
  void Function(LudoColor color, int tokenId)? onTokenTap;

  LudoMatchState? _pendingState;
  LudoMatchState? _state;
  bool _layersReady = false;

  late final LudoBoardComponent board;
  late final LudoLegalMoveHighlightComponent legalMoveHighlight;
  late final LudoTurnHighlightComponent turnHighlight;
  late final LudoDiceComponent dice;
  final Map<String, LudoTokenComponent> _tokensByKey = {};

  /// The match state this game last rendered, or `null` before any state
  /// has been applied.
  LudoMatchState? get matchState => _state;

  /// The tokens currently on the board, for tests/inspection.
  List<LudoTokenComponent> get tokens => List.unmodifiable(_tokensByKey.values);

  Vector2 get _boardSize {
    final side = size.x < size.y ? size.x : size.y;
    return Vector2.all(side <= 0 ? 300 : side);
  }

  /// The dice's size/position never render anything on the board canvas
  /// (task 12d2: [dice] is constructed with `paintsOnCanvas: false` below)
  /// — this is only the layout its internal tumble/flicker/bounce timing
  /// runs against, kept a stable non-zero size purely so nothing about
  /// [LudoDiceComponent]'s own update logic depends on a degenerate
  /// zero-size component. The *visible* glossy die the player sees lives
  /// in the active seat's corner-card dice slot (`DiceZone`), never on the
  /// board itself — see this task's Context/Decisions on the "grey
  /// dice-glyph square" user feedback this replaces.
  static const _diceSizeFraction = 0.12;

  Vector2 _dicePosition(Vector2 boardSize) =>
      Vector2(boardSize.x * 0.5, boardSize.y * 0.5);

  /// Non-black so any transient unpainted edge (e.g. mid-resize, before
  /// `onGameResize` has re-laid the board out to the new square) never
  /// reads as the black-rectangle bug this task fixes — the board itself
  /// should always cover the canvas via `GameBoardScreen`'s `AspectRatio`
  /// wrapper, but this is a cheap second line of defense.
  @override
  Color backgroundColor() => const Color(0xFF2E7D32);

  @override
  Future<void> onLoad() async {
    final boardSize = _boardSize;
    board = LudoBoardComponent(boardSize: boardSize);
    legalMoveHighlight = LudoLegalMoveHighlightComponent(boardSize: boardSize);
    turnHighlight = LudoTurnHighlightComponent(boardSize: boardSize);
    dice =
        LudoDiceComponent(reducedMotion: reducedMotion, paintsOnCanvas: false)
          ..size = Vector2.all(boardSize.x * _diceSizeFraction)
          ..position = _dicePosition(boardSize);
    await addAll([board, turnHighlight, legalMoveHighlight, dice]);
    _layersReady = true;
    final pending = _pendingState;
    if (pending != null) {
      await setMatchState(pending, animate: false);
    }
  }

  @override
  void onGameResize(Vector2 size) {
    super.onGameResize(size);
    if (!_layersReady) return;
    final boardSize = _boardSize;
    board.relayout(boardSize);
    legalMoveHighlight.size = boardSize;
    turnHighlight.size = boardSize;
    dice.size = Vector2.all(boardSize.x * _diceSizeFraction);
    dice.position = _dicePosition(boardSize);
    for (final token in _tokensByKey.values) {
      token.updateBoardSize(boardSize);
    }
  }

  Vector2 _pixelCenterOf((int, int) cell) {
    final rect = Rect.fromLTWH(0, 0, board.size.x, board.size.y);
    final offset = ludoCellCenterAt(cell, rect);
    return Vector2(offset.dx, offset.dy);
  }

  LudoColor _colorForSeat(LudoMatchState state, int seat) =>
      state.players.firstWhere((player) => player.seat == seat).color;

  /// Applies the effects of [events] (dice roll, capture, home arrival,
  /// match end) and then [newState]'s token/highlight layout, wiring task
  /// 05's animated components to the `ludo_rules` events that trigger them:
  ///
  /// - `diceRolled` tumbles [dice] to the rolled face before anything else
  ///   moves.
  /// - `tokenCaptured` bursts a [LudoCaptureBurstComponent] at the
  ///   captured token's current cell and flies it back to its yard via
  ///   [LudoTokenComponent.flyTo] (instead of the teleporting `snapTo`
  ///   [setMatchState] would otherwise use for a backward position change).
  /// - `tokenFinished` bursts a [LudoHomeArrivalBurstComponent] at the
  ///   token's home cell once [setMatchState] has moved it there.
  /// - `matchFinished` spawns [LudoConfettiComponent] across the board.
  Future<void> applyEvents(
    List<LudoReplayEvent> events,
    LudoMatchState newState,
  ) async {
    // `dice` (and every other layer) is only assigned once `onLoad` has
    // run — a `late final` field, so touching it any earlier throws a
    // `LateInitializationError`. That's reachable: `GameBoardScreen`
    // starts driving a bot's turn via `scheduleMicrotask` in `initState`
    // whenever the active seat is already a bot at construction time
    // (a resumed match, or this task's debug-only all-bots demo, which
    // always starts on a bot seat) — a microtask runs before the first
    // frame, i.e. before `onLoad`'s `addAll(...)` has necessarily
    // finished. Left unguarded, that throw aborts the bot-turn runner's
    // loop mid-sequence with `_layersReady` still false and nothing left
    // to drive the next turn, which looks identical to a stuck turn (see
    // this task's Context/Decisions). Buffering the state exactly like
    // `setMatchState` already does for a state applied before `onLoad`
    // finishes fixes this the same way: `onLoad` will apply it once ready.
    if (!_layersReady) {
      await setMatchState(newState);
      return;
    }

    for (final event in events) {
      if (event is LudoDiceRolledEvent) {
        await dice.rollTo(event.roll);
      }
    }

    final capturedKeys = <String>{};
    final flights = <Future<void>>[];
    for (final event in events) {
      if (event is! LudoTokenCapturedEvent) continue;
      final color = _colorForSeat(newState, event.seat);
      final key = _keyFor(color, event.tokenId);
      final token = _tokensByKey[key];
      if (token == null) continue;
      capturedKeys.add(key);
      final burst = LudoCaptureBurstComponent(
        position: _pixelCenterOf(token.currentCell),
        reducedMotion: reducedMotion,
      );
      add(burst);
      flights.add(token.flyTo(ludoYardSlotGrid(color, event.tokenId)));
    }
    await Future.wait(flights);

    await setMatchState(newState, skipTokenKeys: capturedKeys);

    for (final event in events) {
      if (event is LudoTokenFinishedEvent) {
        final color = _colorForSeat(newState, event.seat);
        add(
          LudoHomeArrivalBurstComponent(
            position: _pixelCenterOf(ludoHomeStretchCellGrid(color, 5)),
            reducedMotion: reducedMotion,
          ),
        );
      } else if (event is LudoMatchFinishedEvent) {
        add(
          LudoConfettiComponent(
            boardSize: board.size,
            reducedMotion: reducedMotion,
          ),
        );
      }
    }
  }

  static String _keyFor(LudoColor color, int tokenId) =>
      '${color.name}-$tokenId';

  /// Applies [state], creating any token components that don't exist yet
  /// and animating (or, with [animate] `false` / reduced motion enabled,
  /// snapping) every token whose cell changed since the last applied
  /// state. Any key in [skipTokenKeys] is left untouched — used by
  /// [applyEvents], which has already driven that token's cell to [state]
  /// via a capture flight-back tween ([LudoTokenComponent.flyTo]) rather
  /// than letting this method snap it there.
  Future<void> setMatchState(
    LudoMatchState state, {
    bool animate = true,
    Set<String> skipTokenKeys = const {},
  }) async {
    if (!_layersReady) {
      // Board/highlight layers haven't been created yet (onLoad hasn't run
      // or hasn't reached that point); onLoad will apply this once it has.
      _pendingState = state;
      return;
    }
    final previous = _state;
    _state = state;
    await _syncTokens(
      state,
      previous: previous,
      animate: animate,
      skipTokenKeys: skipTokenKeys,
    );
    legalMoveHighlight.updateFromState(state);
    turnHighlight.updateActiveColor(
      state.phase == LudoMatchPhase.finished ? null : state.currentPlayer.color,
    );
  }

  Future<void> _syncTokens(
    LudoMatchState state, {
    required LudoMatchState? previous,
    required bool animate,
    Set<String> skipTokenKeys = const {},
  }) async {
    final boardSize = board.size;
    final moves = <Future<void>>[];

    // Every token's *final* resting cell for this state, computed up front
    // (task 12h): stacked-token offsets depend on which other tokens share
    // that same cell, which can change even for a token that didn't itself
    // move this turn (e.g. a third token landing on a cell that already
    // held two others) — so every token's offset must be recomputed on
    // every sync, not only the ones whose position changed below.
    final finalGridByKey = <String, (int, int)>{};
    for (final player in state.players) {
      for (final token in player.tokens) {
        finalGridByKey[_keyFor(player.color, token.id)] = _gridForPosition(
          player.color,
          state.ruleset,
          token.pathPosition,
          tokenId: token.id,
        );
      }
    }
    final stackOffsetByKey = _stackOffsetsFor(finalGridByKey);

    for (final player in state.players) {
      for (final token in player.tokens) {
        final key = _keyFor(player.color, token.id);
        final grid = finalGridByKey[key]!;
        final stackOffset = stackOffsetByKey[key]!;
        final existing = _tokensByKey[key];
        if (existing == null) {
          final created =
              LudoTokenComponent(
                  color: player.color,
                  tokenId: token.id,
                  boardSize: boardSize,
                  initialCell: grid,
                  reducedMotion: reducedMotion,
                )
                ..onTap = (color, tokenId) {
                  onTokenTap?.call(color, tokenId);
                }
                ..updateStackOffset(stackOffset);
          _tokensByKey[key] = created;
          add(created);
          continue;
        }
        if (skipTokenKeys.contains(key)) {
          existing.updateStackOffset(stackOffset);
          continue;
        }
        final previousPosition = _previousPositionOf(
          previous,
          player.color,
          token.id,
        );
        if (previousPosition == token.pathPosition) {
          existing.updateStackOffset(stackOffset);
          continue;
        }
        existing.updateStackOffset(stackOffset);
        if (!animate ||
            previousPosition == null ||
            previousPosition > token.pathPosition) {
          existing.snapTo(grid);
        } else {
          final path = [
            for (var p = previousPosition + 1; p <= token.pathPosition; p++)
              _gridForPosition(
                player.color,
                state.ruleset,
                p,
                tokenId: token.id,
              ),
          ];
          moves.add(existing.hopTo(path));
        }
      }
    }
    await Future.wait(moves);
  }

  /// Assigns each token key a small fan-out offset (a fraction of one
  /// board cell) so that 2+ tokens sharing the same board cell render at
  /// visibly distinct, individually-tappable positions instead of
  /// exactly on top of one another (task 12h) — matching Ludo King's
  /// stacked-token convention. A cell with only one token gets the zero
  /// offset (dead-center, unchanged from every prior task's layout).
  /// Grouping and per-group ordering is entirely a function of
  /// [finalGridByKey]'s iteration order (itself `state.players`' then
  /// each player's `tokens`' fixed seat/id order), so the same match
  /// state always assigns the same offsets — no frame-to-frame jitter.
  Map<String, Vector2> _stackOffsetsFor(
    Map<String, (int, int)> finalGridByKey,
  ) {
    final byCell = <(int, int), List<String>>{};
    for (final entry in finalGridByKey.entries) {
      byCell.putIfAbsent(entry.value, () => []).add(entry.key);
    }
    final offsets = <String, Vector2>{};
    for (final group in byCell.values) {
      for (var i = 0; i < group.length; i++) {
        offsets[group[i]] = _fanOutOffset(i, group.length);
      }
    }
    return offsets;
  }

  /// Fraction-of-cell-size offset (both axes in `-0.5..0.5`) for the
  /// [index]th of [total] tokens sharing one cell. `total <= 1` is
  /// dead-center (the pre-task-12h layout). 2 tokens split left/right; 3
  /// form a small triangle; 4+ tile a 2x2 grid, wrapping any further
  /// tokens (beyond the realistic 4-colors-on-one-cell case) onto the
  /// same 4 slots rather than growing unboundedly.
  static Vector2 _fanOutOffset(int index, int total) {
    if (total <= 1) return Vector2.zero();
    const spread = ludoTokenStackFanOutFraction;
    switch (total) {
      case 2:
        return [Vector2(-spread, 0), Vector2(spread, 0)][index];
      case 3:
        return [
          Vector2(0, -spread),
          Vector2(-spread, spread * 0.85),
          Vector2(spread, spread * 0.85),
        ][index];
      default:
        final grid = [
          Vector2(-spread, -spread),
          Vector2(spread, -spread),
          Vector2(-spread, spread),
          Vector2(spread, spread),
        ];
        return grid[index % grid.length];
    }
  }

  int? _previousPositionOf(
    LudoMatchState? previous,
    LudoColor color,
    int tokenId,
  ) {
    if (previous == null) return null;
    for (final player in previous.players) {
      if (player.color != color) continue;
      for (final token in player.tokens) {
        if (token.id == tokenId) return token.pathPosition;
      }
    }
    return null;
  }

  (int, int) _gridForPosition(
    LudoColor color,
    LudoRuleset ruleset,
    int pathPosition, {
    required int tokenId,
  }) {
    if (pathPosition == ludoYardPathPosition) {
      return ludoYardSlotGrid(color, tokenId);
    }
    if (pathPosition >= ruleset.pathLength) {
      return ludoHomeStretchCellGrid(color, 5);
    }
    if (_board.isOnSharedTrack(ruleset, pathPosition)) {
      final absoluteCell = _board.absoluteCellOf(color, pathPosition);
      return ludoTrackCellGrid[absoluteCell];
    }
    return ludoHomeStretchCellGrid(
      color,
      pathPosition - ruleset.stepsToHomeEntry,
    );
  }
}
