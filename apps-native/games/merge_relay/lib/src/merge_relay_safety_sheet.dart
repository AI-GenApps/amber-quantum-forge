import 'package:flutter/material.dart';

import 'merge_relay_gateway.dart';
import 'merge_relay_service_outcome.dart';

const mergeRelaySafetyReasons = <String>[
  'Offensive name',
  'Harassment',
  'Spam',
  'Other',
];

enum _SafetyStep { choose, confirm, sending, done }

Future<void> showMergeRelaySafetySheet(
  BuildContext context, {
  required MergeRelayGateway gateway,
  required String challengeId,
  String? alias,
}) => showModalBottomSheet<void>(
  context: context,
  isScrollControlled: true,
  builder: (_) => MergeRelaySafetySheet(
    gateway: gateway,
    challengeId: challengeId,
    alias: alias,
  ),
);

final class MergeRelaySafetySheet extends StatefulWidget {
  const MergeRelaySafetySheet({
    required this.gateway,
    required this.challengeId,
    this.alias,
    super.key,
  });

  final MergeRelayGateway gateway;
  final String challengeId;
  final String? alias;

  @override
  State<MergeRelaySafetySheet> createState() => _SafetySheetState();
}

final class _SafetySheetState extends State<MergeRelaySafetySheet> {
  var _step = _SafetyStep.choose;
  var _action = MergeRelaySocialAction.report;
  var _reason = mergeRelaySafetyReasons.first;
  String? _error;

  String get _who =>
      widget.alias == null ? 'this challenge creator' : widget.alias!;

  Future<void> _send() async {
    setState(() {
      _step = _SafetyStep.sending;
      _error = null;
    });
    try {
      await widget.gateway.submitSocial(
        MergeRelaySocialRequest(
          action: _action,
          reason: _reason,
          targetChallengeId: widget.challengeId,
        ),
      );
      if (mounted) setState(() => _step = _SafetyStep.done);
    } on Object catch (cause) {
      final outcome = mergeRelayOutcomeFor(cause);
      if (mounted) {
        setState(() {
          _step = _SafetyStep.confirm;
          _error = '${outcome.title} ${outcome.message}';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          16,
          20,
          20 + MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: SingleChildScrollView(
          child: Column(
            key: const ValueKey('mr-safety-sheet'),
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: switch (_step) {
              _SafetyStep.choose => _choose(),
              _SafetyStep.confirm || _SafetyStep.sending => _confirm(),
              _SafetyStep.done => _done(),
            },
          ),
        ),
      ),
    );
  }

  List<Widget> _choose() => [
    const Text(
      'Report or block',
      style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
    ),
    const SizedBox(height: 4),
    Text('About $_who.'),
    const SizedBox(height: 12),
    SegmentedButton<MergeRelaySocialAction>(
      segments: const [
        ButtonSegment(
          value: MergeRelaySocialAction.report,
          label: Text('Report'),
        ),
        ButtonSegment(
          value: MergeRelaySocialAction.block,
          label: Text('Block'),
        ),
      ],
      selected: {_action},
      onSelectionChanged: (value) => setState(() => _action = value.single),
    ),
    const SizedBox(height: 12),
    Wrap(
      spacing: 8,
      children: [
        for (final reason in mergeRelaySafetyReasons)
          ChoiceChip(
            label: Text(reason),
            selected: _reason == reason,
            onSelected: (_) => setState(() => _reason = reason),
          ),
      ],
    ),
    const SizedBox(height: 12),
    FilledButton(
      onPressed: () => setState(() => _step = _SafetyStep.confirm),
      child: const Text('Continue'),
    ),
  ];

  List<Widget> _confirm() {
    final sending = _step == _SafetyStep.sending;
    final verb = _action == MergeRelaySocialAction.report ? 'Report' : 'Block';
    return [
      Text(
        '$verb $_who?',
        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
      ),
      const SizedBox(height: 6),
      Text(
        _action == MergeRelaySocialAction.report
            ? 'Reason: $_reason. This sends a moderation report.'
            : 'Reason: $_reason. You will not be matched with their challenges.',
      ),
      if (_error != null) ...[
        const SizedBox(height: 8),
        Text(
          _error!,
          key: const ValueKey('mr-safety-error'),
          style: TextStyle(color: Theme.of(context).colorScheme.error),
        ),
      ],
      const SizedBox(height: 12),
      FilledButton(
        key: const ValueKey('mr-safety-confirm'),
        onPressed: sending ? null : _send,
        child: Text(
          sending ? 'Sending' : (_error == null ? verb : 'Try again'),
        ),
      ),
      TextButton(
        onPressed: sending
            ? null
            : () => setState(() {
                _step = _SafetyStep.choose;
                _error = null;
              }),
        child: const Text('Back'),
      ),
    ];
  }

  List<Widget> _done() => [
    Text(
      _action == MergeRelaySocialAction.report
          ? 'Report sent.'
          : 'Blocked. You will not see their challenges.',
      key: const ValueKey('mr-safety-done'),
      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
    ),
    const SizedBox(height: 12),
    FilledButton(
      onPressed: () => Navigator.of(context).pop(),
      child: const Text('Done'),
    ),
  ];
}
