import 'package:flutter/material.dart';

import 'merge_relay_app.dart';
import 'merge_relay_theme.dart';
import 'platform/merge_relay_pgs_account.dart';
import 'screens/merge_relay_how_to_play.dart';
import 'ui/mr_button.dart';
import 'ui/mr_tokens.dart';

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
                  fontFamily: 'Fredoka',
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 10),
              _MrSwitchRow(
                theme: theme,
                title: 'Board controls',
                subtitle: 'Tap to move instead of swiping.',
                value: game.preferences.value.accessibleControls,
                onChanged: (value) {
                  game.hapticSelect();
                  game.setAccessibleControls(value);
                },
              ),
              _MrSwitchRow(
                theme: theme,
                title: 'Reduce motion',
                subtitle: 'Use calmer tile transitions.',
                value: game.preferences.value.reducedMotion,
                onChanged: (value) {
                  game.hapticSelect();
                  game.setReducedMotion(value);
                },
              ),
              _MrSwitchRow(
                theme: theme,
                title: 'High contrast',
                subtitle: 'Firmer tile and slot outlines.',
                value: game.preferences.value.highContrast,
                onChanged: (value) {
                  game.hapticSelect();
                  game.setHighContrast(value);
                },
              ),
              _MrSwitchRow(
                theme: theme,
                title: 'Sound',
                value: game.preferences.value.audioEnabled,
                onChanged: (value) {
                  game.hapticSelect();
                  game.setAudioEnabled(value);
                },
              ),
              _MrSwitchRow(
                theme: theme,
                title: 'Music',
                value: game.preferences.value.musicEnabled,
                onChanged: (value) {
                  game.hapticSelect();
                  game.setMusicEnabled(value);
                },
              ),
              _MrSwitchRow(
                theme: theme,
                title: 'Vibration',
                value: game.preferences.value.hapticsEnabled,
                onChanged: (value) {
                  game.hapticSelect();
                  game.setHapticsEnabled(value);
                },
              ),
              if (game.features.socialEnabled &&
                  game.tutorialComplete.value &&
                  game.pgsAccountController != null)
                _PgsSettings(game: game, theme: theme),
              const SizedBox(height: 6),
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
              const SizedBox(height: 16),
              MrButton(
                label: 'Replay tutorial',
                icon: Icons.school_rounded,
                variant: MrButtonVariant.secondary,
                onPressed: () {
                  Navigator.pop(context);
                  game.replayTutorial();
                },
              ),
              const SizedBox(height: 8),
              MrButton(
                label: 'How to play',
                icon: Icons.menu_book_rounded,
                variant: MrButtonVariant.secondary,
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => MergeRelayHowToPlay(theme: theme),
                    ),
                  );
                },
              ),
              const SizedBox(height: 4),
              // The Settings version line (task 11's checklist item) reads
              // the loaded content catalog's own version tag — there's no
              // `package_info_plus` (or similar) dependency wired up to read
              // the app's own build number, and adding one is out of this
              // task's scope — so this is the most honest "version" this
              // screen has on hand, and it does track what's actually
              // shipped, unlike a hand-typed constant.
              Text(
                'Content ${game.content.contentVersion}',
                textAlign: TextAlign.center,
                style: TextStyle(color: theme.muted, fontSize: 11),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

/// Replaces the stock `SwitchListTile.adaptive` (task 11): the same title +
/// optional subtitle + trailing switch shape, but without Material's
/// list-tile ambient ink/ripple and dense-list padding.
final class _MrSwitchRow extends StatelessWidget {
  const _MrSwitchRow({
    required this.theme,
    required this.title,
    required this.value,
    required this.onChanged,
    this.subtitle,
  });

  final MergeRelayTheme theme;
  final String title;
  final String? subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: theme.ink,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (subtitle != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      subtitle!,
                      style: TextStyle(color: theme.muted, fontSize: 12),
                    ),
                  ),
              ],
            ),
          ),
          Switch.adaptive(
            value: value,
            onChanged: onChanged,
            activeThumbColor: theme.ink,
          ),
        ],
      ),
    );
  }
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
            MrButton(
              label: accountState.isBusy ? 'Connecting…' : 'Link progress',
              icon: Icons.account_circle_outlined,
              variant: MrButtonVariant.secondary,
              onPressed: accountState.isBusy ? null : game.linkPlayGames,
            ),
          ],
          if (showActions) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: MrButton(
                    label: 'Achievements',
                    variant: MrButtonVariant.secondary,
                    onPressed: game.showPlayGamesAchievements,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: MrButton(
                    label: 'Leaderboard',
                    variant: MrButtonVariant.secondary,
                    onPressed: game.showPlayGamesLeaderboards,
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
    final foreground = selected ? theme.paper : theme.ink;
    return Semantics(
      button: true,
      selected: selected,
      label: label,
      child: GestureDetector(
        onTap: onTap,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: selected ? theme.ink : MrTokens.paper,
            borderRadius: BorderRadius.circular(MrTokens.radiusPill),
            border: Border.all(
              color: theme.ink.withValues(alpha: selected ? 0 : 0.4),
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircleAvatar(backgroundColor: theme.blue, radius: 7),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: TextStyle(
                    fontFamily: 'Fredoka',
                    color: foreground,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (selected) ...[
                  const SizedBox(width: 6),
                  Icon(Icons.check_rounded, size: 16, color: foreground),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
