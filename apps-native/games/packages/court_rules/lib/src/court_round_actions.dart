part of 'court_round.dart';

extension CourtRoundActions on CourtRoundView {
  CourtActionResult submit(CourtSubmission submission) {
    final active = _refreshStatus();
    if (active.status != CourtStatus.submissionsOpen) {
      return _reject(active, 'submission_window_closed');
    }
    if (!active._memberIds.contains(submission.memberId)) {
      return _reject(active, 'member_not_in_roster');
    }
    if (active.submissions.values.any(
      (item) => item.memberId == submission.memberId,
    )) {
      return _reject(active, 'one_submission_per_member');
    }
    if (active.submissions.containsKey(submission.id) ||
        submission.id.trim().isEmpty) {
      return _reject(active, 'duplicate_submission');
    }
    final error = submissionPolicy.validate(
      phraseIds: submission.phraseIds,
      freeText: submission.freeText,
      policy: policy,
    );
    if (error != null) {
      return _reject(active, error);
    }
    final hasFreeText = submission.freeText?.trim().isNotEmpty ?? false;
    final stored = submission.copyWith(
      state: hasFreeText
          ? SubmissionState.pendingModeration
          : SubmissionState.active,
    );
    return CourtActionResult(
      round: active._copy(
        submissions: {...active.submissions, stored.id: stored},
      ),
      changed: true,
    );
  }

  CourtActionResult approveSubmission(ModerationProof proof) {
    final active = _refreshStatus();
    if (active.status != CourtStatus.submissionsOpen &&
        active.status != CourtStatus.frozen) {
      return _reject(active, 'moderation_window_closed');
    }
    final submission = active.submissions[proof.submissionId];
    if (submission == null ||
        submission.state != SubmissionState.pendingModeration) {
      return _reject(active, 'submission_not_pending');
    }
    if (!active.moderationAuthority.approve(proof)) {
      return _reject(active, 'moderation_not_authorized');
    }
    return CourtActionResult(
      round: active._copy(
        submissions: {
          ...active.submissions,
          proof.submissionId: submission.copyWith(
            state: SubmissionState.active,
          ),
        },
      ),
      changed: true,
    );
  }

  CourtActionResult withdraw(String memberId) {
    final active = _refreshStatus();
    if (active.status == CourtStatus.held ||
        active.status == CourtStatus.cancelled) {
      return _reject(active, 'round_closed');
    }
    final entries = active.submissions.values.where(
      (item) =>
          item.memberId == memberId &&
          (item.state == SubmissionState.active ||
              item.state == SubmissionState.pendingModeration),
    );
    if (entries.isEmpty) {
      return _reject(active, 'submission_not_found');
    }
    final submission = entries.single;
    final submissions = {
      ...active.submissions,
      submission.id: submission.copyWith(state: SubmissionState.withdrawn),
    };
    final affected = active.contests
        .where((contest) => contest.submissionIds.contains(submission.id))
        .map((contest) => contest.id)
        .toSet();
    final shouldInvalidate =
        active.status == CourtStatus.frozen ||
        active.status == CourtStatus.votingOpen;
    final remaining = submissions.values.any(
      (item) =>
          item.state == SubmissionState.active ||
          item.state == SubmissionState.pendingModeration,
    );
    final nextStatus =
        !remaining &&
            active.contests.isEmpty &&
            active.status != CourtStatus.finalized &&
            active.status != CourtStatus.tied
        ? CourtStatus.withdrawn
        : active.status;
    return CourtActionResult(
      round: active._copy(
        submissions: submissions,
        status: nextStatus,
        invalidContestIds: shouldInvalidate
            ? {...active.invalidContestIds, ...affected}
            : active.invalidContestIds,
      ),
      changed: true,
    );
  }

  CourtActionResult freezeSubmissions() {
    final active = _refreshStatus();
    if (active.status == CourtStatus.frozen) {
      return CourtActionResult(round: active, changed: false);
    }
    if (active.status != CourtStatus.submissionsOpen) {
      return _reject(active, 'cannot_freeze');
    }
    if (active._activeSubmissions.length < 2) {
      return _copyResult(active, CourtStatus.insufficient);
    }
    return CourtActionResult(
      round: active._copy(status: CourtStatus.frozen),
      changed: true,
    );
  }

  CourtActionResult beginVoting({CourtFormat? format}) {
    final active = _refreshStatus();
    if (active.status != CourtStatus.frozen) {
      return _reject(active, 'not_frozen');
    }
    final selected = [...active._activeSubmissions];
    final random = active.random.fork();
    for (var index = selected.length - 1; index > 0; index--) {
      final swapIndex = random.nextInt(index + 1);
      final value = selected[index];
      selected[index] = selected[swapIndex];
      selected[swapIndex] = value;
    }
    final contests = <CourtContest>[];
    for (var index = 0; index < selected.length; index += 2) {
      if (selected.length - index == 1) {
        contests.add(
          CourtContest(
            id: 'showcase-' + selected[index].id,
            submissionIds: [selected[index].id],
            format: CourtFormat.oddShowcase,
          ),
        );
      } else {
        contests.add(
          CourtContest(
            id: 'pair-' + (index ~/ 2 + 1).toString(),
            submissionIds: [selected[index].id, selected[index + 1].id],
            format: CourtFormat.pairBattle,
          ),
        );
      }
    }
    return CourtActionResult(
      round: active._copy(
        status: CourtStatus.votingOpen,
        format: format ?? CourtFormat.pairBattle,
        random: random,
        contests: contests,
      ),
      changed: true,
    );
  }

  CourtActionResult castBallot(CourtBallot ballot) {
    final active = _refreshStatus();
    if (active.status != CourtStatus.votingOpen) {
      return _reject(active, 'voting_closed');
    }
    if (!active.clock.now.isBefore(active.votingDeadline)) {
      return _reject(active, 'voting_window_closed');
    }
    if (ballot.roundId != id) {
      return _reject(active, 'wrong_round');
    }
    if (!active._memberIds.contains(ballot.memberId)) {
      return _reject(active, 'member_not_in_roster');
    }
    final matching = active.contests.where(
      (item) => item.id == ballot.contestId,
    );
    if (matching.isEmpty) {
      return _reject(active, 'invalid_candidate');
    }
    final contest = matching.single;
    if (active.invalidContestIds.contains(contest.id)) {
      return _reject(active, 'contest_invalidated');
    }
    if (contest.format == CourtFormat.oddShowcase) {
      return _reject(active, 'showcase_not_votable');
    }
    final ownsContest = contest.submissionIds.any(
      (submissionId) =>
          active.submissions[submissionId]?.memberId == ballot.memberId,
    );
    if (ownsContest) {
      return _reject(active, 'member_in_contest');
    }
    if (!contest.submissionIds.contains(ballot.submissionId)) {
      return _reject(active, 'invalid_candidate');
    }
    final candidate = active.submissions[ballot.submissionId];
    if (candidate == null || candidate.state != SubmissionState.active) {
      return _reject(active, 'candidate_withdrawn');
    }
    final key = ballot.memberId + ':' + ballot.contestId;
    if (active.ballots.containsKey(key)) {
      return _reject(active, 'duplicate_ballot');
    }
    return CourtActionResult(
      round: active._copy(ballots: {...active.ballots, key: ballot}),
      changed: true,
    );
  }

  CourtActionResult _reject(CourtRoundView active, String code) =>
      CourtActionResult(round: active, changed: false, errorCode: code);

  CourtActionResult _copyResult(
    CourtRoundView active,
    CourtStatus nextStatus,
  ) =>
      CourtActionResult(round: active._copy(status: nextStatus), changed: true);
}
