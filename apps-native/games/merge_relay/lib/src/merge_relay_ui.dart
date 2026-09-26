import 'package:flutter/material.dart';

import 'merge_relay_app.dart';
import 'merge_relay_home.dart';
import 'merge_relay_models.dart';
import 'merge_relay_play_screen.dart';
import 'merge_relay_relay_screen.dart';
import 'merge_relay_theme.dart';
import 'merge_relay_tutorial.dart';
import 'screens/merge_relay_chapter_map.dart';
import 'ui/mr_background.dart';

final class MergeRelayScreen extends StatelessWidget {
  const MergeRelayScreen({required this.game, super.key});

  final MergeRelayGame game;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Listenable.merge([
        game.route,
        game.state,
        game.hydrated,
        game.persistenceMessage,
        game.feedback,
        game.mode,
        game.rescueId,
        game.preferences,
        game.presentation,
        game.result,
        game.tutorialComplete,
        game.hasSavedSession,
        game.legacyOffer,
        game.isPaused,
        game.completedRescueIds,
        game.bestEndlessScore,
        game.roundComplete,
        game.playGamesState,
        game.restoreFailed,
      ]),
      builder: (context, _) {
        final theme = relayThemeFor(game.preferences.value.themeId);
        return PopScope<void>(
          canPop:
              game.hydrated.value && game.route.value == MergeRelayRoute.home,
          onPopInvokedWithResult: (didPop, _) {
            if (!didPop) game.handleSystemBack();
          },
          child: Scaffold(
            backgroundColor: theme.paper,
            // `MrBackground` is applied here — the single wrapper shared by
            // every route (home, tutorial, play, result, relay) — so the
            // new brand background reaches all of them without touching
            // each screen's own layout (that per-screen restyle is
            // task 11); see the task 07 Context/Decisions note on
            // applying the theme globally.
            body: MrBackground(
              theme: theme,
              child: SafeArea(
                child: LayoutBuilder(
                  builder: (context, constraints) =>
                      _body(context, constraints, theme),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _body(
    BuildContext context,
    BoxConstraints constraints,
    MergeRelayTheme theme,
  ) {
    final width = constraints.maxWidth.clamp(0, 680).toDouble();
    return Align(
      alignment: Alignment.topCenter,
      child: SizedBox(
        width: width,
        height: constraints.maxHeight,
        child: switch (game.route.value) {
          MergeRelayRoute.home => MergeRelayHome(game: game, theme: theme),
          MergeRelayRoute.chapterMap => MergeRelayChapterMap(
            game: game,
            theme: theme,
          ),
          MergeRelayRoute.tutorial => MergeRelayTutorial(
            game: game,
            theme: theme,
          ),
          MergeRelayRoute.play => MergeRelayPlayScreen(
            game: game,
            theme: theme,
          ),
          MergeRelayRoute.result => MergeRelayResultScreen(
            game: game,
            theme: theme,
          ),
          MergeRelayRoute.relay => MergeRelayRelayScreen(
            game: game,
            theme: theme,
            controller: game.relayController!,
          ),
        },
      ),
    );
  }
}
