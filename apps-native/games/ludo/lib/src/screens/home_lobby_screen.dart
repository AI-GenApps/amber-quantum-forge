/// The home lobby (task 08): the post-onboarding landing screen with four
/// entry cards matching Ludo King's structure per
/// `.agents/resources/2026-09-19/ludo-reference/study.md` — Computer, Pass N
/// Play, Play with Friends, Online.
///
/// Computer and Pass N Play are enabled and route to task 09's mode/setup
/// sheet, then to the game board screen with the chosen local config. Play
/// with Friends and Online are visibly and semantically disabled with a
/// "coming soon" badge and no tap action, since real online play is not
/// wired until task 26 — this screen must never let a tap on those two
/// tiles silently do nothing while looking tappable.
///
/// No King Pass/subscription offer, coin/diamond purchase prompt, or ad of
/// any kind appears here, matching task 07's product decision.
library;

import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart' show LudoColor;

import '../state/ludo_local_save.dart';
import '../state/ludo_sound_settings.dart';
import '../telemetry/ludo_telemetry.dart';
import '../widgets/ludo_avatar.dart' show LudoAvatarMotif, ludoAvatars;
import 'game_board_screen.dart';
import 'mode_setup_sheet.dart';

const _minTapTarget = 48.0;

/// Builds the seat identities a freshly-started local match shows on its
/// player panels: seat 0 is always "You" (the local human), a bot seat is
/// labeled "Bot N", and any other human seat (Pass N Play) is labeled
/// "Player N". Real onboarding-profile name/avatar wiring for seat 0 is a
/// later task's concern (this screen has no profile dependency).
List<LudoSeatIdentity> _defaultSeatIdentities(LudoLocalMatchConfig config) {
  return [
    for (var seat = 0; seat < config.seats.length; seat++)
      LudoSeatIdentity(
        name: seat == 0
            ? 'You'
            : (config.seats[seat].isBot ? 'Bot $seat' : 'Player ${seat + 1}'),
        avatarId: _avatarIdForColor(config.seats[seat].color),
      ),
  ];
}

/// The stable "-face" avatar id for [color] (always present — every
/// [LudoColor] has both a face and spark motif in [ludoAvatars]).
String _avatarIdForColor(LudoColor color) => ludoAvatars
    .firstWhere(
      (avatar) => avatar.color == color && avatar.motif == LudoAvatarMotif.face,
    )
    .id;

/// Opens [ModeSetupSheet] for [isComputerMatch] and, once a config is
/// chosen, pushes [GameBoardScreen] with it. A cancelled sheet (`null`
/// result) navigates nowhere.
Future<void> startLudoLocalMatch(
  BuildContext context, {
  required bool isComputerMatch,
  LudoTelemetry? telemetry,
  int? diceSeed,
}) async {
  final config = await ModeSetupSheet.show(
    context,
    isComputerMatch: isComputerMatch,
  );
  if (config == null || !context.mounted) return;
  (telemetry ?? LudoTelemetry()).matchStarted(
    variant: config.isComputerMatch
        ? LudoMatchVariant.vsComputer
        : LudoMatchVariant.passAndPlay,
    ruleset: config.ruleset.id,
    seatCount: config.playerCount,
  );
  await Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => GameBoardScreen(
        config: config,
        seatIdentities: _defaultSeatIdentities(config),
        soundSettings: LudoSoundSettings(),
        telemetry: telemetry,
        diceSeed: diceSeed,
      ),
    ),
  );
}

/// The kind of local match a [LudoResumableMatchSummary] describes.
enum LudoResumableMatchMode {
  /// A match against the local computer/bot opponent(s).
  computer,

  /// A local pass-and-play match (multiple humans sharing one device).
  passAndPlay,
}

/// A summary of an in-progress local match to resume, shown by the home
/// lobby's resume affordance instead of (or alongside) the four entry
/// cards.
///
/// This is only an integration point for task 11's real save/restore
/// mechanism: this task defines the shape and renders it when supplied,
/// but never constructs one itself (the lobby's default is `null`, i.e. no
/// resumable match).
final class LudoResumableMatchSummary {
  const LudoResumableMatchSummary({
    required this.mode,
    required this.description,
  });

  /// Which local mode the in-progress match was started in.
  final LudoResumableMatchMode mode;

  /// A short human-readable summary shown on the resume card, e.g.
  /// "Classic - 2 players - Turn 5".
  final String description;
}

/// The four home lobby entry cards, plus (task 11) a resume affordance for
/// an in-progress local match.
class HomeLobbyScreen extends StatefulWidget {
  const HomeLobbyScreen({
    super.key,
    this.resumableMatch,
    this.onResume,
    this.onPlayComputer,
    this.onPlayPassAndPlay,
    this.localSave,
    this.telemetry,
    this.diceSeed,
  });

  /// Test seam: a summary to show the resume affordance for, bypassing this
  /// screen's own load from [localSave] entirely. `null` (the default) in
  /// production, where the screen loads whatever `ludo_local_save.dart` has
  /// saved (if anything) on init instead.
  final LudoResumableMatchSummary? resumableMatch;

  /// Test seam: overrides tapping the resume affordance. `null` (the
  /// default) in production, where a tap instead pushes [GameBoardScreen]
  /// with the loaded save's state/config/identities.
  final VoidCallback? onResume;

  /// Invoked when the Computer card is tapped. Defaults to a no-op
  /// placeholder push until task 09's mode/setup sheet exists.
  final VoidCallback? onPlayComputer;

  /// Invoked when the Pass N Play card is tapped. Defaults to a no-op
  /// placeholder push until task 09's mode/setup sheet exists.
  final VoidCallback? onPlayPassAndPlay;

  /// Test seam: the save this screen loads a resumable match from when
  /// [resumableMatch] is not explicitly supplied. `null` (the default)
  /// resolves the production save (`LudoLocalSave.production`) lazily.
  final LudoLocalSave? localSave;

  /// Test seam: the telemetry sink `ludo_match_started` records through
  /// (and forwards to the pushed `GameBoardScreen`). `null` (the default)
  /// resolves a fresh production [LudoTelemetry].
  final LudoTelemetry? telemetry;

  /// Test seam: forwarded to `startLudoLocalMatch`'s pushed
  /// `GameBoardScreen` when the Computer/Pass N Play tiles use their
  /// default (non-overridden) navigation. `null` (the default) in
  /// production, where the dice source seeds itself from the current time.
  final int? diceSeed;

  @override
  State<HomeLobbyScreen> createState() => _HomeLobbyScreenState();
}

class _HomeLobbyScreenState extends State<HomeLobbyScreen> {
  LudoLocalSave? _resolvedSave;
  LudoLocalMatchSave? _loadedMatch;

  @override
  void initState() {
    super.initState();
    if (widget.resumableMatch == null) {
      _loadSavedMatch();
    }
  }

  Future<void> _loadSavedMatch() async {
    final save = widget.localSave ?? await LudoLocalSave.production();
    final loaded = await save.load();
    if (!mounted) return;
    setState(() {
      _resolvedSave = save;
      _loadedMatch = loaded;
    });
  }

  /// The summary to show, if any: [widget.resumableMatch] when explicitly
  /// supplied (test seam), otherwise derived from whatever
  /// [_loadSavedMatch] loaded.
  LudoResumableMatchSummary? get _summary {
    if (widget.resumableMatch != null) return widget.resumableMatch;
    final loaded = _loadedMatch;
    if (loaded == null) return null;
    return LudoResumableMatchSummary(
      mode: loaded.config.isComputerMatch
          ? LudoResumableMatchMode.computer
          : LudoResumableMatchMode.passAndPlay,
      description:
          '${loaded.config.ruleset.id} - '
          '${loaded.config.playerCount} players',
    );
  }

  void _handleResume() {
    if (widget.onResume != null) {
      widget.onResume!();
      return;
    }
    final loaded = _loadedMatch;
    final save = _resolvedSave;
    if (loaded == null || save == null) return;
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => GameBoardScreen(
          config: loaded.config,
          seatIdentities: loaded.seatIdentities,
          soundSettings: LudoSoundSettings(),
          initialState: loaded.state,
          localSave: save,
          telemetry: widget.telemetry,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final summary = _summary;
    return Scaffold(
      appBar: AppBar(title: const Text('Ludo')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (summary != null) ...[
              _ResumeCard(summary: summary, onTap: _handleResume),
              const SizedBox(height: 16),
            ],
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.1,
              children: [
                _LobbyCard(
                  title: 'Computer',
                  subtitle: 'Play locally vs. the bot',
                  icon: Icons.smart_toy_outlined,
                  enabled: true,
                  onTap:
                      widget.onPlayComputer ??
                      () => startLudoLocalMatch(
                        context,
                        isComputerMatch: true,
                        telemetry: widget.telemetry,
                        diceSeed: widget.diceSeed,
                      ),
                ),
                _LobbyCard(
                  title: 'Pass N Play',
                  subtitle: 'Share this device, take turns',
                  icon: Icons.people_alt_outlined,
                  enabled: true,
                  onTap:
                      widget.onPlayPassAndPlay ??
                      () => startLudoLocalMatch(
                        context,
                        isComputerMatch: false,
                        telemetry: widget.telemetry,
                        diceSeed: widget.diceSeed,
                      ),
                ),
                const _LobbyCard(
                  title: 'Play with Friends',
                  subtitle: 'Not available yet',
                  icon: Icons.group_add_outlined,
                  enabled: false,
                ),
                const _LobbyCard(
                  title: 'Online',
                  subtitle: 'Not available yet',
                  icon: Icons.public_outlined,
                  enabled: false,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// The resume-in-progress affordance shown above the four entry cards when
/// a [LudoResumableMatchSummary] is supplied.
class _ResumeCard extends StatelessWidget {
  const _ResumeCard({required this.summary, this.onTap});

  final LudoResumableMatchSummary summary;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final modeLabel = switch (summary.mode) {
      LudoResumableMatchMode.computer => 'Computer match',
      LudoResumableMatchMode.passAndPlay => 'Pass N Play match',
    };
    return Semantics(
      button: true,
      label: 'Resume $modeLabel: ${summary.description}',
      excludeSemantics: true,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: _minTapTarget),
        child: Card(
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Icon(Icons.play_circle_outline, size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Resume $modeLabel',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        Text(
                          summary.description,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// One of the four home lobby entry cards, enabled or disabled.
class _LobbyCard extends StatelessWidget {
  const _LobbyCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.enabled,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final bool enabled;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final semanticsLabel = enabled ? title : '$title, coming soon, unavailable';

    return Semantics(
      button: enabled,
      enabled: enabled,
      label: semanticsLabel,
      excludeSemantics: true,
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          minWidth: _minTapTarget,
          minHeight: _minTapTarget,
        ),
        child: Opacity(
          opacity: enabled ? 1.0 : 0.5,
          child: Card(
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              // Disabled tiles get no tap handler at all (not merely a
              // dimmed color) so no navigation can ever be triggered.
              onTap: enabled ? onTap : null,
              child: Stack(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          icon,
                          size: 32,
                          color: enabled
                              ? colorScheme.primary
                              : colorScheme.onSurfaceVariant,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          title,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          subtitle,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  if (!enabled)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          'Coming soon',
                          style: Theme.of(context).textTheme.labelSmall,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
