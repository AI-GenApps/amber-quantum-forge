import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_app.dart';
import 'merge_relay_board_accessibility.dart';
import 'merge_relay_board_painter.dart';
import 'merge_relay_gesture.dart';
import 'merge_relay_models.dart';
import 'merge_relay_theme.dart';

final class MergeRelayBoard extends StatefulWidget {
  const MergeRelayBoard({required this.game, required this.theme, super.key});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  State<MergeRelayBoard> createState() => _MergeRelayBoardState();
}

final class _MergeRelayBoardState extends State<MergeRelayBoard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animation;
  final _swipe = MergeSwipeAccumulator();
  MergeMovePresentation? _presentation;

  @override
  void initState() {
    super.initState();
    _animation = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 240),
      value: 1,
    );
    _presentation = widget.game.presentation.value;
  }

  @override
  void didUpdateWidget(covariant MergeRelayBoard oldWidget) {
    super.didUpdateWidget(oldWidget);
    final next = widget.game.presentation.value;
    if (!identical(next, _presentation)) {
      _presentation = next;
      if (widget.game.preferences.value.reducedMotion || next == null) {
        _animation.value = 1;
      } else {
        _animation.forward(from: 0);
      }
    }
  }

  @override
  void dispose() {
    _animation.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final board = widget.game.state.value.board;
    return mergeRelayAccessibleBoard(
      board: board,
      label: mergeRelayBoardLabel(board),
      customActions: {
        CustomSemanticsAction(label: 'Move up'): () =>
            widget.game.move(MergeDirection.up),
        CustomSemanticsAction(label: 'Move left'): () =>
            widget.game.move(MergeDirection.left),
        CustomSemanticsAction(label: 'Move right'): () =>
            widget.game.move(MergeDirection.right),
        CustomSemanticsAction(label: 'Move down'): () =>
            widget.game.move(MergeDirection.down),
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
                animation: _animation,
                builder: (context, _) {
                  final presentation = _presentation;
                  return CustomPaint(
                    painter: MergeRelayBoardPainter(
                      board: board,
                      theme: widget.theme,
                      changedCells: presentation?.changedCells ?? const {},
                      mergedCells: presentation?.mergedCells ?? const {},
                      spawnedCell: presentation?.spawnedCell,
                      pulse: 1 - _animation.value,
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
    if (direction != null) widget.game.move(direction);
  }
}

MergeDirection? mergeDirectionForVelocity(Offset velocity) =>
    velocity.distance >= mergeFlingVelocity
    ? directionForDelta(velocity)
    : null;
