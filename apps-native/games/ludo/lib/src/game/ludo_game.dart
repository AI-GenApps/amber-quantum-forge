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

  /// The dice's on-board size, as a fraction of the board's side.
  static const _diceSizeFraction = 0.14;

  Vector2 _dicePosition(Vector2 boardSize) =>
      Vector2(boardSize.x * 0.92, boardSize.y * 0.08);

  @override
  Future<void> onLoad() async {
    final boardSize = _boardSize;
    board = LudoBoardComponent(boardSize: boardSize);
    legalMoveHighlight = LudoLegalMoveHighlightComponent(boardSize: boardSize);
    turnHighlight = LudoTurnHighlightComponent(boardSize: boardSize);
    dice = LudoDiceComponent(reducedMotion: reducedMotion)
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
    for (final event in events) {
      if (event is LudoDiceRolledEvent) {
        await dice.rollTo(event.roll);
      }
    }

    if (!_layersReady) {
      await setMatchState(newState);
      return;
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
    for (final player in state.players) {
      for (final token in player.tokens) {
        final key = _keyFor(player.color, token.id);
        final grid = _gridForPosition(
          player.color,
          state.ruleset,
          token.pathPosition,
          tokenId: token.id,
        );
        final existing = _tokensByKey[key];
        if (existing == null) {
          _tokensByKey[key] = LudoTokenComponent(
            color: player.color,
            tokenId: token.id,
            boardSize: boardSize,
            initialCell: grid,
            reducedMotion: reducedMotion,
          );
          add(_tokensByKey[key]!);
          continue;
        }
        if (skipTokenKeys.contains(key)) continue;
        final previousPosition = _previousPositionOf(
          previous,
          player.color,
          token.id,
        );
        if (previousPosition == token.pathPosition) continue;
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
