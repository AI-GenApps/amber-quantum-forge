import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_app.dart';
import 'merge_relay_theme.dart';

/// Height reserved for the Play screen's status row ("Chain +4", "Board
/// shifted."). The row always occupies exactly this much space — whether a
/// message is showing or not — so the board below it never moves when a
/// message appears or clears (device-QA defect D3: the row used to be a
/// 20 px placeholder that grew to about 24 px with a message, jolting the
/// board and the tray on every merge).
const double mergeFeedbackRowHeight = 20;

/// The status message itself. It is sized to fit inside
/// [mergeFeedbackRowHeight] (one line, no outer padding) so it can never
/// push its neighbours around.
final class MergeFeedback extends StatelessWidget {
  const MergeFeedback({required this.text, required this.theme, super.key});

  final String text;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: mergeFeedbackRowHeight,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.bolt_rounded, color: theme.coral, size: 18),
          const SizedBox(width: 5),
          Flexible(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: theme.ink,
                fontWeight: FontWeight.w800,
                height: 1.2,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

final class MergeMoveControls extends StatelessWidget {
  const MergeMoveControls({
    required this.game,
    required this.enabled,
    required this.theme,
    super.key,
  });

  final MergeRelayGame game;
  final bool enabled;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      container: true,
      label: 'Accessible movement controls',
      child: Wrap(
        alignment: WrapAlignment.center,
        spacing: 6,
        runSpacing: 6,
        children: [
          _MergeMoveButton(
            label: 'Move up',
            text: 'Up',
            icon: Icons.keyboard_arrow_up_rounded,
            enabled: enabled,
            theme: theme,
            onPressed: () => _pressMove(game, MergeDirection.up),
          ),
          _MergeMoveButton(
            label: 'Move left',
            text: 'Left',
            icon: Icons.keyboard_arrow_left_rounded,
            enabled: enabled,
            theme: theme,
            onPressed: () => _pressMove(game, MergeDirection.left),
          ),
          _MergeMoveButton(
            label: 'Move right',
            text: 'Right',
            icon: Icons.keyboard_arrow_right_rounded,
            enabled: enabled,
            theme: theme,
            onPressed: () => _pressMove(game, MergeDirection.right),
          ),
          _MergeMoveButton(
            label: 'Move down',
            text: 'Down',
            icon: Icons.keyboard_arrow_down_rounded,
            enabled: enabled,
            theme: theme,
            onPressed: () => _pressMove(game, MergeDirection.down),
          ),
        ],
      ),
    );
  }
}

/// A selection-click haptic before the move itself — these buttons are a
/// discrete tap, not a swipe, so they get the "selection click on
/// buttons" haptic rather than the swipe's "light on slide".
void _pressMove(MergeRelayGame game, MergeDirection direction) {
  game.hapticSelect();
  game.move(direction);
}

final class _MergeMoveButton extends StatelessWidget {
  const _MergeMoveButton({
    required this.label,
    required this.text,
    required this.icon,
    required this.enabled,
    required this.theme,
    required this.onPressed,
  });

  final String label;
  final String text;
  final IconData icon;
  final bool enabled;
  final MergeRelayTheme theme;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: label,
      child: Semantics(
        button: true,
        label: label,
        child: SizedBox(
          height: 42,
          child: OutlinedButton.icon(
            onPressed: enabled ? onPressed : null,
            icon: Icon(icon, size: 18),
            label: Text(text),
            style: OutlinedButton.styleFrom(
              foregroundColor: theme.ink,
              side: BorderSide(color: theme.ink.withValues(alpha: 0.24)),
              padding: const EdgeInsets.symmetric(horizontal: 13),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(13),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
