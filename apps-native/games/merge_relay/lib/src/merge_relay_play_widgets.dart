import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_app.dart';
import 'merge_relay_models.dart';
import 'merge_relay_theme.dart';
import 'merge_relay_overlays.dart';

final class MergeRelayHeader extends StatelessWidget {
  const MergeRelayHeader({required this.game, required this.theme, super.key});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    final rescue = game.content.rescues.firstWhere(
      (item) => item.id == game.rescueId.value,
      orElse: () => game.content.firstRescue,
    );
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DecoratedBox(
          decoration: BoxDecoration(
            color: theme.ink,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Padding(
            padding: const EdgeInsets.all(11),
            child: Icon(Icons.alt_route, color: theme.paper, size: 25),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'MERGE RELAY',
                style: TextStyle(
                  color: theme.muted,
                  fontSize: 11,
                  fontFamily: 'Fredoka',
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.6,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                game.mode.value == MergeRelayMode.rescue
                    ? rescue.title
                    : game.mode.value.label,
                style: TextStyle(
                  color: theme.ink,
                  fontSize: 28,
                  fontFamily: 'Fredoka',
                  fontWeight: FontWeight.w900,
                  height: 1.05,
                  letterSpacing: -0.7,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                game.mode.value == MergeRelayMode.rescue
                    ? rescue.subtitle
                    : _modeSubtitle(game.mode.value),
                style: TextStyle(color: theme.muted, fontSize: 15),
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: () => showMergeRelaySettings(context, game, theme),
          tooltip: 'Settings',
          icon: Icon(Icons.tune, color: theme.ink),
        ),
      ],
    );
  }

  static String _modeSubtitle(MergeRelayMode mode) {
    return switch (mode) {
      MergeRelayMode.daily => 'A fresh board for today.',
      MergeRelayMode.endless => 'Keep the chain alive.',
      MergeRelayMode.rescue => '',
    };
  }
}

final class MergeRelayModeRail extends StatelessWidget {
  const MergeRelayModeRail({
    required this.game,
    required this.theme,
    super.key,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: MergeRelayMode.values
            .map((mode) {
              final selected = game.mode.value == mode;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  selected: selected,
                  label: Text(mode.label),
                  onSelected: selected ? null : (_) => _select(context, mode),
                  selectedColor: theme.ink,
                  labelStyle: TextStyle(
                    color: selected ? theme.paper : theme.ink,
                    fontWeight: FontWeight.w800,
                  ),
                  side: BorderSide(color: theme.ink.withValues(alpha: 0.18)),
                  backgroundColor: theme.paper.withValues(alpha: 0.6),
                ),
              );
            })
            .toList(growable: false),
      ),
    );
  }

  Future<void> _select(BuildContext context, MergeRelayMode mode) async {
    if (game.state.value.moveCount > 0 && !game.roundComplete.value) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Switch board?'),
          content: Text(
            'Start ${mode.label.toLowerCase()} and replace this board?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Keep board'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Switch'),
            ),
          ],
        ),
      );
      if (confirmed != true) return;
    }
    switch (mode) {
      case MergeRelayMode.rescue:
        game.startRescue();
      case MergeRelayMode.daily:
        game.startDaily();
      case MergeRelayMode.endless:
        game.startEndless();
    }
  }
}

final class MergeRelayScoreStrip extends StatelessWidget {
  const MergeRelayScoreStrip({
    required this.game,
    required this.theme,
    this.compact = false,
    super.key,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final highest = game.state.value.board.cells.fold<int>(
      0,
      (max, value) => value > max ? value : max,
    );
    final budget = game.movesRemaining;
    return Row(
      children: [
        _Score(
          label: 'Score',
          value: '${game.state.value.score}',
          theme: theme,
          compact: compact,
        ),
        const SizedBox(width: 8),
        _Score(
          label: 'Best',
          value: '$highest',
          theme: theme,
          compact: compact,
        ),
        const SizedBox(width: 8),
        _Score(
          label: budget == null ? 'Moves' : 'Moves left',
          value: budget == null ? '${game.state.value.moveCount}' : '$budget',
          theme: theme,
          accent: budget == 0 ? theme.coral : theme.blue,
          compact: compact,
        ),
      ],
    );
  }
}

final class _Score extends StatelessWidget {
  const _Score({
    required this.label,
    required this.value,
    required this.theme,
    required this.compact,
    this.accent,
  });

  final String label;
  final String value;
  final MergeRelayTheme theme;
  final bool compact;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: EdgeInsets.fromLTRB(
          compact ? 8 : 12,
          compact ? 5 : 9,
          compact ? 8 : 12,
          compact ? 6 : 10,
        ),
        decoration: BoxDecoration(
          color: theme.paper.withValues(alpha: 0.72),
          borderRadius: BorderRadius.circular(15),
          border: Border.all(
            color: (accent ?? theme.ink).withValues(alpha: 0.18),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                color: accent ?? theme.muted,
                fontSize: compact ? 9 : 10,
                fontFamily: 'Fredoka',
                fontWeight: FontWeight.w900,
                letterSpacing: 0.9,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              value,
              style: TextStyle(
                color: theme.ink,
                fontSize: compact ? 16 : 22,
                fontFamily: 'Fredoka',
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
