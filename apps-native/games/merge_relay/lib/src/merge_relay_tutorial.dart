import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_app.dart';
import 'merge_relay_board_painter.dart';
import 'merge_relay_gesture.dart';
import 'merge_relay_models.dart';
import 'merge_relay_theme.dart';
import 'screens/merge_relay_welcome.dart';

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

  /// Shows the first-run [MergeRelayWelcome] step ahead of the interactive
  /// board — gated on the game's own tutorial-complete flag (task 12), the
  /// same flag "Replay tutorial" in Settings flips once onboarding is done,
  /// so a real replay skips straight to the interactive step below. Read
  /// once at construction: dismissing it only flips this instance's local
  /// state, not the game's `tutorialComplete` (that only becomes true once
  /// the whole tutorial finishes or is skipped).
  late bool _showWelcome = !widget.game.tutorialComplete.value;

  int get _step => _session.complete ? 1 : 0;

  @override
  Widget build(BuildContext context) {
    final palette = widget.theme;
    if (_showWelcome) {
      return MergeRelayWelcome(
        theme: palette,
        onContinue: () => setState(() => _showWelcome = false),
        onSkip: () => widget.game.completeTutorial(skipped: true),
      );
    }
    // Fixes the task's known empty-band bug: the old bare
    // `Padding > SingleChildScrollView > Column` left whatever vertical
    // space the (short) content didn't use as one flat blank strip below
    // the footer. `ConstrainedBox(minHeight: ...)` floors the column at the
    // full viewport height, and `MainAxisAlignment.spaceBetween` (safe with
    // an unbounded scroll-axis max, unlike `Expanded`/`Spacer`) spreads any
    // slack evenly across the existing gaps instead.
    return LayoutBuilder(
      builder: (context, outer) => SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minHeight: (outer.maxHeight - 42).clamp(0, double.infinity),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Icon(Icons.alt_route_rounded, color: palette.ink),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Text(
                      'First merge',
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
                    onPressed: () =>
                        widget.game.completeTutorial(skipped: true),
                    child: const Text('Skip'),
                  ),
                ],
              ),
              Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Stack(
                        alignment: Alignment.center,
                        children: [
                          ConstrainedBox(
                            // A big, near-full-width square — matching the
                            // real Play board's own sizing
                            // (`merge_relay_play_screen.dart`) rather than
                            // the old cramped 340x210 box, so the demo board
                            // itself fills most of the screen's middle
                            // instead of leaving a large flat gap below it
                            // (the task's known empty-band bug).
                            constraints: const BoxConstraints(maxWidth: 400),
                            child: GestureDetector(
                              behavior: HitTestBehavior.opaque,
                              onPanStart: _step == 0
                                  ? (_) => _swipe.start()
                                  : null,
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
                                  highContrast: widget
                                      .game
                                      .preferences
                                      .value
                                      .highContrast,
                                ),
                              ),
                            ),
                          ),
                          // The animated swipe-hand hint (task 12): purely
                          // decorative, `IgnorePointer`-wrapped so it never
                          // steals the swipe gesture above, shown only on the
                          // interactive step and only when motion isn't
                          // reduced — see `_SwipeHandHint`'s doc comment for
                          // why every test reaching this step must pump a
                          // fixed duration instead of `pumpAndSettle`.
                          if (_step == 0 &&
                              !widget.game.preferences.value.reducedMotion)
                            IgnorePointer(
                              child: _SwipeHandHint(color: palette.ink),
                            ),
                        ],
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
              // One combined bottom block (task 12 fix round): keeping the
              // optional button + footer as a single flex child, instead of
              // separate `SizedBox`/conditional-widget siblings, means
              // there's exactly one gap above it and one below the header —
              // two gaps for `MainAxisAlignment.spaceBetween` to split the
              // slack across, not several that can sit next to each other
              // (an omitted conditional widget leaving two spacer
              // `SizedBox`es adjacent) and read as one much larger blank
              // band than any single gap should be.
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_step == 0 &&
                      widget.game.preferences.value.accessibleControls) ...[
                    OutlinedButton.icon(
                      onPressed: () => _attempt(MergeDirection.left),
                      icon: const Icon(Icons.keyboard_arrow_left_rounded),
                      label: const Text('Move left'),
                    ),
                    const SizedBox(height: 12),
                  ],
                  if (_step == 1) ...[
                    Semantics(
                      button: true,
                      label: 'Start rescue',
                      child: FilledButton.icon(
                        onPressed: () =>
                            widget.game.completeTutorial(skipped: false),
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
                  ],
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
            ],
          ),
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

/// A looping "swipe left" nudge over the tutorial board's interactive step
/// (task 12). Purely decorative motion, so it owns its own
/// `AnimationController` rather than the shared `merge_relay_motion.dart`
/// choreography, and it's only ever included in the tree on `_step == 0`
/// with `reducedMotion` off — see the `if` in `_MergeRelayTutorialState`'s
/// `build`. Removing it from the tree disposes the controller, so a test
/// that reaches step 1 (or skips motion) never has a repeating animation
/// left running; a test that stays on step 0 must reach it with a bare
/// `pump()`/`pump(duration)` rather than `pumpAndSettle`, which would never
/// see the animation settle.
final class _SwipeHandHint extends StatefulWidget {
  const _SwipeHandHint({required this.color});

  final Color color;

  @override
  State<_SwipeHandHint> createState() => _SwipeHandHintState();
}

final class _SwipeHandHintState extends State<_SwipeHandHint>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final t = Curves.easeInOut.transform(_controller.value);
        return Transform.translate(
          offset: Offset(-34 * t, 30),
          child: Opacity(opacity: 1 - (t * 0.55), child: child),
        );
      },
      child: Icon(Icons.touch_app_rounded, color: widget.color, size: 34),
    );
  }
}
