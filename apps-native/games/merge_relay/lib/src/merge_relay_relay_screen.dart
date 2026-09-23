import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_app.dart';
import 'merge_relay_board_painter.dart';
import 'merge_relay_board_accessibility.dart';
import 'merge_relay_relay_controller.dart';
import 'merge_relay_relay_models.dart';
import 'merge_relay_relay_share_panel.dart';
import 'merge_relay_theme.dart';
import 'merge_relay_gesture.dart';
import 'network/merge_relay_models.dart';

part 'merge_relay_relay_board.dart';
part 'merge_relay_relay_screen_views.dart';

final class MergeRelayRelayScreen extends StatefulWidget {
  const MergeRelayRelayScreen({
    required this.game,
    required this.theme,
    required this.controller,
    super.key,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;
  final MergeRelayRelayController controller;

  @override
  State<MergeRelayRelayScreen> createState() => _MergeRelayRelayScreenState();
}

final class _MergeRelayRelayScreenState extends State<MergeRelayRelayScreen> {
  late final TextEditingController _link;

  @override
  void initState() {
    super.initState();
    _link = TextEditingController();
  }

  @override
  void dispose() {
    _link.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.controller,
      builder: (context, _) {
        final snapshot = widget.controller.snapshot;
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
          child: switch (snapshot.phase) {
            MergeRelayRelayPhase.preview => _preview(snapshot),
            MergeRelayRelayPhase.creator => _creator(snapshot),
            MergeRelayRelayPhase.creating => _loading(),
            MergeRelayRelayPhase.reserving ||
            MergeRelayRelayPhase.playing ||
            MergeRelayRelayPhase.syncing ||
            MergeRelayRelayPhase.offline ||
            MergeRelayRelayPhase.conflict ||
            MergeRelayRelayPhase.finalizing => _play(snapshot),
            MergeRelayRelayPhase.result => _result(snapshot),
            MergeRelayRelayPhase.expired => _message(
              'The relay window closed.',
              snapshot.message ?? 'Return home and choose another challenge.',
              'Home',
              widget.game.openHome,
            ),
            MergeRelayRelayPhase.error => _error(snapshot),
            MergeRelayRelayPhase.bootstrapping ||
            MergeRelayRelayPhase.loadingPreview => _loading(),
            MergeRelayRelayPhase.idle || MergeRelayRelayPhase.ready => _entry(),
          },
        );
      },
    );
  }

  Widget _entry() => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      _header('Join a relay', 'Bring a challenge code or link.'),
      const SizedBox(height: 26),
      TextField(
        controller: _link,
        maxLength: 512,
        textInputAction: TextInputAction.go,
        onSubmitted: (_) => _openLink(),
        decoration: const InputDecoration(
          labelText: 'Challenge code or link',
          hintText: 'ch_… or mergerelay://challenge/…',
          border: OutlineInputBorder(),
        ),
      ),
      const SizedBox(height: 8),
      FilledButton.icon(
        onPressed: _openLink,
        icon: const Icon(Icons.route_rounded),
        label: const Text('See challenge'),
      ),
      const SizedBox(height: 14),
      Text(
        'A relay starts only after you review the board and accept it.',
        style: TextStyle(color: widget.theme.muted, fontSize: 13),
      ),
    ],
  );

  Widget _preview(MergeRelayRelaySnapshot snapshot) {
    final challenge = snapshot.preview;
    if (challenge == null) return _loading();
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _header('Incoming relay', 'A board from ${challenge.creatorAlias}.'),
          const SizedBox(height: 18),
          SizedBox.square(
            dimension: _boardSize(context),
            child: _RelayBoard(
              state: challenge.checkpoint.state,
              theme: widget.theme,
              onMove: null,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            '${challenge.checkpoint.maxLegalMoves} moves · ${challenge.originMode.name} path',
            style: TextStyle(
              color: widget.theme.muted,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 14),
          FilledButton.icon(
            onPressed: challenge.status == MergeRelayChallengeStatus.open
                ? widget.controller.reserve
                : null,
            icon: const Icon(Icons.play_arrow_rounded),
            label: Text(
              challenge.status == MergeRelayChallengeStatus.open
                  ? 'Accept relay'
                  : 'Challenge closed',
            ),
          ),
        ],
      ),
    );
  }

  Widget _message(
    String title,
    String body,
    String action,
    VoidCallback onTap,
  ) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      _header(title, body),
      const Spacer(),
      FilledButton(onPressed: onTap, child: Text(action)),
    ],
  );
  Widget _header(String title, String subtitle) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      IconButton(
        onPressed: widget.game.openHome,
        tooltip: 'Home',
        icon: Icon(Icons.arrow_back_rounded, color: widget.theme.ink),
      ),
      Text(
        title,
        style: TextStyle(
          color: widget.theme.ink,
          fontSize: 29,
          fontWeight: FontWeight.w900,
        ),
      ),
      Text(subtitle, style: TextStyle(color: widget.theme.muted, fontSize: 14)),
    ],
  );
  Future<void> _openLink() async {
    FocusManager.instance.primaryFocus?.unfocus();
    await widget.controller.openLink(_link.text);
  }

  static String _resultLabel(MergeRelayResultOutcome outcome) =>
      switch (outcome) {
        MergeRelayResultOutcome.complete => 'Relay complete.',
        MergeRelayResultOutcome.tie => 'A shared finish.',
        MergeRelayResultOutcome.unfinished => 'Relay unfinished.',
        MergeRelayResultOutcome.earlyFinish => 'Relay finished early.',
        MergeRelayResultOutcome.terminal => 'No moves remained.',
      };
}
