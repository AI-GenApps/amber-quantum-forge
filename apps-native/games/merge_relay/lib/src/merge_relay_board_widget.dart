import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_app.dart';
import 'merge_relay_board_accessibility.dart';
import 'merge_relay_board_painter.dart';
import 'merge_relay_gesture.dart';
import 'merge_relay_models.dart';
import 'merge_relay_motion.dart';
import 'merge_relay_theme.dart';

final class MergeRelayBoard extends StatefulWidget {
  const MergeRelayBoard({required this.game, required this.theme, super.key});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  State<MergeRelayBoard> createState() => _MergeRelayBoardState();
}

/// Drives the board's move, blocked-move-shake, and best-tile-celebration
/// animations from the game's presentation/blocked-move signals. Game
/// state stays authoritative and synchronous in `MergeRelayGame.move` —
/// this widget only decides how (and how fast) to *show* a move that has
/// already happened; a swipe made while the current move is still
/// animating is queued and replayed once that animation settles, so two
/// moves never visually overlap.
final class _MergeRelayBoardState extends State<MergeRelayBoard>
    with TickerProviderStateMixin {
  late final AnimationController _moveAnimation;
  late final AnimationController _shakeAnimation;
  late final AnimationController _celebrationAnimation;
  final _swipe = MergeSwipeAccumulator();
  MergeMovePresentation? _presentation;
  MergeDirection? _queuedDirection;
  int _lastBlockedSignal = 0;

  @override
  void initState() {
    super.initState();
    _presentation = widget.game.presentation.value;
    _lastBlockedSignal = widget.game.blockedMoveSignal.value;
    _moveAnimation = AnimationController(
      vsync: this,
      duration: mergeRelayMoveAnimationDuration,
      value: 1,
    )..addStatusListener(_onMoveAnimationStatus);
    _shakeAnimation = AnimationController(
      vsync: this,
      duration: mergeRelayBlockedShakeDuration,
    );
    _celebrationAnimation = AnimationController(
      vsync: this,
      duration: mergeRelayCelebrationDuration,
    );
  }

  @override
  void didUpdateWidget(covariant MergeRelayBoard oldWidget) {
    super.didUpdateWidget(oldWidget);
    final reducedMotion = _reducedMotion;

    final nextPresentation = widget.game.presentation.value;
    if (!identical(nextPresentation, _presentation)) {
      _presentation = nextPresentation;
      if (reducedMotion || nextPresentation == null) {
        _moveAnimation.value = 1;
      } else {
        _moveAnimation.forward(from: 0);
      }
      if (nextPresentation?.isNewBestTile ?? false) {
        if (reducedMotion) {
          _celebrationAnimation.value = 0;
        } else {
          _celebrationAnimation.forward(from: 0);
        }
      }
    }

    final blockedSignal = widget.game.blockedMoveSignal.value;
    if (blockedSignal != _lastBlockedSignal) {
      _lastBlockedSignal = blockedSignal;
      if (reducedMotion) {
        _shakeAnimation.value = 0;
      } else {
        _shakeAnimation.forward(from: 0);
      }
    }
  }

  @override
  void dispose() {
    _moveAnimation.dispose();
    _shakeAnimation.dispose();
    _celebrationAnimation.dispose();
    super.dispose();
  }

  /// Reduced motion follows either source the task decisions name: the
  /// Settings toggle, or the platform's own accessibility signal
  /// (`MediaQuery.disableAnimations` — e.g. "Reduce motion" in iOS/Android
  /// system settings), regardless of whether the in-app toggle is off.
  bool get _reducedMotion =>
      widget.game.preferences.value.reducedMotion ||
      (MediaQuery.maybeDisableAnimationsOf(context) ?? false);

  void _onMoveAnimationStatus(AnimationStatus status) {
    if (status != AnimationStatus.completed) return;
    final queued = _queuedDirection;
    if (queued == null) return;
    _queuedDirection = null;
    widget.game.move(queued);
  }

  /// Applies [direction] immediately, unless the previous move's
  /// animation is still playing — then it replaces any earlier queued
  /// direction and is applied once that animation completes.
  void _handleMove(MergeDirection direction) {
    if (_moveAnimation.isAnimating) {
      _queuedDirection = direction;
      return;
    }
    widget.game.move(direction);
  }

  @override
  Widget build(BuildContext context) {
    final board = widget.game.state.value.board;
    return mergeRelayAccessibleBoard(
      board: board,
      label: mergeRelayBoardLabel(board),
      customActions: {
        CustomSemanticsAction(label: 'Move up'): () =>
            _handleMove(MergeDirection.up),
        CustomSemanticsAction(label: 'Move left'): () =>
            _handleMove(MergeDirection.left),
        CustomSemanticsAction(label: 'Move right'): () =>
            _handleMove(MergeDirection.right),
        CustomSemanticsAction(label: 'Move down'): () =>
            _handleMove(MergeDirection.down),
      },
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: widget.theme.board,
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
              color: widget.theme.ink.withValues(alpha: 0.18),
              blurRadius: 22,
              offset: const Offset(0, 12),
            ),
          ],
        ),
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onPanStart: widget.game.roundComplete.value
              ? null
              : (_) => _swipe.start(),
          onPanUpdate: widget.game.roundComplete.value
              ? null
              : (details) => _swipe.update(details.delta),
          onPanCancel: _swipe.cancel,
          onPanEnd: widget.game.roundComplete.value ? null : _swipeEnd,
          child: LayoutBuilder(
            builder: (context, constraints) => SizedBox.square(
              dimension: constraints.maxWidth,
              child: AnimatedBuilder(
                animation: Listenable.merge([
                  _moveAnimation,
                  _shakeAnimation,
                  _celebrationAnimation,
                ]),
                builder: (context, _) {
                  final presentation = _presentation;
                  // The same t-derived value that eases the ring's stroke
                  // width also carries its opacity: 1 at the move's
                  // start, 0 once `_moveAnimation` settles (and already 0
                  // immediately under reduced motion, since the
                  // controller jumps straight to its end value there —
                  // see `didUpdateWidget`), so the changed/merged-cell
                  // highlight fades out instead of sticking around for
                  // the rest of the session.
                  final movePulse = 1 - _moveAnimation.value;
                  return CustomPaint(
                    painter: MergeRelayBoardPainter(
                      board: board,
                      theme: widget.theme,
                      changedCells: presentation?.changedCells ?? const {},
                      mergedCells: presentation?.mergedCells ?? const {},
                      spawnedCell: presentation?.spawnedCell,
                      pulse: movePulse,
                      highContrast: widget.game.preferences.value.highContrast,
                      frame: mergeRelayMoveFrameAt(_moveAnimation.value),
                      direction: presentation?.direction,
                      shakeOffsetPx: mergeRelayShakeOffsetAt(
                        _shakeAnimation.value,
                      ),
                      celebrationCell: presentation?.bestTileCell,
                      celebrationProgress: _celebrationAnimation.value,
                      highlightAlpha: movePulse,
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _swipeEnd(DragEndDetails details) {
    final direction = _swipe.finish(velocity: details.velocity.pixelsPerSecond);
    if (direction != null) _handleMove(direction);
  }
}

MergeDirection? mergeDirectionForVelocity(Offset velocity) =>
    velocity.distance >= mergeFlingVelocity
    ? directionForDelta(velocity)
    : null;
