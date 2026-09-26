import 'package:flutter/material.dart';

import 'merge_relay_theme.dart';
import 'ui/mr_panel.dart';
import 'ui/mr_tokens.dart';

/// A small panel summarizing the full 60-board campaign as a proportional
/// bar (task 11) — shared by Home's footer and the Result screen's "keep
/// going" footer, so both fill their lower area with something composed
/// rather than a bare sentence sitting in open background.
final class MergeRelayCampaignProgressPanel extends StatelessWidget {
  const MergeRelayCampaignProgressPanel({
    required this.theme,
    required this.cleared,
    required this.total,
    super.key,
  });

  final MergeRelayTheme theme;
  final int cleared;
  final int total;

  @override
  Widget build(BuildContext context) {
    final fraction = total == 0 ? 0.0 : (cleared / total).clamp(0.0, 1.0);
    return MrPanel(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      border: Border.all(color: theme.ink.withValues(alpha: 0.1)),
      shadow: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Campaign progress',
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: theme.ink,
                    fontFamily: 'Fredoka',
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '$cleared / $total',
                style: TextStyle(
                  color: theme.muted,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(MrTokens.radiusPill),
            child: LayoutBuilder(
              builder: (context, constraints) => Stack(
                children: [
                  Container(height: 10, color: MrTokens.paperMuted),
                  Container(
                    height: 10,
                    width: constraints.maxWidth * fraction,
                    color: theme.blue,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
