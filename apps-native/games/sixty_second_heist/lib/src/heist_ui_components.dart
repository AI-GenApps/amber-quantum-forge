import 'package:flutter/material.dart';
import 'package:heist_rules/heist_rules.dart';

import 'heist_app.dart';
import 'heist_board_painter.dart';

const _heistInk = Color(0xff0d2238);
const _heistCoral = Color(0xff9a3732);

final class HeistBlueprint extends StatelessWidget {
  const HeistBlueprint({required this.game, required this.enabled, super.key});

  final HeistGame game;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.center,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 360),
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: _heistInk,
            borderRadius: BorderRadius.circular(28),
            boxShadow: const [
              BoxShadow(
                color: Color(0x1f0d2238),
                blurRadius: 18,
                offset: Offset(0, 9),
              ),
            ],
          ),
          child: IgnorePointer(
            ignoring: !enabled,
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SizedBox.square(
                  dimension: constraints.maxWidth,
                  child: CustomPaint(painter: HeistBoardPainter(game: game)),
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

final class HeistRouteStrip extends StatelessWidget {
  const HeistRouteStrip({required this.actions, super.key});

  final List<HeistAction> actions;

  @override
  Widget build(BuildContext context) {
    if (actions.isEmpty) {
      return const Text(
        'Plot a path to the loot, then the exit.',
        style: TextStyle(color: Color(0xff5f7284), fontSize: 13),
      );
    }
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (var index = 0; index < actions.length; index += 1)
            Padding(
              padding: const EdgeInsets.only(right: 6),
              child: Chip(
                label: Text('${index + 1}  ${_actionLabel(actions[index])}'),
                backgroundColor: const Color(0xffd8ecea),
                side: BorderSide.none,
                labelStyle: const TextStyle(
                  color: _heistInk,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

final class HeistNotice extends StatelessWidget {
  const HeistNotice({required this.message, super.key});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        message,
        style: const TextStyle(color: _heistCoral, fontWeight: FontWeight.w700),
      ),
    );
  }
}

final class HeistHint extends StatelessWidget {
  const HeistHint({required this.outcome, required this.ready, super.key});

  final HeistOutcome? outcome;
  final bool ready;

  @override
  Widget build(BuildContext context) {
    final text = !ready
        ? 'Opening the vault…'
        : outcome == null
        ? 'Grab the loot, then reach the exit. Watch the hazards.'
        : outcome!.succeeded
        ? 'Clean escape. Clear the plan to try another route.'
        : switch (outcome!.status) {
            HeistOutcomeStatus.timeout =>
              'Time ran out. Clear the plan and try again.',
            HeistOutcomeStatus.invalid =>
              'That route is blocked. Clear the plan and try again.',
            _ => 'Spotted. Clear the plan and try again.',
          };
    return Text(
      text,
      textAlign: TextAlign.center,
      style: const TextStyle(color: Color(0xff5f7284), fontSize: 13),
    );
  }
}

String _actionLabel(HeistAction action) => switch (action.type) {
  HeistActionType.up => 'UP',
  HeistActionType.down => 'DOWN',
  HeistActionType.left => 'LEFT',
  HeistActionType.right => 'RIGHT',
  HeistActionType.wait => 'WAIT',
};
