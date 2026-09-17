import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_app.dart';
import 'merge_relay_board_painter.dart';
import 'merge_relay_controls.dart';

const _relayInk = Color(0xff10243e);
const _relayPaper = Color(0xffedf5fb);
const _relayBlue = Color(0xff3e75b6);
const _relayCoral = Color(0xffa53b36);

final class MergeRelayScreen extends StatelessWidget {
  const MergeRelayScreen({required this.game, super.key});

  final MergeRelayGame game;

  @override
  Widget build(BuildContext context) {
    final motion = MediaQuery.disableAnimationsOf(context)
        ? Duration.zero
        : const Duration(milliseconds: 220);
    return Scaffold(
      backgroundColor: _relayPaper,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - 42,
                ),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 620),
                    child: ListenableBuilder(
                      listenable: Listenable.merge([
                        game.state,
                        game.hydrated,
                        game.persistenceMessage,
                        game.feedback,
                      ]),
                      builder: (context, _) {
                        final state = game.state.value;
                        final ready = game.hydrated.value;
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _RelayHeader(state: state),
                            const SizedBox(height: 18),
                            _RelayStats(state: state),
                            const SizedBox(height: 14),
                            AnimatedSwitcher(
                              duration: motion,
                              child: game.feedback.value == null
                                  ? const SizedBox(height: 30)
                                  : MergeFeedback(text: game.feedback.value!),
                            ),
                            if (game.persistenceMessage.value
                                case final String message)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: Text(
                                  message,
                                  style: const TextStyle(
                                    color: _relayCoral,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            _BoardFrame(game: game, enabled: ready),
                            const SizedBox(height: 16),
                            MergeMoveControls(game: game, enabled: ready),
                            const SizedBox(height: 10),
                            MergeRelayFooter(game: game, state: state),
                          ],
                        );
                      },
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

final class _RelayHeader extends StatelessWidget {
  const _RelayHeader({required this.state});

  final MergeGameState state;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            DecoratedBox(
              decoration: BoxDecoration(
                color: _relayInk,
                borderRadius: BorderRadius.circular(7),
              ),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                child: Text(
                  'ROUND 1',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.4,
                  ),
                ),
              ),
            ),
            const Spacer(),
            Text(
              '${state.moveCount} moves',
              style: const TextStyle(
                color: _relayBlue,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        const Text(
          'Merge Relay',
          style: TextStyle(
            color: _relayInk,
            fontSize: 36,
            fontWeight: FontWeight.w900,
            height: 1,
            letterSpacing: -1.2,
          ),
        ),
        const SizedBox(height: 7),
        Text(
          state.isTerminal
              ? 'The relay is locked. Start a new board to keep moving.'
              : 'Build a clean chain before the board locks.',
          style: const TextStyle(color: Color(0xff52677d), fontSize: 16),
        ),
      ],
    );
  }
}

final class _RelayStats extends StatelessWidget {
  const _RelayStats({required this.state});

  final MergeGameState state;

  @override
  Widget build(BuildContext context) {
    final highest = state.board.cells.fold<int>(
      0,
      (max, value) => value > max ? value : max,
    );
    return Row(
      children: [
        _Stat(label: 'SCORE', value: '${state.score}', accent: _relayCoral),
        const SizedBox(width: 10),
        _Stat(label: 'BEST TILE', value: '$highest', accent: _relayBlue),
        const SizedBox(width: 10),
        const _Stat(label: 'TARGET TILE', value: '64', accent: _relayInk),
      ],
    );
  }
}

final class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value, required this.accent});

  final String label;
  final String value;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.fromLTRB(13, 10, 13, 11),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.68),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: accent.withValues(alpha: 0.22)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                color: accent,
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              value,
              style: const TextStyle(
                color: _relayInk,
                fontSize: 22,
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

final class _BoardFrame extends StatelessWidget {
  const _BoardFrame({required this.game, required this.enabled});

  final MergeRelayGame game;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: _relayInk,
        borderRadius: BorderRadius.circular(30),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1f10243e),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onPanEnd: enabled
            ? (details) => _swipe(details.velocity.pixelsPerSecond)
            : null,
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SizedBox.square(
              dimension: constraints.maxWidth,
              child: CustomPaint(
                painter: MergeRelayBoardPainter(board: game.state.value.board),
              ),
            );
          },
        ),
      ),
    );
  }

  void _swipe(Offset velocity) {
    if (velocity.distance < 180) return;
    if (velocity.dx.abs() > velocity.dy.abs()) {
      game.move(velocity.dx > 0 ? MergeDirection.right : MergeDirection.left);
    } else {
      game.move(velocity.dy > 0 ? MergeDirection.down : MergeDirection.up);
    }
  }
}
