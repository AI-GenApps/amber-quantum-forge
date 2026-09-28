import 'package:flutter/material.dart';

import '../merge_relay_theme.dart';
import '../ui/mr_background.dart';
import '../ui/mr_icon_button.dart';
import '../ui/mr_panel.dart';
import '../ui/mr_tokens.dart';

/// The always-reachable how-to-play page (task 12): pushed from Settings'
/// "How to play" button via the ambient `Navigator` (Settings itself is a
/// modal bottom sheet, not a `MergeRelayRoute`, so this follows the same
/// pattern rather than adding a new top-level route). Three short
/// code-drawn cards — swipe, merge, goal and move budget — plus one line
/// each for Daily and Endless.
final class MergeRelayHowToPlay extends StatelessWidget {
  const MergeRelayHowToPlay({required this.theme, super.key});

  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: theme.paper,
      body: MrBackground(
        theme: theme,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    MrIconButton(
                      icon: Icons.arrow_back_rounded,
                      tooltip: 'Back',
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'How to play',
                      style: TextStyle(
                        color: theme.ink,
                        fontFamily: 'Fredoka',
                        fontWeight: FontWeight.w900,
                        fontSize: 22,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Expanded(
                  // The same "fill or scroll" idiom as the welcome screen
                  // and the interactive tutorial step: floors the column at
                  // the full remaining height so short content doesn't
                  // leave one flat empty band, but still scrolls rather
                  // than overflowing on a compact/large-text viewport.
                  child: LayoutBuilder(
                    builder: (context, outer) => SingleChildScrollView(
                      child: ConstrainedBox(
                        constraints: BoxConstraints(minHeight: outer.maxHeight),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _HowToCard(
                              theme: theme,
                              title: 'Swipe to slide',
                              body:
                                  'Swipe in any direction and every tile on the '
                                  'board slides that way.',
                              mini: _MiniBoardSwipe(theme: theme),
                            ),
                            const SizedBox(height: 14),
                            _HowToCard(
                              theme: theme,
                              title: 'Merge matching tiles',
                              body:
                                  'Two tiles carrying the same number combine '
                                  'into the next tile up.',
                              mini: const _MiniBoardMerge(),
                            ),
                            const SizedBox(height: 14),
                            _HowToCard(
                              theme: theme,
                              title: 'Beat the goal before moves run out',
                              body:
                                  'Each Rescue board sets a target score and a '
                                  'move budget — reach the target before the '
                                  'budget runs out.',
                              mini: _MiniBoardGoal(theme: theme),
                            ),
                            const SizedBox(height: 18),
                            Text(
                              'Daily is one fresh three-move puzzle every day.',
                              style: TextStyle(
                                color: theme.muted,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Endless has no target — keep merging for the '
                              'highest score you can reach.',
                              style: TextStyle(
                                color: theme.muted,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

final class _HowToCard extends StatelessWidget {
  const _HowToCard({
    required this.theme,
    required this.title,
    required this.body,
    required this.mini,
  });

  final MergeRelayTheme theme;
  final String title;
  final String body;
  final Widget mini;

  @override
  Widget build(BuildContext context) {
    return MrPanel(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          mini,
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: theme.ink,
                    fontFamily: 'Fredoka',
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  body,
                  style: TextStyle(
                    color: theme.muted,
                    fontSize: 13,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// A small flat tile chip — simpler than the real board's painted tiles
/// (task 08's `MergeRelayBoardPainter`), since these cards only need to
/// gesture at the mechanic, not reproduce the board art.
final class _MiniTile extends StatelessWidget {
  const _MiniTile({required this.value});

  final int value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 24,
      height: 24,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: MrTokens.tileColorFor(value),
        borderRadius: BorderRadius.circular(7),
      ),
      child: Text(
        '$value',
        // Fixed at 1x: these are small decorative chips inside a
        // fixed-size card illustration, not primary reading text — like
        // the real board's own canvas-painted numerals, they shouldn't
        // grow with the system text scale and blow out this compact row's
        // width (task 12's responsive check at 1.3x text surfaced this).
        textScaler: TextScaler.noScaling,
        style: TextStyle(
          color: MrTokens.tileNumeralColorFor(value),
          fontFamily: 'Fredoka',
          fontWeight: FontWeight.w800,
          fontSize: 11,
        ),
      ),
    );
  }
}

final class _MiniBoardSwipe extends StatelessWidget {
  const _MiniBoardSwipe({required this.theme});

  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 84,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _MiniTile(value: 2),
              _MiniTile(value: 4),
              _MiniTile(value: 2),
            ],
          ),
          const SizedBox(height: 6),
          Icon(Icons.arrow_back_rounded, color: theme.muted, size: 18),
        ],
      ),
    );
  }
}

final class _MiniBoardMerge extends StatelessWidget {
  const _MiniBoardMerge();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      width: 128,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _MiniTile(value: 4),
          SizedBox(width: 4),
          Icon(Icons.add_rounded, size: 12, color: MrTokens.ink),
          SizedBox(width: 4),
          _MiniTile(value: 4),
          SizedBox(width: 6),
          Icon(Icons.arrow_forward_rounded, size: 12, color: MrTokens.ink),
          SizedBox(width: 6),
          _MiniTile(value: 8),
        ],
      ),
    );
  }
}

final class _MiniBoardGoal extends StatelessWidget {
  const _MiniBoardGoal({required this.theme});

  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 76,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const _MiniTile(value: 16),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.flag_rounded, color: theme.coral, size: 14),
              const SizedBox(width: 4),
              Text(
                '3 moves',
                style: TextStyle(
                  color: theme.muted,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
