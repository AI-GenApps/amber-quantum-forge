import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_app.dart';

const _relayControlsInk = Color(0xff10243e);
const _relayControlsCoral = Color(0xffa53b36);

final class MergeFeedback extends StatelessWidget {
  const MergeFeedback({required this.text, super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          const Icon(Icons.bolt, color: _relayControlsCoral, size: 18),
          const SizedBox(width: 6),
          Text(
            text,
            style: const TextStyle(
              color: _relayControlsInk,
              fontWeight: FontWeight.w700,
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
    super.key,
  });

  final MergeRelayGame game;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _MergeMoveButton(
          label: 'Move up',
          text: 'Up',
          icon: Icons.keyboard_arrow_up,
          enabled: enabled,
          onPressed: () => game.move(MergeDirection.up),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _MergeMoveButton(
              label: 'Move left',
              text: 'Left',
              icon: Icons.keyboard_arrow_left,
              enabled: enabled,
              onPressed: () => game.move(MergeDirection.left),
            ),
            const SizedBox(width: 8),
            _MergeMoveButton(
              label: 'Move right',
              text: 'Right',
              icon: Icons.keyboard_arrow_right,
              enabled: enabled,
              onPressed: () => game.move(MergeDirection.right),
            ),
          ],
        ),
        const SizedBox(height: 8),
        _MergeMoveButton(
          label: 'Move down',
          text: 'Down',
          icon: Icons.keyboard_arrow_down,
          enabled: enabled,
          onPressed: () => game.move(MergeDirection.down),
        ),
      ],
    );
  }
}

final class _MergeMoveButton extends StatelessWidget {
  const _MergeMoveButton({
    required this.label,
    required this.text,
    required this.icon,
    required this.enabled,
    required this.onPressed,
  });

  final String label;
  final String text;
  final IconData icon;
  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: label,
      child: Semantics(
        button: true,
        label: label,
        child: SizedBox(
          width: 122,
          height: 48,
          child: OutlinedButton.icon(
            onPressed: enabled ? onPressed : null,
            icon: Icon(icon, size: 20),
            label: Text(text),
            style: OutlinedButton.styleFrom(
              foregroundColor: _relayControlsInk,
              side: const BorderSide(color: Color(0x3310243e)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

final class MergeRelayFooter extends StatelessWidget {
  const MergeRelayFooter({required this.game, required this.state, super.key});

  final MergeRelayGame game;
  final MergeGameState state;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            state.isTerminal
                ? 'No legal moves left.'
                : 'Swipe the board or use the controls.',
            style: const TextStyle(color: Color(0xff52677d), fontSize: 13),
          ),
        ),
        TextButton.icon(
          onPressed: game.hydrated.value ? () => _confirm(context) : null,
          icon: const Icon(Icons.refresh, size: 18),
          label: const Text('New relay'),
          style: TextButton.styleFrom(foregroundColor: _relayControlsCoral),
        ),
      ],
    );
  }

  Future<void> _confirm(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Start a new relay?'),
        content: const Text(
          'Your current board will be replaced with a fresh relay.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep board'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('New relay'),
          ),
        ],
      ),
    );
    if (confirmed == true) game.newRound();
  }
}
