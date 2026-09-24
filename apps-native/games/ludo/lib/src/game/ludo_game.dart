/// The `FlameGame` that composes the board, tokens, and highlight layers
/// built by this task into one renderable game.
///
/// Driven by a `LudoMatchState`-shaped input (from `ludo_rules`), supplied
/// locally for now via [setMatchState] — task 12 wires a real match-state
/// source (local play controller / server sync) on top of this same
/// class, and task 05 adds dice, capture particles and confetti on top of
/// it too.
library;

import 'package:flame/game.dart';
import 'package:ludo_rules/ludo_rules.dart';

import '../state/reduced_motion_setting.dart';
import 'ludo_board_component.dart';
import 'ludo_board_geometry.dart';
import 'ludo_legal_move_highlight.dart';
import 'ludo_token_component.dart';
import 'ludo_turn_highlight.dart';

const _board = LudoBoard();

/// Composes [LudoBoardComponent], one [LudoTokenComponent] per token,
/// [LudoLegalMoveHighlightComponent] and [LudoTurnHighlightComponent] into
/// a single `FlameGame`.
class LudoGame extends FlameGame {
  LudoGame({LudoMatchState? initialState, ReducedMotionSetting? reducedMotion})
    : reducedMotion = reducedMotion ?? ReducedMotionSetting(),
      _pendingState = initialState;

  /// Consulted by every token this game creates: see
  /// [LudoTokenComponent.hopTo].
  final ReducedMotionSetting reducedMotion;

  LudoMatchState? _pendingState;
  LudoMatchState? _state;
  bool _layersReady = false;

  late final LudoBoardComponent board;
  late final LudoLegalMoveHighlightComponent legalMoveHighlight;
  late final LudoTurnHighlightComponent turnHighlight;
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

  @override
  Future<void> onLoad() async {
    final boardSize = _boardSize;
    board = LudoBoardComponent(boardSize: boardSize);
    legalMoveHighlight = LudoLegalMoveHighlightComponent(boardSize: boardSize);
    turnHighlight = LudoTurnHighlightComponent(boardSize: boardSize);
    await addAll([board, turnHighlight, legalMoveHighlight]);
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
    for (final token in _tokensByKey.values) {
      token.updateBoardSize(boardSize);
    }
  }

  static String _keyFor(LudoColor color, int tokenId) =>
      '${color.name}-$tokenId';

  /// Applies [state], creating any token components that don't exist yet
  /// and animating (or, with [animate] `false` / reduced motion enabled,
  /// snapping) every token whose cell changed since the last applied
  /// state.
  Future<void> setMatchState(
    LudoMatchState state, {
    bool animate = true,
  }) async {
    if (!_layersReady) {
      // Board/highlight layers haven't been created yet (onLoad hasn't run
      // or hasn't reached that point); onLoad will apply this once it has.
      _pendingState = state;
      return;
    }
    final previous = _state;
    _state = state;
    await _syncTokens(state, previous: previous, animate: animate);
    legalMoveHighlight.updateFromState(state);
    turnHighlight.updateActiveColor(
      state.phase == LudoMatchPhase.finished ? null : state.currentPlayer.color,
    );
  }

  Future<void> _syncTokens(
    LudoMatchState state, {
    required LudoMatchState? previous,
    required bool animate,
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
