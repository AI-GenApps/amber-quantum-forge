/// The mode/setup bottom sheet (task 09): ruleset, player-count, per-seat
/// color, and (when launched from the Computer entry) per-bot-seat
/// difficulty. Returns a fully-specified [LudoLocalMatchConfig] describing
/// a local match; it never starts networking or constructs a
/// `LudoMatchState` itself — [GameBoardScreen] does that from the config
/// this sheet returns.
library;

import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart';

/// One local (non-networked) match's fully-specified starting
/// configuration, as returned by [ModeSetupSheet.show].
final class LudoLocalMatchConfig {
  const LudoLocalMatchConfig({
    required this.ruleset,
    required this.seats,
    required this.isComputerMatch,
  });

  /// Classic or Quick (task 01's [LudoRuleset]).
  final LudoRuleset ruleset;

  /// One entry per seat, in seat order (2 or 4 entries).
  final List<LudoSeatConfig> seats;

  /// Whether this config came from the Computer entry (bot difficulty was
  /// offered) rather than Pass N Play.
  final bool isComputerMatch;

  int get playerCount => seats.length;
}

/// One seat's color assignment and (for a bot seat) difficulty.
final class LudoSeatConfig {
  const LudoSeatConfig({
    required this.color,
    required this.isBot,
    this.botDifficulty,
  }) : assert(
         !isBot || botDifficulty != null,
         'a bot seat must have a botDifficulty',
       );

  final LudoColor color;
  final bool isBot;

  /// One of `easy`/`medium`/`hard` (see `ludoBotStrategyById`); `null` for
  /// a human seat.
  final String? botDifficulty;

  LudoSeatConfig copyWith({
    LudoColor? color,
    bool? isBot,
    Object? botDifficulty = _unset,
  }) {
    return LudoSeatConfig(
      color: color ?? this.color,
      isBot: isBot ?? this.isBot,
      botDifficulty: identical(botDifficulty, _unset)
          ? this.botDifficulty
          : botDifficulty as String?,
    );
  }
}

const _unset = Object();

/// The fixed seat colors, in seat-assignment order (matches
/// `LudoMatchState.initial`'s `LudoColor.values` order).
const _seatColors = LudoColor.values;

/// Bot difficulty tiers offered per non-human seat, matching
/// `ludoBotStrategyById`'s recognized ids.
const ludoBotDifficulties = ['easy', 'medium', 'hard'];

/// The mode/setup bottom sheet. Launch with [ModeSetupSheet.show].
class ModeSetupSheet extends StatefulWidget {
  const ModeSetupSheet({super.key, required this.isComputerMatch});

  /// `true` when launched from the Computer home-lobby entry (offers a
  /// bot-difficulty picker for every non-human seat); `false` from Pass N
  /// Play (every seat is human, no difficulty picker shown at all).
  final bool isComputerMatch;

  /// Shows this sheet modally and returns the chosen [LudoLocalMatchConfig],
  /// or `null` if the sheet was dismissed without starting.
  static Future<LudoLocalMatchConfig?> show(
    BuildContext context, {
    required bool isComputerMatch,
  }) {
    return showModalBottomSheet<LudoLocalMatchConfig>(
      context: context,
      isScrollControlled: true,
      builder: (_) => ModeSetupSheet(isComputerMatch: isComputerMatch),
    );
  }

  @override
  State<ModeSetupSheet> createState() => _ModeSetupSheetState();
}

class _ModeSetupSheetState extends State<ModeSetupSheet> {
  LudoRuleset _ruleset = LudoRuleset.classic;
  int _playerCount = 4;
  late List<LudoSeatConfig> _seats = _buildDefaultSeats();

  List<LudoSeatConfig> _buildDefaultSeats() {
    return [
      for (var i = 0; i < _playerCount; i++)
        LudoSeatConfig(
          color: _seatColors[i],
          // Seat 0 is always the local human player; every other seat is a
          // bot when launched from Computer, human (Pass N Play) otherwise.
          isBot: widget.isComputerMatch && i != 0,
          botDifficulty: widget.isComputerMatch && i != 0 ? 'medium' : null,
        ),
    ];
  }

  void _setPlayerCount(int count) {
    if (_playerCount == count) return;
    setState(() {
      _playerCount = count;
      _seats = _buildDefaultSeats();
    });
  }

  void _setBotDifficulty(int seatIndex, String difficulty) {
    setState(() {
      _seats = [
        for (var i = 0; i < _seats.length; i++)
          i == seatIndex
              ? _seats[i].copyWith(botDifficulty: difficulty)
              : _seats[i],
      ];
    });
  }

  void _start() {
    Navigator.of(context).pop(
      LudoLocalMatchConfig(
        ruleset: _ruleset,
        seats: _seats,
        isComputerMatch: widget.isComputerMatch,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: 20 + MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.isComputerMatch ? 'Play vs Computer' : 'Pass N Play',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            Text('Ruleset', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            SegmentedButton<LudoRuleset>(
              segments: const [
                ButtonSegment(
                  value: LudoRuleset.classic,
                  label: Text('Classic'),
                ),
                ButtonSegment(value: LudoRuleset.quick, label: Text('Quick')),
              ],
              selected: {_ruleset},
              onSelectionChanged: (selection) =>
                  setState(() => _ruleset = selection.first),
            ),
            const SizedBox(height: 16),
            Text('Players', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 2, label: Text('2')),
                ButtonSegment(value: 4, label: Text('4')),
              ],
              selected: {_playerCount},
              onSelectionChanged: (selection) =>
                  _setPlayerCount(selection.first),
            ),
            const SizedBox(height: 16),
            Text('Seats', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            for (var i = 0; i < _seats.length; i++)
              _SeatRow(
                key: ValueKey('seat-$i'),
                seatIndex: i,
                seat: _seats[i],
                onDifficultyChanged: (difficulty) =>
                    _setBotDifficulty(i, difficulty),
              ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _start,
                child: const Text('Start'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SeatRow extends StatelessWidget {
  const _SeatRow({
    super.key,
    required this.seatIndex,
    required this.seat,
    required this.onDifficultyChanged,
  });

  final int seatIndex;
  final LudoSeatConfig seat;
  final ValueChanged<String> onDifficultyChanged;

  @override
  Widget build(BuildContext context) {
    final colorLabel =
        seat.color.name[0].toUpperCase() + seat.color.name.substring(1);
    final roleLabel = seat.isBot ? 'Bot' : 'You';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            width: 20,
            height: 20,
            decoration: BoxDecoration(
              color: _colorFor(seat.color),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text('$colorLabel · $roleLabel')),
          if (seat.isBot)
            DropdownButton<String>(
              value: seat.botDifficulty,
              items: [
                for (final tier in ludoBotDifficulties)
                  DropdownMenuItem(value: tier, child: Text(tier)),
              ],
              onChanged: (value) {
                if (value != null) onDifficultyChanged(value);
              },
            ),
        ],
      ),
    );
  }

  Color _colorFor(LudoColor color) => switch (color) {
    LudoColor.red => const Color(0xFFE53935),
    LudoColor.green => const Color(0xFF43A047),
    LudoColor.yellow => const Color(0xFFFDD835),
    LudoColor.blue => const Color(0xFF1E88E5),
  };
}
