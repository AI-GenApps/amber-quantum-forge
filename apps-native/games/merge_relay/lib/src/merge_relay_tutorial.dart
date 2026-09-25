import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_app.dart';
import 'merge_relay_board_painter.dart';
import 'merge_relay_gesture.dart';
import 'merge_relay_models.dart';
import 'merge_relay_theme.dart';

final class MergeRelayTutorialSession {
  MergeRelayTutorialSession._({
    required this.state,
    required this.presentation,
    required this.complete,
  });

  factory MergeRelayTutorialSession.initial() => MergeRelayTutorialSession._(
    state: MergeGameState(
      board: MergeBoard([2, 2, ...List<int>.filled(14, 0)]),
      score: 0,
      moveCount: 0,
      seed: 0x747574,
      rngState: 123,
    ),
    presentation: null,
    complete: false,
  );

  final MergeGameState state;
  final MergeMovePresentation? presentation;
  final bool complete;

  MergeRelayTutorialSession attempt(MergeDirection direction) {
    if (complete || direction != MergeDirection.left) return this;
    final result = const MergeRules().apply(state, direction);
    if (!result.changed || result.scoreDelta == 0) return this;
    return MergeRelayTutorialSession._(
      state: result.state,
      presentation: MergeMovePresentation.fromResult(
        before: state,
        result: result,
        direction: direction,
      ),
      complete: true,
    );
  }
}

final class MergeRelayTutorial extends StatefulWidget {
  const MergeRelayTutorial({
    required this.game,
    required this.theme,
    super.key,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  State<MergeRelayTutorial> createState() => _MergeRelayTutorialState();
}

final class _MergeRelayTutorialState extends State<MergeRelayTutorial> {
  var _session = MergeRelayTutorialSession.initial();
  final _swipe = MergeSwipeAccumulator();

  int get _step => _session.complete ? 1 : 0;

  @override
  Widget build(BuildContext context) {
    final palette = widget.theme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(Icons.alt_route_rounded, color: palette.ink),
                const SizedBox(width: 9),
                Expanded(
                  child: Text(
                    'First handoff',
                    style: TextStyle(
                      color: palette.ink,
                      fontSize: 20,
                      fontFamily: 'Fredoka',
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () => widget.game.completeTutorial(skipped: true),
                  child: const Text('Skip'),
                ),
              ],
            ),
            const SizedBox(height: 28),
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ConstrainedBox(
                      constraints: const BoxConstraints(
                        maxWidth: 340,
                        maxHeight: 210,
                      ),
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onPanStart: _step == 0 ? (_) => _swipe.start() : null,
                        onPanUpdate: _step == 0
                            ? (details) => _swipe.update(details.delta)
                            : null,
                        onPanCancel: _swipe.cancel,
                        onPanEnd: _step == 0 ? _handleSwipe : null,
                        child: Semantics(
                          customSemanticsActions: _step == 0
                              ? {
                                  CustomSemanticsAction(
                                    label: 'Merge the pair left',
                                  ): () =>
                                      _attempt(MergeDirection.left),
                                }
                              : const {},
                          child: _TutorialBoard(
                            theme: palette,
                            board: _session.state.board,
                            presentation: _session.presentation,
                            highContrast:
                                widget.game.preferences.value.highContrast,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      _step == 0
                          ? 'Slide the pair left.'
                          : 'That merge made room.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: palette.ink,
                        fontSize: 24,
                        height: 1.06,
                        fontFamily: 'Fredoka',
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _step == 0
                          ? 'One clean merge opens the lane.'
                          : 'The lane is open. Your rescue starts now.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: palette.muted,
                        fontSize: 15,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 18),
            if (_step == 0 && widget.game.preferences.value.accessibleControls)
              OutlinedButton.icon(
                onPressed: () => _attempt(MergeDirection.left),
                icon: const Icon(Icons.keyboard_arrow_left_rounded),
                label: const Text('Move left'),
              ),
            if (_step == 1)
              Semantics(
                button: true,
                label: 'Start rescue',
                child: FilledButton.icon(
                  onPressed: () => widget.game.completeTutorial(skipped: false),
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: const Text('Start rescue'),
                  style: FilledButton.styleFrom(
                    backgroundColor: palette.ink,
                    foregroundColor: palette.paper,
                    minimumSize: const Size.fromHeight(54),
                  ),
                ),
              ),
            const SizedBox(height: 12),
            Center(
              child: Text(
                '${_step + 1} of 2',
                style: TextStyle(
                  color: palette.muted,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleSwipe(DragEndDetails details) {
    final direction = _swipe.finish(velocity: details.velocity.pixelsPerSecond);
    if (direction != null) _attempt(direction);
  }

  void _attempt(MergeDirection direction) {
    final next = _session.attempt(direction);
    if (!identical(next, _session)) setState(() => _session = next);
  }
}

final class _TutorialBoard extends StatelessWidget {
  const _TutorialBoard({
    required this.theme,
    required this.board,
    required this.presentation,
    this.highContrast = false,
  });

  final MergeRelayTheme theme;
  final MergeBoard board;
  final MergeMovePresentation? presentation;
  final bool highContrast;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 1,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: theme.board,
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
              color: theme.ink.withValues(alpha: 0.2),
              blurRadius: 22,
              offset: const Offset(0, 12),
            ),
          ],
        ),
        child: CustomPaint(
          painter: MergeRelayBoardPainter(
            board: board,
            theme: theme,
            changedCells: presentation?.changedCells ?? const {},
            mergedCells: presentation?.mergedCells ?? const {},
            spawnedCell: presentation?.spawnedCell,
            highContrast: highContrast,
          ),
        ),
      ),
    );
  }
}
