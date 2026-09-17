import 'package:flutter/material.dart';
import 'package:heist_rules/heist_rules.dart';

import 'heist_app.dart';

const _heistInk = Color(0xff0d2238);
const _heistCoral = Color(0xff9a3732);

final class HeistControls extends StatelessWidget {
  const HeistControls({required this.game, required this.enabled, super.key});

  final HeistGame game;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Wrap(
          alignment: WrapAlignment.center,
          spacing: 6,
          runSpacing: 6,
          children: [
            _ActionButton(
              label: 'Plan up',
              text: 'Up',
              icon: Icons.keyboard_arrow_up,
              enabled: enabled,
              onPressed: () => game.addAction(HeistActionType.up),
            ),
            _ActionButton(
              label: 'Wait',
              text: 'Wait',
              icon: Icons.pause,
              enabled: enabled,
              onPressed: () => game.addAction(HeistActionType.wait),
            ),
            _ActionButton(
              label: 'Plan down',
              text: 'Down',
              icon: Icons.keyboard_arrow_down,
              enabled: enabled,
              onPressed: () => game.addAction(HeistActionType.down),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          alignment: WrapAlignment.center,
          spacing: 6,
          runSpacing: 6,
          children: [
            _ActionButton(
              label: 'Plan left',
              text: 'Left',
              icon: Icons.keyboard_arrow_left,
              enabled: enabled,
              onPressed: () => game.addAction(HeistActionType.left),
            ),
            _ActionButton(
              label: 'Plan right',
              text: 'Right',
              icon: Icons.keyboard_arrow_right,
              enabled: enabled,
              onPressed: () => game.addAction(HeistActionType.right),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: enabled ? game.reset : null,
                icon: const Icon(Icons.restart_alt),
                label: const Text('Clear plan'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: _heistCoral,
                  minimumSize: const Size.fromHeight(50),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: FilledButton.icon(
                onPressed: enabled ? game.runPlan : null,
                icon: const Icon(Icons.play_arrow),
                label: const Text('Run plan'),
                style: FilledButton.styleFrom(
                  backgroundColor: _heistCoral,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(50),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

final class _ActionButton extends StatelessWidget {
  const _ActionButton({
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
        child: OutlinedButton.icon(
          onPressed: enabled ? onPressed : null,
          icon: Icon(icon, size: 19),
          label: Text(text),
          style: OutlinedButton.styleFrom(
            foregroundColor: _heistInk,
            side: const BorderSide(color: Color(0x332b6f9d)),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(13),
            ),
            minimumSize: const Size(80, 46),
            padding: const EdgeInsets.symmetric(horizontal: 8),
          ),
        ),
      ),
    );
  }
}
