/// The mode/setup bottom sheet (task 09): ruleset, player-count, per-seat
/// color, and (when launched from the Computer entry) per-bot-seat
/// difficulty. Returns a fully-specified [LudoLocalMatchConfig] describing
/// a local match; it never starts networking or constructs a
/// `LudoMatchState` itself — [GameBoardScreen] does that from the config
/// this sheet returns.
library;

import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart';

import '../net/ludo_match_models.dart' show LudoMode;
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import '../widgets/ludo_3d_button.dart';
import '../widgets/ludo_panel.dart';

const _minTapTarget = 48.0;

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
      backgroundColor: Colors.transparent,
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

  /// Debug-only entry point (this task's Context/Decisions): starts a
  /// match where *every* seat, including seat 0, is bot-controlled, so a
  /// full game can be watched to completion unattended — for physical-
  /// device QA and as the manual-repro path for this task's controller
  /// tests. Compiled out of release builds by [kDebugMode]; see [build]
  /// below, where the button is only ever added to the widget tree under
  /// the same guard, so it is neither present nor reachable in a release
  /// build.
  void _startAllBotsDemo() {
    Navigator.of(context).pop(
      LudoLocalMatchConfig(
        ruleset: _ruleset,
        seats: [
          for (var i = 0; i < _seats.length; i++)
            _seats[i].copyWith(
              isBot: true,
              botDifficulty: _seats[i].botDifficulty ?? 'medium',
            ),
        ],
        isComputerMatch: true,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          bottom: 16 + MediaQuery.of(context).viewInsets.bottom,
        ),
        child: LudoPanel(
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(LudoThemeTokens.radiusLg),
          ),
          padding: const EdgeInsets.all(20),
          // Scrollable: this task's debug-only "all bots demo" button
          // (below) pushes the sheet's natural content height past a short
          // viewport (a small phone in landscape, or this suite's own
          // constrained test harness) — a fixed-height `Column` would
          // silently overflow instead of just letting the sheet scroll.
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LudoOutlinedTitle(
                  widget.isComputerMatch ? 'Play vs Computer' : 'Pass N Play',
                  style: LudoTextStyles.displaySmall,
                ),
                const SizedBox(height: 16),
                Text('Ruleset', style: LudoTextStyles.bodyStrong),
                const SizedBox(height: 8),
                SegmentedButton<LudoRuleset>(
                  segments: const [
                    ButtonSegment(
                      value: LudoRuleset.classic,
                      label: Text('Classic'),
                    ),
                    ButtonSegment(
                      value: LudoRuleset.quick,
                      label: Text('Quick'),
                    ),
                  ],
                  selected: {_ruleset},
                  onSelectionChanged: (selection) =>
                      setState(() => _ruleset = selection.first),
                ),
                const SizedBox(height: 16),
                Text('Players', style: LudoTextStyles.bodyStrong),
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
                Text('Seats', style: LudoTextStyles.bodyStrong),
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
                ConstrainedBox(
                  constraints: const BoxConstraints(minHeight: _minTapTarget),
                  child: SizedBox(
                    width: double.infinity,
                    child: Ludo3dButton(
                      key: const Key('mode-setup-start-button'),
                      semanticLabel: 'Start',
                      onPressed: _start,
                      child: const Text('Start'),
                    ),
                  ),
                ),
                if (kDebugMode) ...[
                  const SizedBox(height: 12),
                  ConstrainedBox(
                    constraints: const BoxConstraints(minHeight: _minTapTarget),
                    child: SizedBox(
                      width: double.infinity,
                      child: Ludo3dButton(
                        key: const Key('mode-setup-all-bots-demo-button'),
                        semanticLabel: 'Debug: all bots demo',
                        color: LudoThemeTokens.seatBlue,
                        onPressed: _startAllBotsDemo,
                        child: const Text('Debug: All Bots Demo'),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
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
          Expanded(
            child: Text('$colorLabel · $roleLabel', style: LudoTextStyles.body),
          ),
          if (seat.isBot)
            Semantics(
              label: '$colorLabel bot difficulty: ${seat.botDifficulty}',
              child: ConstrainedBox(
                constraints: const BoxConstraints(
                  minWidth: _minTapTarget,
                  minHeight: _minTapTarget,
                ),
                child: DropdownButton<String>(
                  value: seat.botDifficulty,
                  items: [
                    for (final tier in ludoBotDifficulties)
                      DropdownMenuItem(value: tier, child: Text(tier)),
                  ],
                  onChanged: (value) {
                    if (value != null) onDifficultyChanged(value);
                  },
                ),
              ),
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

/// Ruleset/player-count chosen for a random-matchmaking search (task 26's
/// "Online" tile), returned by [OnlineModeSetupSheet.show].
final class LudoOnlineSetupChoice {
  const LudoOnlineSetupChoice({required this.mode, required this.seatTarget});

  final LudoMode mode;
  final int seatTarget;
}

/// The ruleset/player-count picker for the "Online" (random-matchmaking)
/// tile — the same two choices [ModeSetupSheet] offers, minus any
/// bot-difficulty picker (matchmaking never lets the local player choose a
/// bot's difficulty; the server assigns a fixed difficulty on bot-fill).
class OnlineModeSetupSheet extends StatefulWidget {
  const OnlineModeSetupSheet({super.key});

  static Future<LudoOnlineSetupChoice?> show(BuildContext context) {
    return showModalBottomSheet<LudoOnlineSetupChoice>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const OnlineModeSetupSheet(),
    );
  }

  @override
  State<OnlineModeSetupSheet> createState() => _OnlineModeSetupSheetState();
}

class _OnlineModeSetupSheetState extends State<OnlineModeSetupSheet> {
  LudoRuleset _ruleset = LudoRuleset.classic;
  int _playerCount = 4;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          bottom: 16 + MediaQuery.of(context).viewInsets.bottom,
        ),
        child: LudoPanel(
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(LudoThemeTokens.radiusLg),
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LudoOutlinedTitle('Online', style: LudoTextStyles.displaySmall),
              const SizedBox(height: 16),
              Text('Ruleset', style: LudoTextStyles.bodyStrong),
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
              Text('Players', style: LudoTextStyles.bodyStrong),
              const SizedBox(height: 8),
              SegmentedButton<int>(
                segments: const [
                  ButtonSegment(value: 2, label: Text('2')),
                  ButtonSegment(value: 4, label: Text('4')),
                ],
                selected: {_playerCount},
                onSelectionChanged: (selection) =>
                    setState(() => _playerCount = selection.first),
              ),
              const SizedBox(height: 20),
              ConstrainedBox(
                constraints: const BoxConstraints(minHeight: _minTapTarget),
                child: SizedBox(
                  width: double.infinity,
                  child: Ludo3dButton(
                    key: const Key('online-setup-find-match-button'),
                    semanticLabel: 'Find match',
                    onPressed: () => Navigator.of(context).pop(
                      LudoOnlineSetupChoice(
                        mode: LudoMode.fromWire(_ruleset.id),
                        seatTarget: _playerCount,
                      ),
                    ),
                    child: const Text('Find Match'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// What the "Play with Friends" sheet resolved to: a room to create, or a
/// code to join. Returned by [FriendsSetupSheet.show].
sealed class LudoFriendsChoice {
  const LudoFriendsChoice();
}

final class LudoFriendsCreateChoice extends LudoFriendsChoice {
  const LudoFriendsCreateChoice({required this.mode, required this.seatTarget});

  final LudoMode mode;
  final int seatTarget;
}

final class LudoFriendsJoinChoice extends LudoFriendsChoice {
  const LudoFriendsJoinChoice({required this.roomCode});

  final String roomCode;
}

enum _FriendsTab { create, join }

/// The "Play with Friends" sheet: a Create/Join toggle, each with its own
/// minimal form (ruleset/player-count for create, a room-code field for
/// join).
class FriendsSetupSheet extends StatefulWidget {
  const FriendsSetupSheet({super.key});

  static Future<LudoFriendsChoice?> show(BuildContext context) {
    return showModalBottomSheet<LudoFriendsChoice>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const FriendsSetupSheet(),
    );
  }

  @override
  State<FriendsSetupSheet> createState() => _FriendsSetupSheetState();
}

class _FriendsSetupSheetState extends State<FriendsSetupSheet> {
  _FriendsTab _tab = _FriendsTab.create;
  LudoRuleset _ruleset = LudoRuleset.classic;
  int _playerCount = 4;
  final _codeController = TextEditingController();

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  void _submitCreate() {
    Navigator.of(context).pop(
      LudoFriendsCreateChoice(
        mode: LudoMode.fromWire(_ruleset.id),
        seatTarget: _playerCount,
      ),
    );
  }

  void _submitJoin() {
    final code = _codeController.text.trim().toUpperCase();
    if (code.isEmpty) return;
    Navigator.of(context).pop(LudoFriendsJoinChoice(roomCode: code));
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          bottom: 16 + MediaQuery.of(context).viewInsets.bottom,
        ),
        child: LudoPanel(
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(LudoThemeTokens.radiusLg),
          ),
          padding: const EdgeInsets.all(20),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LudoOutlinedTitle(
                  'Play with Friends',
                  style: LudoTextStyles.displaySmall,
                ),
                const SizedBox(height: 16),
                SegmentedButton<_FriendsTab>(
                  segments: const [
                    ButtonSegment(
                      value: _FriendsTab.create,
                      label: Text('Create Room'),
                    ),
                    ButtonSegment(
                      value: _FriendsTab.join,
                      label: Text('Join Room'),
                    ),
                  ],
                  selected: {_tab},
                  onSelectionChanged: (selection) =>
                      setState(() => _tab = selection.first),
                ),
                const SizedBox(height: 16),
                if (_tab == _FriendsTab.create) ..._createForm(),
                if (_tab == _FriendsTab.join) ..._joinForm(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _createForm() => [
    Text('Ruleset', style: LudoTextStyles.bodyStrong),
    const SizedBox(height: 8),
    SegmentedButton<LudoRuleset>(
      segments: const [
        ButtonSegment(value: LudoRuleset.classic, label: Text('Classic')),
        ButtonSegment(value: LudoRuleset.quick, label: Text('Quick')),
      ],
      selected: {_ruleset},
      onSelectionChanged: (selection) =>
          setState(() => _ruleset = selection.first),
    ),
    const SizedBox(height: 16),
    Text('Players', style: LudoTextStyles.bodyStrong),
    const SizedBox(height: 8),
    SegmentedButton<int>(
      segments: const [
        ButtonSegment(value: 2, label: Text('2')),
        ButtonSegment(value: 4, label: Text('4')),
      ],
      selected: {_playerCount},
      onSelectionChanged: (selection) =>
          setState(() => _playerCount = selection.first),
    ),
    const SizedBox(height: 20),
    ConstrainedBox(
      constraints: const BoxConstraints(minHeight: _minTapTarget),
      child: SizedBox(
        width: double.infinity,
        child: Ludo3dButton(
          key: const Key('friends-setup-create-button'),
          semanticLabel: 'Create room',
          onPressed: _submitCreate,
          child: const Text('Create Room'),
        ),
      ),
    ),
  ];

  List<Widget> _joinForm() => [
    Text('Room code', style: LudoTextStyles.bodyStrong),
    const SizedBox(height: 8),
    ConstrainedBox(
      constraints: const BoxConstraints(minHeight: _minTapTarget),
      child: TextField(
        key: const Key('friends-setup-code-field'),
        controller: _codeController,
        textCapitalization: TextCapitalization.characters,
        style: LudoTextStyles.body,
        decoration: const InputDecoration(
          hintText: 'Enter code',
          border: OutlineInputBorder(),
        ),
        onSubmitted: (_) => _submitJoin(),
      ),
    ),
    const SizedBox(height: 20),
    ConstrainedBox(
      constraints: const BoxConstraints(minHeight: _minTapTarget),
      child: SizedBox(
        width: double.infinity,
        child: Ludo3dButton(
          key: const Key('friends-setup-join-button'),
          semanticLabel: 'Join room',
          onPressed: _submitJoin,
          child: const Text('Join Room'),
        ),
      ),
    ),
  ];
}
