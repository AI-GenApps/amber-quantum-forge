part of 'meme_court_app.dart';

extension on _MemeCourtHomeState {
  Future<void> _restore() async {
    try {
      final envelope = await _saveStore.read(_appContext);
      if (envelope != null) {
        if (envelope.schemaVersion != 1) {
          throw const FormatException('Unsupported court save schema');
        }
        _restorePayload(envelope.payload);
        if (mounted) {
          _update(() => _message = 'Back to the docket.');
        }
      }
    } catch (_) {
      if (mounted) {
        _update(
          () =>
              _message = 'That docket was unreadable. Starting a clean round.',
        );
      }
    } finally {
      if (mounted) _update(() => _hydrated = true);
    }
  }

  void _submit(String memberId, String phraseId) {
    if (!_isKnownPhrase(phraseId)) {
      _update(() => _message = 'Pick a caption from the board.');
      return;
    }
    final otherMember = memberId == 'sample_alice'
        ? 'sample_bea'
        : 'sample_alice';
    CourtSubmission? otherSubmission;
    for (final submission in _round.submissions.values) {
      if (submission.memberId == otherMember) {
        otherSubmission = submission;
        break;
      }
    }
    if (otherSubmission?.phraseIds.contains(phraseId) == true) {
      _update(() => _message = 'Give each player a different line.');
      return;
    }
    final action = _round.submit(
      CourtSubmission(
        id: 'sample-${memberId.replaceFirst('sample_', '')}',
        memberId: memberId,
        phraseIds: [phraseId],
      ),
    );
    if (action.accepted) {
      _round = action.round;
      _update(() {
        if (memberId == 'sample_alice') {
          _selectedAlicePhraseId = phraseId;
        } else {
          _selectedBeaPhraseId = phraseId;
        }
        _message = 'Line added to the docket.';
      });
      _persist();
    } else if (mounted) {
      _update(() => _message = _friendlyError(action.errorCode));
    }
  }

  void _apply(CourtActionResult action, String message) {
    if (!action.accepted) {
      _update(() => _message = _friendlyError(action.errorCode));
      return;
    }
    _update(() {
      _round = action.round;
      _message = message;
    });
    _persist();
  }

  void _vote(String submissionId) {
    final action = _round.castBallot(
      CourtBallot(
        roundId: _round.id,
        memberId: 'sample_cora',
        contestId: 'pair-1',
        submissionId: submissionId,
      ),
    );
    if (!action.accepted) {
      _update(() => _message = _friendlyError(action.errorCode));
      return;
    }
    _update(() {
      _round = action.round;
      _selectedVoteId = submissionId;
      _message = 'Ballot locked. Reveal the verdict when ready.';
    });
    _persist();
  }

  void _reveal() {
    _clock.advance(const Duration(minutes: 40));
    _apply(_round.refresh(), 'The verdict is in.');
  }

  Future<void> _confirmReset() async {
    if (!mounted) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Start over?'),
        content: const Text(
          'Your current docket and saved picks will be cleared.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Start over'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) await _reset();
  }

  Future<void> _reset() async {
    try {
      await _saveStore.delete(_appContext);
    } catch (_) {
      if (mounted) {
        _update(() => _message = 'Could not clear the docket.');
      }
      return;
    }
    if (!mounted) return;
    _update(() {
      _clock.set(DateTime.utc(2026, 1, 1));
      _round = _freshRound();
      _selectedVoteId = null;
      _selectedAlicePhraseId = null;
      _selectedBeaPhraseId = null;
      _message = 'New round. Make it count.';
    });
  }

  Future<void> _persist() async {
    final envelope = SaveEnvelope.create(
      context: _appContext,
      schemaVersion: 1,
      savedAt: DateTime.now().toUtc(),
      payload: {
        'flow_version': 2,
        'prompt_id': _prompt.id,
        'submitted_members': _round.submissions.values
            .where((item) => item.state == SubmissionState.active)
            .map((item) => item.memberId)
            .toList(),
        'selected_phrase_ids': {
          for (final item in _round.submissions.values)
            if (item.state == SubmissionState.active &&
                item.phraseIds.isNotEmpty)
              item.memberId: item.phraseIds.first,
        },
        'round_status': _round.status.name,
        'frozen': _round.status != CourtStatus.submissionsOpen,
        'voted_submission_id': _selectedVoteId,
        'finalized': {
          CourtStatus.finalized,
          CourtStatus.tied,
          CourtStatus.insufficient,
        }.contains(_round.status),
      },
    );
    try {
      await _saveStore.write(_appContext, envelope);
    } catch (_) {
      if (mounted) _update(() => _message = 'Could not save this docket.');
    }
  }

  String _friendlyError(String? code) => switch (code) {
    'one_submission_per_member' => 'That caption is already on the docket.',
    'not_frozen' => 'Add two captions before opening the vote.',
    'deadline_not_reached' => 'The vote is still open.',
    _ => 'That move is not available in this round.',
  };

  String _statusLabel(CourtStatus status) => switch (status) {
    CourtStatus.submissionsOpen => 'Build the docket',
    CourtStatus.frozen => 'Docket frozen',
    CourtStatus.votingOpen => 'Vote now',
    CourtStatus.finalized => 'Verdict ready',
    CourtStatus.tied => 'A tie',
    CourtStatus.insufficient => 'No clear verdict',
    _ => 'Round closed',
  };
}
