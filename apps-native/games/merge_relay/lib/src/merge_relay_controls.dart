import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_app.dart';
import 'merge_relay_theme.dart';

final class MergeFeedback extends StatelessWidget {
  const MergeFeedback({required this.text, required this.theme, super.key});

  final String text;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.bolt_rounded, color: theme.coral, size: 18),
          const SizedBox(width: 5),
          Flexible(
            child: Text(
              text,
              textAlign: TextAlign.center,
              style: TextStyle(color: theme.ink, fontWeight: FontWeight.w800),
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
            onPressed: () => game.move(MergeDirection.up),
          ),
          _MergeMoveButton(
            label: 'Move left',
            text: 'Left',
            icon: Icons.keyboard_arrow_left_rounded,
            enabled: enabled,
            theme: theme,
            onPressed: () => game.move(MergeDirection.left),
          ),
          _MergeMoveButton(
            label: 'Move right',
            text: 'Right',
            icon: Icons.keyboard_arrow_right_rounded,
            enabled: enabled,
            theme: theme,
            onPressed: () => game.move(MergeDirection.right),
          ),
          _MergeMoveButton(
            label: 'Move down',
            text: 'Down',
            icon: Icons.keyboard_arrow_down_rounded,
            enabled: enabled,
            theme: theme,
            onPressed: () => game.move(MergeDirection.down),
          ),
        ],
      ),
    );
  }
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
