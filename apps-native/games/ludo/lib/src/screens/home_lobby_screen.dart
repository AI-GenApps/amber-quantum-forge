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

import '../app.dart' show ludoIdentity;
import '../assets/ludo_art_manifest.dart' show LudoArtManifest, LudoArtSlot;
import '../state/ludo_local_save.dart';
import '../state/ludo_profile_settings.dart';
import '../state/ludo_sound_settings.dart';
import '../telemetry/ludo_telemetry.dart';
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import '../widgets/ludo_avatar.dart'
    show LudoAvatarMotif, LudoAvatarView, ludoAvatars;
import '../widgets/ludo_panel.dart';
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
    this.profile,
    this.profileStore,
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

  /// Test seam: the profile identity (avatar + name) the lobby header
  /// shows, bypassing this screen's own load from [profileStore] entirely.
  /// `null` (the default) in production, where the screen loads whatever
  /// `ludo_profile_settings.dart` has saved (falling back to the generated
  /// default name/avatar if onboarding was skipped) on init instead.
  final LudoProfileSettings? profile;

  /// Test seam: the store this screen loads [profile] from when it is not
  /// explicitly supplied. `null` (the default) resolves the production
  /// store (`LudoProfileStore.production`) lazily, the same pattern
  /// `splash_screen.dart` uses.
  final LudoProfileStore? profileStore;

  @override
  State<HomeLobbyScreen> createState() => _HomeLobbyScreenState();
}

class _HomeLobbyScreenState extends State<HomeLobbyScreen> {
  LudoLocalSave? _resolvedSave;
  LudoLocalMatchSave? _loadedMatch;
  LudoProfileSettings? _loadedProfile;

  @override
  void initState() {
    super.initState();
    if (widget.resumableMatch == null) {
      _loadSavedMatch();
    }
    if (widget.profile == null) {
      _loadProfile();
    }
  }

  Future<void> _loadProfile() async {
    final store =
        widget.profileStore ?? await LudoProfileStore.production(ludoIdentity);
    final settings = LudoProfileSettings();
    await store.load(settings);
    if (!mounted) return;
    setState(() => _loadedProfile = settings);
  }

  /// The profile identity to show in the header, if any is available yet.
  LudoProfileSettings? get _profile => widget.profile ?? _loadedProfile;

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
      body: _LobbyBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            // A plain (non-scrolling) fill layout rather than a ListView:
            // the four mode tiles below are wrapped in `Expanded` so they
            // grow to occupy all remaining vertical space down to the
            // bottom of the viewport, instead of sizing to a fixed aspect
            // ratio and leaving the rest of a tall phone screen as bare
            // background. On very small viewports the fixed-height header
            // content above may not leave the tiles their full comfortable
            // size, but every element stays visible and reachable, and
            // typical phone/tablet heights are unaffected.
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.only(
                    bottom: LudoThemeTokens.spaceSm,
                  ),
                  child: Align(
                    alignment: Alignment.center,
                    child: Semantics(
                      label: ludoIdentity.publicTitle,
                      // Task 12h: ~80% of the lobby's content width,
                      // matching `mockup-a.png`/`mockup-b.png`'s scale —
                      // up from the previous fixed 200x54 (a small
                      // top-left header wordmark). `LayoutBuilder` reads
                      // the content column's actual available width so
                      // this stays correct across device sizes rather
                      // than hardcoding a pixel width.
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final width = constraints.maxWidth * 0.8;
                          return LudoArtSlot(
                            slot: LudoArtManifest.logoWideSlot,
                            fallbackPainter: LudoArtManifest.logoWide,
                            size: Size(width, width * 54 / 200),
                          );
                        },
                      ),
                    ),
                  ),
                ),
                _ProfileHeader(profile: _profile),
                const SizedBox(height: LudoThemeTokens.spaceMd),
                if (summary != null) ...[
                  _ResumeCard(summary: summary, onTap: _handleResume),
                  const SizedBox(height: 16),
                ],
                // The four mode tiles fill all remaining vertical
                // space down to the bottom of the viewport (rather
                // than sizing themselves to a fixed aspect ratio and
                // leaving the rest of a tall phone screen as bare
                // background), so the lobby never shows a single
                // dominant empty region below its content.
                Expanded(
                  child: Column(
                    children: [
                      Expanded(
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Expanded(
                              child: _LobbyCard(
                                title: 'Computer',
                                subtitle: 'Play locally vs. the bot',
                                glyph: _LobbyGlyph.computer,
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
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _LobbyCard(
                                title: 'Pass N Play',
                                subtitle: 'Share this device, take turns',
                                glyph: _LobbyGlyph.passAndPlay,
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
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Expanded(
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Expanded(
                              child: _LobbyCard(
                                title: 'Play with Friends',
                                subtitle: 'Not available yet',
                                glyph: _LobbyGlyph.friends,
                                enabled: false,
                              ),
                            ),
                            SizedBox(width: 12),
                            Expanded(
                              child: _LobbyCard(
                                title: 'Online',
                                subtitle: 'Not available yet',
                                glyph: _LobbyGlyph.online,
                                enabled: false,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
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

/// The home lobby's full-bleed background (task 12h): the user-approved
/// `bg-b.png` "vortex galaxy" art via the [LudoArtManifest] bitmap-slot
/// mechanism, covering the whole screen behind [child], falling back to
/// the same code-drawn deep-blue/gold look every other screen renders
/// (via `LudoArtManifest.lobbyBackground`) when no bitmap is bundled.
/// Sized from a [LayoutBuilder] (rather than [Size.infinite], which
/// [LudoArtSlot]'s `Image.asset` can't cover with) so [BoxFit.cover] has
/// real dimensions to fill.
class _LobbyBackground extends StatelessWidget {
  const _LobbyBackground({this.child});

  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final size = Size(constraints.maxWidth, constraints.maxHeight);
        return Stack(
          fit: StackFit.expand,
          children: [
            LudoArtSlot(
              slot: LudoArtManifest.lobbyBackgroundSlot,
              fallbackPainter: LudoArtManifest.lobbyBackground,
              size: size,
              fit: BoxFit.cover,
            ),
            ?child,
          ],
        );
      },
    );
  }
}

/// The lobby header: the player's avatar and display name, using the same
/// [LudoAvatarView] the onboarding/results screens already render identity
/// with — no second avatar presentation invented here. Shows nothing
/// (renders as an empty box) until a profile has loaded, so the lobby
/// never flashes a placeholder identity.
class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.profile});

  final LudoProfileSettings? profile;

  @override
  Widget build(BuildContext context) {
    final profile = this.profile;
    if (profile == null) return const SizedBox.shrink();
    return LudoPanel(
      padding: const EdgeInsets.symmetric(
        horizontal: LudoThemeTokens.spaceMd,
        vertical: LudoThemeTokens.spaceSm,
      ),
      child: Row(
        children: [
          LudoAvatarView(avatarId: profile.avatarId, size: 48),
          const SizedBox(width: LudoThemeTokens.spaceMd),
          Expanded(
            child: Text(
              profile.name,
              style: LudoTextStyles.displaySmall,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
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
        child: ClipRRect(
          borderRadius: BorderRadius.circular(LudoThemeTokens.radiusMd),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onTap,
              child: LudoPanel(
                child: Row(
                  children: [
                    const Icon(
                      Icons.play_circle_outline,
                      size: 32,
                      color: LudoThemeTokens.gold,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Resume $modeLabel',
                            style: LudoTextStyles.bodyStrong,
                          ),
                          Text(
                            summary.description,
                            style: LudoTextStyles.caption,
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
      ),
    );
  }
}

/// Which code-drawn glyph a [_LobbyCard] paints as its fallback (never a
/// photographic icon, matching task 08's Context/Decisions) — and, per
/// task 12h, which [LudoArtManifest] bitmap slot the card resolves art
/// through first via [LudoArtSlot].
enum _LobbyGlyph { computer, passAndPlay, friends, online }

/// The [LudoArtManifest] bitmap slot name for [_LobbyGlyph]'s tile art
/// (task 12h) — the user-approved "Style A" tile set.
extension on _LobbyGlyph {
  String get manifestSlot => switch (this) {
    _LobbyGlyph.computer => LudoArtManifest.lobbyTileComputerSlot,
    _LobbyGlyph.passAndPlay => LudoArtManifest.lobbyTilePassAndPlaySlot,
    _LobbyGlyph.friends => LudoArtManifest.lobbyTileFriendsSlot,
    _LobbyGlyph.online => LudoArtManifest.lobbyTileOnlineSlot,
  };
}

/// One of the four home lobby entry cards, enabled or disabled.
class _LobbyCard extends StatelessWidget {
  const _LobbyCard({
    required this.title,
    required this.subtitle,
    required this.glyph,
    required this.enabled,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final _LobbyGlyph glyph;
  final bool enabled;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
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
          child: ClipRRect(
            borderRadius: BorderRadius.circular(LudoThemeTokens.radiusMd),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                // Disabled tiles get no tap handler at all (not merely a
                // dimmed color) so no navigation can ever be triggered.
                onTap: enabled ? onTap : null,
                child: LudoPanel(
                  padding: const EdgeInsets.all(12),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Task 12h's larger lobby header logo takes more of
                      // the column's vertical space above these tiles,
                      // leaving less room here on a short viewport (or
                      // whenever the resume-in-progress card is also
                      // showing) than this content's natural size wants.
                      // `FittedBox` scales the icon+title+subtitle stack
                      // down together to fit rather than overflowing,
                      // while still rendering at full natural size
                      // whenever there's room (the common case).
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            LudoArtSlot(
                              slot: glyph.manifestSlot,
                              fallbackPainter: (canvas, rect) =>
                                  _LobbyGlyphPainter(glyph)
                                      .paint(canvas, rect.size),
                              size: const Size.square(40),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              title,
                              textAlign: TextAlign.center,
                              style: LudoTextStyles.displaySmall,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              subtitle,
                              textAlign: TextAlign.center,
                              style: LudoTextStyles.caption,
                            ),
                          ],
                        ),
                      ),
                      if (!enabled)
                        const Positioned(
                          top: 0,
                          right: 0,
                          child: _ComingSoonBadge(),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The "Coming soon" pill shown on a disabled lobby tile.
class _ComingSoonBadge extends StatelessWidget {
  const _ComingSoonBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: LudoThemeTokens.gold,
        borderRadius: BorderRadius.circular(LudoThemeTokens.radiusPill),
        border: Border.all(color: LudoThemeTokens.goldDeep, width: 1.5),
      ),
      child: Text('Coming soon', style: LudoTextStyles.caption),
    );
  }
}

/// Paints a small, simple, code-drawn geometric glyph for each
/// [_LobbyGlyph] — a monitor+die for Computer, two dice for Pass N Play,
/// two overlapping avatar circles for Friends, and a globe grid for
/// Online. Every mark is plain `Canvas` drawing, never a bitmap/photo.
class _LobbyGlyphPainter extends CustomPainter {
  const _LobbyGlyphPainter(this.glyph);

  final _LobbyGlyph glyph;

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.shortestSide * 0.08
      ..strokeCap = StrokeCap.round
      ..color = LudoThemeTokens.gold;
    final fill = Paint()..color = LudoThemeTokens.gold;
    final rect = Offset.zero & size;

    switch (glyph) {
      case _LobbyGlyph.computer:
        final screen = Rect.fromLTWH(
          rect.width * 0.1,
          rect.height * 0.08,
          rect.width * 0.8,
          rect.height * 0.55,
        );
        canvas.drawRRect(
          RRect.fromRectAndRadius(screen, const Radius.circular(4)),
          stroke,
        );
        canvas.drawLine(
          Offset(rect.width * 0.5, screen.bottom),
          Offset(rect.width * 0.5, rect.height * 0.82),
          stroke,
        );
        canvas.drawLine(
          Offset(rect.width * 0.3, rect.height * 0.9),
          Offset(rect.width * 0.7, rect.height * 0.9),
          stroke,
        );
        canvas.drawCircle(screen.center, size.shortestSide * 0.08, fill);
      case _LobbyGlyph.passAndPlay:
        for (final dx in [-1.0, 1.0]) {
          final center = rect.center.translate(dx * size.width * 0.2, 0);
          final die = Rect.fromCenter(
            center: center,
            width: size.width * 0.42,
            height: size.width * 0.42,
          );
          canvas.drawRRect(
            RRect.fromRectAndRadius(die, const Radius.circular(6)),
            stroke,
          );
          canvas.drawCircle(center, size.shortestSide * 0.06, fill);
        }
      case _LobbyGlyph.friends:
        for (final dx in [-1.0, 1.0]) {
          final center = rect.center.translate(dx * size.width * 0.16, 0);
          canvas.drawCircle(
            center,
            size.shortestSide * 0.28,
            Paint()
              ..style = PaintingStyle.stroke
              ..strokeWidth = size.shortestSide * 0.07
              ..color = LudoThemeTokens.gold.withValues(
                alpha: dx < 0 ? 1 : 0.7,
              ),
          );
        }
      case _LobbyGlyph.online:
        final center = rect.center;
        final radius = size.shortestSide * 0.38;
        canvas.drawCircle(center, radius, stroke);
        canvas.drawOval(
          Rect.fromCenter(center: center, width: radius * 2, height: radius),
          stroke,
        );
        canvas.drawLine(
          center.translate(0, -radius),
          center.translate(0, radius),
          stroke,
        );
    }
  }

  @override
  bool shouldRepaint(covariant _LobbyGlyphPainter oldDelegate) =>
      oldDelegate.glyph != glyph;
}
