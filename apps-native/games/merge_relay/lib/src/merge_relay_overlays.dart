import 'package:flutter/material.dart';

import 'merge_relay_app.dart';
import 'merge_relay_theme.dart';
import 'platform/merge_relay_pgs_account.dart';

Future<void> showMergeRelaySettings(
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
            game.preferences,
            game.playGamesState,
            game.tutorialComplete,
            if (game.pgsAccountController != null)
              game.pgsAccountController!.state,
          ]),
          builder: (context, _) => Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Settings',
                style: TextStyle(
                  color: theme.ink,
                  fontSize: 23,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 12),
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                title: const Text('Board controls'),
                subtitle: const Text('Tap to move instead of swiping.'),
                value: game.preferences.value.accessibleControls,
                onChanged: game.setAccessibleControls,
              ),
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                title: const Text('Reduce motion'),
                subtitle: const Text('Use calmer tile transitions.'),
                value: game.preferences.value.reducedMotion,
                onChanged: game.setReducedMotion,
              ),
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                title: const Text('Sound'),
                value: game.preferences.value.audioEnabled,
                onChanged: game.setAudioEnabled,
              ),
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                title: const Text('Haptics'),
                value: game.preferences.value.hapticsEnabled,
                onChanged: game.setHapticsEnabled,
              ),
              if (game.tutorialComplete.value &&
                  game.pgsAccountController != null)
                _PgsSettings(game: game, theme: theme),
              const SizedBox(height: 8),
              Text(
                'Choose a palette',
                style: TextStyle(
                  color: theme.muted,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  _ThemeChoice(
                    label: 'Signal',
                    selected: game.preferences.value.themeId == 'signal',
                    theme: signalRelayTheme,
                    onTap: () => game.selectTheme('signal'),
                  ),
                  _ThemeChoice(
                    label: 'Ember',
                    selected: game.preferences.value.themeId == 'ember',
                    theme: emberRelayTheme,
                    onTap: () => game.selectTheme('ember'),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              OutlinedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  game.replayTutorial();
                },
                icon: const Icon(Icons.school_rounded),
                label: const Text('Replay handoff guide'),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

final class _PgsSettings extends StatelessWidget {
  const _PgsSettings({required this.game, required this.theme});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    final account = game.pgsAccountController!;
    final accountState = account.state.value;
    if (accountState.phase == MergeRelayPgsAccountPhase.idle ||
        accountState.phase == MergeRelayPgsAccountPhase.loading) {
      return const Padding(
        padding: EdgeInsets.only(top: 8),
        child: Text('Checking Play Games…'),
      );
    }
    if (accountState.phase == MergeRelayPgsAccountPhase.unavailable) {
      return Padding(
        padding: const EdgeInsets.only(top: 8),
        child: Text(
          'Play Games unavailable',
          style: TextStyle(color: theme.muted, fontSize: 12),
        ),
      );
    }
    final nativeLabel = game.playGamesState.value.isAuthenticated
        ? 'Play Games signed in'
        : 'Play Games not signed in';
    final linkLabel = switch (accountState.phase) {
      MergeRelayPgsAccountPhase.linked => 'Progress linked',
      MergeRelayPgsAccountPhase.unlinked => 'Progress not linked',
      MergeRelayPgsAccountPhase.reauthorizationRequired =>
        'Sign in again to link progress',
      MergeRelayPgsAccountPhase.revoked => 'Progress link revoked',
      MergeRelayPgsAccountPhase.offline => 'Progress link needs a connection',
      MergeRelayPgsAccountPhase.conflict => 'Progress link needs attention',
      MergeRelayPgsAccountPhase.cancelled => 'Sign-in canceled',
      MergeRelayPgsAccountPhase.declined => 'Sign-in declined',
      MergeRelayPgsAccountPhase.error => 'Progress link unavailable',
      MergeRelayPgsAccountPhase.unavailable => 'Progress link unavailable',
      MergeRelayPgsAccountPhase.idle ||
      MergeRelayPgsAccountPhase.loading ||
      MergeRelayPgsAccountPhase.linking => 'Checking progress link',
    };
    final showActions = game.canShowPlayGamesActions;
    final showLink = accountState.phase != MergeRelayPgsAccountPhase.linked;
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Play Games',
            style: TextStyle(color: theme.ink, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          Text(nativeLabel, style: TextStyle(color: theme.muted, fontSize: 12)),
          Text(linkLabel, style: TextStyle(color: theme.muted, fontSize: 12)),
          if (showLink) ...[
            const SizedBox(height: 6),
            OutlinedButton.icon(
              onPressed: accountState.isBusy ? null : game.linkPlayGames,
              icon: const Icon(Icons.account_circle_outlined),
              label: Text(
                accountState.isBusy ? 'Connecting…' : 'Link progress',
              ),
            ),
          ],
          if (showActions) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: game.showPlayGamesAchievements,
                    child: const Text('Achievements'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: game.showPlayGamesLeaderboards,
                    child: const Text('Leaderboard'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

final class _ThemeChoice extends StatelessWidget {
  const _ThemeChoice({
    required this.label,
    required this.selected,
    required this.theme,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final MergeRelayTheme theme;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      selected: selected,
      label: Text(label),
      onSelected: (_) => onTap(),
      avatar: CircleAvatar(backgroundColor: theme.blue, radius: 8),
    );
  }
}
