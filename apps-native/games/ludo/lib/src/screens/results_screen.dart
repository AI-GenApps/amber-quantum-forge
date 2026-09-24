/// The results screen (task 10): shown once `game_board_screen.dart`
/// detects a terminal `LudoMatchState` (`LudoMatchPhase.finished`). Lists
/// every seat's final finish rank, and offers a Rematch action (same
/// `LudoLocalMatchConfig`, a brand-new local match instance) and a Home
/// action. No monetized "watch an ad to continue" or coin-reward UI, per
/// this task's Context/Decisions.
library;

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart';

import '../game/ludo_board_geometry.dart' show ludoColorPalette;
import '../state/ludo_sound_settings.dart';
import '../state/reduced_motion_setting.dart';
import '../theme/ludo_background_painter.dart';
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import '../widgets/ludo_3d_button.dart';
import '../widgets/ludo_avatar.dart' show LudoAvatarView;
import '../widgets/ludo_badge.dart';
import '../widgets/ludo_panel.dart';
import '../widgets/ribbon_banner.dart';
import 'game_board_screen.dart';
import 'mode_setup_sheet.dart' show LudoLocalMatchConfig;

const _minTapTarget = 48.0;

/// The final 1-based finish rank of every seat in [state], seat 0..n-1 in
/// rank order (winners first). [state.winnerOrder] only records seats up to
/// `players.length - 1` (the match ends the moment only one seat remains
/// unfinished, per `ludo_rules`' own doc), so the single seat missing from
/// it is appended last.
List<int> ludoFinalSeatOrder(LudoMatchState state) {
  final order = [...state.winnerOrder];
  for (var seat = 0; seat < state.players.length; seat++) {
    if (!order.contains(seat)) order.add(seat);
  }
  return order;
}

/// The results screen. Always constructed from a terminal [state]
/// (`state.phase == LudoMatchPhase.finished`) — it renders whatever finish
/// order that state carries but never checks phase itself, so a caller
/// under test can supply any terminal-shaped state directly.
class ResultsScreen extends StatelessWidget {
  const ResultsScreen({
    super.key,
    required this.state,
    required this.config,
    required this.seatIdentities,
    required this.soundSettings,
    this.reducedMotion,
    this.rematchDiceSeed,
    this.onQuit,
    this.onRematch,
    this.onHome,
  });

  /// The terminal match state to render the finish order from.
  final LudoMatchState state;

  /// The match configuration a Rematch reuses unchanged.
  final LudoLocalMatchConfig config;

  /// Display identity per seat, in seat order; same shape as
  /// `GameBoardScreen.seatIdentities`.
  final List<LudoSeatIdentity> seatIdentities;

  final LudoSoundSettings soundSettings;
  final ReducedMotionSetting? reducedMotion;

  /// Test seam: the dice seed a Rematch's new `GameBoardScreen` is built
  /// with. Production leaves this `null` (a fresh time-based seed).
  final int? rematchDiceSeed;

  /// Forwarded to a Rematch's new `GameBoardScreen.onQuit`.
  final VoidCallback? onQuit;

  /// Test seam / override for the Rematch action. Defaults to pushing a
  /// fresh `GameBoardScreen` with the same [config], replacing this screen.
  final VoidCallback? onRematch;

  /// Test seam / override for the Home action. Defaults to popping back to
  /// the first route on the navigator stack (the home lobby).
  final VoidCallback? onHome;

  void _defaultRematch(BuildContext context) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => GameBoardScreen(
          config: config,
          seatIdentities: seatIdentities,
          soundSettings: soundSettings,
          reducedMotion: reducedMotion,
          diceSeed: rematchDiceSeed,
          onQuit: onQuit,
        ),
      ),
    );
  }

  void _defaultHome(BuildContext context) {
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    final order = ludoFinalSeatOrder(state);
    final winnerIdentity = seatIdentities[order.first];
    return Scaffold(
      body: LudoBackground(
        child: SafeArea(
          child: Column(
            children: [
              const SizedBox(height: LudoThemeTokens.spaceMd),
              const _TrophyGraphic(),
              const SizedBox(height: LudoThemeTokens.spaceSm),
              RibbonBanner(label: '${winnerIdentity.name} wins!'),
              Expanded(
                child: ListView.builder(
                  key: const Key('results-rank-list'),
                  padding: const EdgeInsets.all(16),
                  itemCount: order.length,
                  itemBuilder: (context, index) {
                    final seat = order[index];
                    final identity = seatIdentities[seat];
                    final color = config.seats[seat].color;
                    final rank = index + 1;
                    return _RankRow(
                      key: ValueKey('results-rank-$seat'),
                      rank: rank,
                      identity: identity,
                      color: color,
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(
                          minHeight: _minTapTarget,
                        ),
                        child: Semantics(
                          button: true,
                          label: 'Home',
                          excludeSemantics: true,
                          child: OutlinedButton(
                            key: const Key('results-home-button'),
                            onPressed: onHome ?? () => _defaultHome(context),
                            child: const Text('Home'),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(
                          minHeight: _minTapTarget,
                        ),
                        child: Ludo3dButton(
                          key: const Key('results-rematch-button'),
                          semanticLabel: 'Rematch',
                          onPressed:
                              onRematch ?? () => _defaultRematch(context),
                          child: const Text(
                            'Rematch',
                            style: TextStyle(fontSize: 16),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A simple, entirely code-drawn gold trophy cup — never a photo/bitmap
/// asset — shown above the finish-order list.
class _TrophyGraphic extends StatelessWidget {
  const _TrophyGraphic();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      width: 72,
      height: 72,
      child: CustomPaint(painter: _TrophyPainter()),
    );
  }
}

class _TrophyPainter extends CustomPainter {
  const _TrophyPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final goldPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [LudoThemeTokens.gold, LudoThemeTokens.goldDeep],
      ).createShader(Offset.zero & size);
    final outline = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeJoin = StrokeJoin.round
      ..color = LudoThemeTokens.textOutline;

    final cupRect = Rect.fromLTWH(
      size.width * 0.22,
      size.height * 0.08,
      size.width * 0.56,
      size.height * 0.42,
    );
    final cupPath = Path()
      ..moveTo(cupRect.left, cupRect.top)
      ..lineTo(cupRect.right, cupRect.top)
      ..lineTo(cupRect.right * 0.92, cupRect.bottom)
      ..lineTo(cupRect.left * 1.1, cupRect.bottom)
      ..close();
    canvas.drawPath(cupPath, goldPaint);
    canvas.drawPath(cupPath, outline);

    // Handles.
    for (final sign in [-1.0, 1.0]) {
      final handleCenter = Offset(
        size.width / 2 + sign * cupRect.width * 0.62,
        cupRect.top + cupRect.height * 0.32,
      );
      canvas.drawArc(
        Rect.fromCenter(
          center: handleCenter,
          width: size.width * 0.22,
          height: size.height * 0.24,
        ),
        sign < 0 ? math.pi * 0.2 : -math.pi * 1.2,
        math.pi,
        false,
        outline,
      );
    }

    // Stem + base.
    final stem = Rect.fromLTWH(
      size.width * 0.44,
      cupRect.bottom,
      size.width * 0.12,
      size.height * 0.18,
    );
    canvas.drawRect(stem, goldPaint);
    canvas.drawRect(stem, outline);

    final base = Rect.fromLTWH(
      size.width * 0.28,
      stem.bottom,
      size.width * 0.44,
      size.height * 0.12,
    );
    final baseRRect = RRect.fromRectAndRadius(base, const Radius.circular(4));
    canvas.drawRRect(baseRRect, goldPaint);
    canvas.drawRRect(baseRRect, outline);
  }

  @override
  bool shouldRepaint(covariant _TrophyPainter oldDelegate) => false;
}

class _RankRow extends StatelessWidget {
  const _RankRow({
    super.key,
    required this.rank,
    required this.identity,
    required this.color,
  });

  final int rank;
  final LudoSeatIdentity identity;
  final LudoColor color;

  String get _ordinal {
    switch (rank) {
      case 1:
        return '1st';
      case 2:
        return '2nd';
      case 3:
        return '3rd';
      default:
        return '${rank}th';
    }
  }

  @override
  Widget build(BuildContext context) {
    final accent = ludoColorPalette[color]!;
    return Semantics(
      label: '$_ordinal place: ${identity.name}',
      excludeSemantics: true,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: _minTapTarget),
        child: Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: LudoPanel(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            borderWidth: rank == 1 ? 3 : 2,
            child: Row(
              children: [
                LudoBadge(label: _ordinal, color: accent, diameter: 32),
                const SizedBox(width: 12),
                LudoAvatarView(avatarId: identity.avatarId, size: 40),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(identity.name, style: LudoTextStyles.bodyStrong),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
