import 'package:flutter/material.dart';

import 'merge_relay_app.dart';
import 'merge_relay_overlays.dart';
import 'merge_relay_theme.dart';

Future<void> showMergeRelayProfile(
  BuildContext context,
  MergeRelayGame game,
  MergeRelayTheme theme,
) {
  return showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (context) => SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 22),
        child: ListenableBuilder(
          listenable: Listenable.merge([
            game.completedRescueIds,
            game.bestEndlessScore,
            game.playGamesState,
            game.pgsAccountController!.state,
          ]),
          builder: (context, _) => Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Profile',
                style: TextStyle(
                  color: theme.ink,
                  fontSize: 23,
                  fontFamily: 'Fredoka',
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                '${game.completedRescueIds.value.length} of '
                '${game.content.rescues.length} rescues cleared',
                style: TextStyle(color: theme.ink),
              ),
              Text(
                'Best Endless ${game.bestEndlessScore.value}',
                style: TextStyle(color: theme.ink),
              ),
              MergeRelayPgsSettings(game: game, theme: theme),
            ],
          ),
        ),
      ),
    ),
  );
}
