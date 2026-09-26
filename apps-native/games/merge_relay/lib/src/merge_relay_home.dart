import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';

import 'assets/merge_relay_art_manifest.dart';
import 'merge_relay_app.dart';
import 'merge_relay_campaign_progress_panel.dart';
import 'merge_relay_chapter_strip.dart';
import 'merge_relay_models.dart';
import 'merge_relay_overlays.dart';
import 'merge_relay_theme.dart';
import 'ui/mr_button.dart';
import 'ui/mr_icon_button.dart';
import 'ui/mr_panel.dart';
import 'ui/mr_tokens.dart';

part 'merge_relay_home_art.dart';
part 'merge_relay_home_widgets.dart';

/// Merge Relay's Home screen (restyled task 11): a wordmark header, a hero
/// scene with the primary Continue/Play action, a Rescue-progress row that
/// opens the chapter map, a Daily/Endless pair, and a campaign-progress
/// footer — composed so no band of the screen reads as flat empty
/// background (the audit's headline failure; see the task's
/// Context/Decisions).
final class MergeRelayHome extends StatelessWidget {
  const MergeRelayHome({required this.game, required this.theme, super.key});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    final total = game.content.rescues.length;
    final cleared = game.completedRescueIds.value.length;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _HomeHeader(game: game, theme: theme),
          if (game.restoreFailed.value) ...[
            const SizedBox(height: 12),
            _RestoreFailure(game: game, theme: theme),
          ],
          const SizedBox(height: 16),
          _HomeHero(game: game, theme: theme),
          if (game.legacyOffer.value) ...[
            const SizedBox(height: 14),
            _LegacyOffer(game: game, theme: theme),
          ],
          const SizedBox(height: 16),
          _RescueAction(
            game: game,
            theme: theme,
            cleared: cleared,
            total: total,
          ),
          if (game.features.socialEnabled && game.relayController != null) ...[
            const SizedBox(height: 10),
            _RelayAction(game: game, theme: theme),
          ],
          const SizedBox(height: 10),
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: _DailyCard(
                    game: game,
                    theme: theme,
                    result: game.todaysDailyResult,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _EndlessCard(game: game, theme: theme),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          MergeRelayCampaignProgressPanel(
            theme: theme,
            cleared: cleared,
            total: total,
          ),
          const SizedBox(height: 12),
          MergeRelayChapterStrip(game: game, theme: theme),
        ],
      ),
    );
  }
}
