import 'package:flutter/services.dart';
import 'package:flutter/material.dart';

import 'merge_relay_board_painter.dart';
import 'merge_relay_relay_share.dart';
import 'merge_relay_theme.dart';
import 'network/merge_relay_models.dart';

final class MergeRelaySharePanel extends StatelessWidget {
  const MergeRelaySharePanel({
    required this.challenge,
    required this.payload,
    required this.theme,
    required this.onShare,
    required this.onCopy,
    required this.onHome,
    this.message,
    this.onReplay,
    this.replayLabel,
    super.key,
  });

  final MergeRelayChallenge challenge;
  final MergeRelaySharePayload payload;
  final MergeRelayTheme theme;
  final VoidCallback onShare;
  final VoidCallback onCopy;
  final VoidCallback onHome;
  final VoidCallback? onReplay;
  final String? replayLabel;
  final String? message;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _title(),
          const SizedBox(height: 14),
          SizedBox.square(
            dimension: _boardSize(context),
            child: CustomPaint(
              painter: MergeRelayBoardPainter(
                board: challenge.checkpoint.state.board,
                theme: theme,
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'Three moves. Pass the board back when you are done.',
            textAlign: TextAlign.center,
            style: TextStyle(color: theme.muted, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 14),
          SelectableText(
            payload.code,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: theme.ink,
              fontSize: 20,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 10),
          FilledButton.icon(
            onPressed: onShare,
            icon: const Icon(Icons.ios_share_rounded),
            label: const Text('Open share sheet'),
          ),
          OutlinedButton.icon(
            onPressed: onCopy,
            icon: const Icon(Icons.copy_rounded),
            label: const Text('Copy challenge code'),
          ),
          if (onReplay != null) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: onReplay,
              icon: const Icon(Icons.replay_rounded),
              label: Text(replayLabel ?? 'Verify replay'),
            ),
          ],
          if (message != null) ...[
            const SizedBox(height: 8),
            Text(
              message!,
              textAlign: TextAlign.center,
              style: TextStyle(color: theme.muted, fontSize: 12),
            ),
          ],
          const SizedBox(height: 8),
          TextButton(onPressed: onHome, child: const Text('Home')),
        ],
      ),
    );
  }

  Widget _title() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        'Your relay is ready',
        style: TextStyle(
          color: theme.ink,
          fontSize: 28,
          fontWeight: FontWeight.w900,
        ),
      ),
      Text(
        'Hand this board to a friend.',
        style: TextStyle(color: theme.muted, fontSize: 14),
      ),
    ],
  );

  double _boardSize(BuildContext context) =>
      (MediaQuery.sizeOf(context).width - 32).clamp(180, 420).toDouble();

  static Future<void> copyCode(MergeRelaySharePayload payload) =>
      Clipboard.setData(ClipboardData(text: payload.code));
}
