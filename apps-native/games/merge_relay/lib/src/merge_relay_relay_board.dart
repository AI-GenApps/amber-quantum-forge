part of 'merge_relay_relay_screen.dart';

final class _RelayBoard extends StatefulWidget {
  const _RelayBoard({required this.state, required this.theme, this.onMove});

  final MergeGameState state;
  final MergeRelayTheme theme;
  final ValueChanged<MergeDirection>? onMove;

  @override
  State<_RelayBoard> createState() => _RelayBoardState();
}

final class _RelayBoardState extends State<_RelayBoard> {
  final _swipe = MergeSwipeAccumulator();

  @override
  Widget build(BuildContext context) {
    final board = widget.state.board;
    return mergeRelayAccessibleBoard(
      board: board,
      label: mergeRelayBoardLabel(board, prefix: 'Relay board'),
      customActions: widget.onMove == null
          ? const {}
          : {
              CustomSemanticsAction(label: 'Move up'): () =>
                  widget.onMove?.call(MergeDirection.up),
              CustomSemanticsAction(label: 'Move left'): () =>
                  widget.onMove?.call(MergeDirection.left),
              CustomSemanticsAction(label: 'Move right'): () =>
                  widget.onMove?.call(MergeDirection.right),
              CustomSemanticsAction(label: 'Move down'): () =>
                  widget.onMove?.call(MergeDirection.down),
            },
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onPanStart: widget.onMove == null ? null : (_) => _swipe.start(),
        onPanUpdate: widget.onMove == null
            ? null
            : (details) => _swipe.update(details.delta),
        onPanCancel: _swipe.cancel,
        onPanEnd: widget.onMove == null ? null : _swipeEnd,
        child: AspectRatio(
          aspectRatio: 1,
          child: CustomPaint(
            painter: MergeRelayBoardPainter(board: board, theme: widget.theme),
          ),
        ),
      ),
    );
  }

  void _swipeEnd(DragEndDetails details) {
    final direction = _swipe.finish(velocity: details.velocity.pixelsPerSecond);
    if (direction != null) widget.onMove?.call(direction);
  }
}
