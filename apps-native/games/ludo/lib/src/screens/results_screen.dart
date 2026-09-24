/// The results screen (task 10): shown once `game_board_screen.dart`
/// detects a terminal `LudoMatchState` (`LudoMatchPhase.finished`). Lists
/// every seat's final finish rank, and offers a Rematch action (same
/// `LudoLocalMatchConfig`, a brand-new local match instance) and a Home
/// action. No monetized "watch an ad to continue" or coin-reward UI, per
/// this task's Context/Decisions.
library;

import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart';

import '../game/ludo_board_geometry.dart' show ludoColorPalette;
import '../state/ludo_sound_settings.dart';
import '../state/reduced_motion_setting.dart';
import '../widgets/ludo_avatar.dart' show LudoAvatarView;
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
    return Scaffold(
      appBar: AppBar(title: const Text('Results')),
      body: SafeArea(
        child: Column(
          children: [
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
                    child: Semantics(
                      button: true,
                      label: 'Home',
                      excludeSemantics: true,
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(
                          minHeight: _minTapTarget,
                        ),
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
                    child: Semantics(
                      button: true,
                      label: 'Rematch',
                      excludeSemantics: true,
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(
                          minHeight: _minTapTarget,
                        ),
                        child: FilledButton(
                          key: const Key('results-rematch-button'),
                          onPressed:
                              onRematch ?? () => _defaultRematch(context),
                          child: const Text('Rematch'),
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
    );
  }
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
        child: Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                SizedBox(
                  width: 36,
                  child: Text(
                    _ordinal,
                    style: Theme.of(context).textTheme.titleMedium
                        ?.copyWith(color: accent),
                  ),
                ),
                const SizedBox(width: 8),
                LudoAvatarView(avatarId: identity.avatarId, size: 40),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    identity.name,
                    style: Theme.of(context).textTheme.titleMedium,
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
