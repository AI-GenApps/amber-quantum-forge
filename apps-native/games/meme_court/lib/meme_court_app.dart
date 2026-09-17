import 'dart:async';

import 'package:court_rules/court_rules.dart';
import 'package:flutter/material.dart';
import 'package:platform_core/platform_core.dart';

import 'meme_court_content.dart';
import 'meme_court_ui.dart';

part 'meme_court_home_actions.dart';
part 'meme_court_restore.dart';

final memeCourtIdentity = appIdentityFor(
  'meme_court',
  subtitle: 'Submit. Vote. Laugh together',
);

final class MemeCourtApp extends StatelessWidget {
  const MemeCourtApp({this.saveStore, super.key});

  final SaveStore? saveStore;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: memeCourtIdentity.publicTitle,
      debugShowCheckedModeBanner: false,
      theme: CourtDesign.theme(),
      home: MemeCourtHome(saveStore: saveStore),
    );
  }
}

final class MemeCourtHome extends StatefulWidget {
  const MemeCourtHome({this.saveStore, super.key});

  final SaveStore? saveStore;

  @override
  State<MemeCourtHome> createState() => _MemeCourtHomeState();
}

final class _MemeCourtHomeState extends State<MemeCourtHome> {
  late final AppContext _appContext = runtimeAppContext(
    identity: memeCourtIdentity,
  );
  late final SaveStore _saveStore = widget.saveStore ?? MemorySaveStore();
  final MutableCourtClock _clock = MutableCourtClock(DateTime.utc(2026, 1, 1));
  final CourtPracticePrompt _prompt = courtPracticePrompt;
  late CourtRoundView _round;
  String? _selectedVoteId;
  String? _selectedAlicePhraseId;
  String? _selectedBeaPhraseId;
  String? _message;
  bool _hydrated = false;

  void _update(VoidCallback update) => setState(update);

  @override
  void initState() {
    super.initState();
    _round = _freshRound();
    unawaited(_restore());
  }

  CourtRoundView _freshRound() => CourtRoundView.open(
    id: 'local-sample-round',
    clock: _clock,
    random: SeededCourtRandom(7),
    roster: const [
      CourtMember('sample_alice', displayName: 'Alice'),
      CourtMember('sample_bea', displayName: 'Bea'),
      CourtMember('sample_cora', displayName: 'Cora'),
    ],
    submissionPolicy: SubmissionPolicy(
      approvedPhraseIds: {
        courtLegacyCaptionId,
        ..._prompt.captions.map((caption) => caption.id),
      },
    ),
    mode: CourtMode.quick20,
  );

  @override
  Widget build(BuildContext context) {
    if (!_hydrated) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final status = _round.status;
    return Scaffold(
      appBar: AppBar(
        leading: const Icon(Icons.gavel_rounded),
        title: const Text('Meme Court'),
        actions: [
          IconButton(
            tooltip: 'Start over',
            onPressed: () => unawaited(_confirmReset()),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          CourtHeader(status: _statusLabel(status), prompt: _prompt.text),
          const SizedBox(height: 18),
          if (_message != null)
            CourtPanel(
              color: Colors.white,
              child: Text(
                _message!,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          if (_message != null) const SizedBox(height: 12),
          if (status == CourtStatus.submissionsOpen)
            CourtComposerCard(
              submissionCount: _round.submissions.length,
              aliceSubmitted: _round.submissions.containsKey('sample-alice'),
              beaSubmitted: _round.submissions.containsKey('sample-bea'),
              selectedAlicePhraseId: _selectedAlicePhraseId,
              selectedBeaPhraseId: _selectedBeaPhraseId,
              onAlice: _round.submissions.containsKey('sample-alice')
                  ? null
                  : (phraseId) => _submit('sample_alice', phraseId),
              onBea: _round.submissions.containsKey('sample-bea')
                  ? null
                  : (phraseId) => _submit('sample_bea', phraseId),
              onFreeze: _round.submissions.length >= 2
                  ? () => _apply(
                      _round.freezeSubmissions(),
                      'The docket is frozen. Time to vote.',
                    )
                  : null,
            )
          else if (status == CourtStatus.frozen)
            CourtPanel(
              color: CourtDesign.lilac,
              child: FilledButton(
                onPressed: () => _apply(
                  _round.beginVoting(),
                  'The room is listening. Pick a caption.',
                ),
                child: const Text('Open the vote'),
              ),
            )
          else if (status == CourtStatus.votingOpen)
            CourtVoteCard(
              round: _round,
              selectedSubmissionId: _selectedVoteId,
              captionForPhrase: courtCaptionText,
              onVote: _vote,
              onReveal: _reveal,
            )
          else if ({
            CourtStatus.finalized,
            CourtStatus.tied,
            CourtStatus.insufficient,
          }.contains(status))
            CourtResultCard(
              round: _round,
              captionForPhrase: courtCaptionText,
              onReset: () => unawaited(_confirmReset()),
            ),
        ],
      ),
    );
  }
}
