part of 'meme_court_app.dart';

extension on _MemeCourtHomeState {
  void _restorePayload(JsonObject payload) {
    final previousRound = _round;
    final previousVote = _selectedVoteId;
    final previousAlice = _selectedAlicePhraseId;
    final previousBea = _selectedBeaPhraseId;
    final previousTime = _clock.now;
    try {
      final flowVersion = payload['flow_version'];
      if (flowVersion is! int || (flowVersion != 1 && flowVersion != 2)) {
        throw const FormatException('Unsupported court flow version');
      }
      if (flowVersion == 2 &&
          payload['prompt_id'] != null &&
          payload['prompt_id'] != _prompt.id) {
        throw const FormatException('Unsupported court prompt');
      }
      final submitted = _submittedMembers(payload['submitted_members']);
      final voted = payload['voted_submission_id'];
      if (voted != null && voted is! String) {
        throw const FormatException('Invalid court vote');
      }
      final frozen = payload['frozen'];
      if (frozen is! bool) {
        throw const FormatException('Invalid court frozen state');
      }
      final finalized = payload['finalized'];
      if (finalized is! bool) {
        throw const FormatException('Invalid court finalized state');
      }
      final phraseIds = _restorePhraseIds(
        payload['selected_phrase_ids'],
        flowVersion,
        submitted,
      );
      final targetStatus = _targetStatus(
        payload,
        flowVersion,
        frozen,
        finalized,
        voted,
      );
      var round = _freshRound();
      for (final memberId in const ['sample_alice', 'sample_bea']) {
        final phraseId = phraseIds[memberId];
        if (phraseId == null) continue;
        final action = round.submit(
          CourtSubmission(
            id: 'sample-${memberId.replaceFirst('sample_', '')}',
            memberId: memberId,
            phraseIds: [phraseId],
          ),
        );
        if (!action.accepted) {
          throw const FormatException('Invalid court submission');
        }
        round = action.round;
      }
      if (targetStatus == null) {
        if (submitted.length < 2) {
          throw const FormatException('Incomplete court finalized state');
        }
        round = _openVoting(round);
        round = _restoreBallot(round, voted);
        round = _finishRound(round);
      } else {
        switch (targetStatus) {
          case CourtStatus.submissionsOpen:
            if (voted != null || finalized) {
              throw const FormatException('Invalid court open state');
            }
          case CourtStatus.frozen:
            if (submitted.length < 2 || voted != null || finalized) {
              throw const FormatException('Invalid court frozen state');
            }
            final action = round.freezeSubmissions();
            if (!action.accepted || action.round.status != CourtStatus.frozen) {
              throw const FormatException('Invalid court frozen transition');
            }
            round = action.round;
          case CourtStatus.votingOpen:
            if (submitted.length < 2 || finalized) {
              throw const FormatException('Invalid court voting state');
            }
            round = _openVoting(round);
            round = _restoreBallot(round, voted);
          case CourtStatus.insufficient:
            if (voted != null || !finalized) {
              throw const FormatException('Invalid court insufficient state');
            }
            if (submitted.length < 2) {
              final action = round.freezeSubmissions();
              if (!action.accepted ||
                  action.round.status != CourtStatus.insufficient) {
                throw const FormatException('Invalid court insufficient state');
              }
              round = action.round;
            } else {
              round = _openVoting(round);
              round = _finishRound(round);
              if (round.status != CourtStatus.insufficient) {
                throw const FormatException('Invalid court final state');
              }
            }
          case CourtStatus.finalized || CourtStatus.tied:
            if (!finalized || submitted.length < 2) {
              throw const FormatException('Invalid court final state');
            }
            round = _openVoting(round);
            round = _restoreBallot(round, voted);
            round = _finishRound(round);
            if (round.status != targetStatus) {
              throw const FormatException('Invalid court final state');
            }
          case CourtStatus.draft ||
              CourtStatus.cancelled ||
              CourtStatus.held ||
              CourtStatus.withdrawn:
            throw const FormatException('Unsupported court restore state');
        }
      }
      _round = round;
      _selectedVoteId = voted as String?;
      _selectedAlicePhraseId = phraseIds['sample_alice'];
      _selectedBeaPhraseId = phraseIds['sample_bea'];
    } catch (_) {
      _clock.set(previousTime);
      _round = previousRound;
      _selectedVoteId = previousVote;
      _selectedAlicePhraseId = previousAlice;
      _selectedBeaPhraseId = previousBea;
      rethrow;
    }
  }

  Set<String> _submittedMembers(Object? value) {
    if (value is! List || value.any((item) => item is! String)) {
      throw const FormatException('Invalid court submitted members');
    }
    final values = value.cast<String>();
    final submitted = values.toSet();
    if (submitted.length != values.length ||
        submitted.difference({'sample_alice', 'sample_bea'}).isNotEmpty) {
      throw const FormatException('Invalid court submitted members');
    }
    return submitted;
  }

  Map<String, String> _restorePhraseIds(
    Object? value,
    int flowVersion,
    Set<String> submitted,
  ) {
    final phraseIds = <String, String>{};
    if (flowVersion == 1 || value == null) {
      for (final memberId in submitted) {
        phraseIds[memberId] = courtLegacyCaptionId;
      }
      return phraseIds;
    }
    if (value is! Map) {
      throw const FormatException('Invalid court selected captions');
    }
    for (final entry in value.entries) {
      if (entry.key is! String || entry.value is! String) {
        throw const FormatException('Invalid court selected captions');
      }
      final memberId = entry.key as String;
      final phraseId = entry.value as String;
      if (!submitted.contains(memberId) || !_isKnownPhrase(phraseId)) {
        throw const FormatException('Invalid court selected captions');
      }
      phraseIds[memberId] = phraseId;
    }
    for (final memberId in submitted) {
      phraseIds.putIfAbsent(memberId, () => courtLegacyCaptionId);
    }
    final modernIds = phraseIds.values
        .where((phraseId) => phraseId != courtLegacyCaptionId)
        .toList();
    if (modernIds.toSet().length != modernIds.length) {
      throw const FormatException('Duplicate court selected caption');
    }
    return phraseIds;
  }

  CourtStatus? _targetStatus(
    JsonObject payload,
    int flowVersion,
    bool frozen,
    bool finalized,
    Object? voted,
  ) {
    final rawStatus = payload['round_status'];
    if (flowVersion == 1 || rawStatus == null) {
      if (!frozen) {
        if (voted != null || finalized) {
          throw const FormatException('Invalid court open state');
        }
        return CourtStatus.submissionsOpen;
      }
      return finalized ? null : CourtStatus.votingOpen;
    }
    if (rawStatus is! String) {
      throw const FormatException('Invalid court round status');
    }
    CourtStatus? status;
    for (final candidate in CourtStatus.values) {
      if (candidate.name == rawStatus) status = candidate;
    }
    if (status == null ||
        (status == CourtStatus.submissionsOpen) != !frozen ||
        ({
              CourtStatus.finalized,
              CourtStatus.tied,
              CourtStatus.insufficient,
            }.contains(status) !=
            finalized)) {
      throw const FormatException('Invalid court round status');
    }
    return status;
  }

  bool _isKnownPhrase(String phraseId) {
    return phraseId == courtLegacyCaptionId ||
        _prompt.captions.any((caption) => caption.id == phraseId);
  }

  CourtRoundView _openVoting(CourtRoundView round) {
    final freeze = round.freezeSubmissions();
    if (!freeze.accepted || freeze.round.status != CourtStatus.frozen) {
      throw const FormatException('Invalid court voting transition');
    }
    final voting = freeze.round.beginVoting();
    if (!voting.accepted || voting.round.status != CourtStatus.votingOpen) {
      throw const FormatException('Invalid court voting transition');
    }
    return voting.round;
  }

  CourtRoundView _restoreBallot(CourtRoundView round, Object? voted) {
    if (voted == null) return round;
    final contest = round.contests.firstWhere(
      (item) => item.format == CourtFormat.pairBattle,
      orElse: () => throw const FormatException('Invalid court ballot'),
    );
    final action = round.castBallot(
      CourtBallot(
        roundId: round.id,
        memberId: 'sample_cora',
        contestId: contest.id,
        submissionId: voted as String,
      ),
    );
    if (!action.accepted) throw const FormatException('Invalid court ballot');
    return action.round;
  }

  CourtRoundView _finishRound(CourtRoundView round) {
    _clock.advance(const Duration(minutes: 40));
    final action = round.refresh();
    if (!action.accepted ||
        !action.changed ||
        !{
          CourtStatus.finalized,
          CourtStatus.tied,
          CourtStatus.insufficient,
        }.contains(action.round.status) ||
        action.round.results.isEmpty) {
      throw const FormatException('Invalid court final state');
    }
    return action.round;
  }
}
