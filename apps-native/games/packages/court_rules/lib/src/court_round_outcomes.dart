part of 'court_round.dart';

extension CourtRoundOutcomes on CourtRoundView {
  CourtActionResult finalize() {
    final active = _refreshStatus();
    if (CourtRoundView._terminalStatuses.contains(active.status)) {
      return CourtActionResult(round: active, changed: false);
    }
    if (active.status != CourtStatus.votingOpen) {
      return _reject(active, 'not_voting');
    }
    if (active.clock.now.isBefore(active.votingDeadline)) {
      return _reject(active, 'deadline_not_reached');
    }
    final results = <String, CourtContestResult>{};
    var hasTie = false;
    var hasNoVotes = false;
    var hasPairWinner = false;
    var hasInvalid = false;
    for (final contest in active.contests) {
      if (contest.format == CourtFormat.oddShowcase) {
        results[contest.id] = CourtContestResult(
          contestId: contest.id,
          winnerSubmissionId: null,
          voteCounts: const {},
          outcome: CourtContestOutcome.oddShowcase,
        );
        continue;
      }
      final invalid =
          active.invalidContestIds.contains(contest.id) ||
          contest.submissionIds.any(
            (id) => active.submissions[id]?.state != SubmissionState.active,
          );
      if (invalid) {
        hasInvalid = true;
        results[contest.id] = CourtContestResult(
          contestId: contest.id,
          winnerSubmissionId: null,
          voteCounts: const {},
          outcome: CourtContestOutcome.withdrawn,
        );
        continue;
      }
      final counts = <String, int>{
        for (final submissionId in contest.submissionIds) submissionId: 0,
      };
      for (final ballot in active.ballots.values.where(
        (item) => item.contestId == contest.id,
      )) {
        counts[ballot.submissionId] = (counts[ballot.submissionId] ?? 0) + 1;
      }
      final highest = counts.values.fold<int>(
        0,
        (current, value) => value > current ? value : current,
      );
      final winners = counts.entries
          .where((entry) => entry.value == highest && highest > 0)
          .map((entry) => entry.key)
          .toList();
      if (winners.isEmpty) {
        hasNoVotes = true;
        results[contest.id] = CourtContestResult(
          contestId: contest.id,
          winnerSubmissionId: null,
          voteCounts: counts,
          outcome: CourtContestOutcome.noVotes,
        );
      } else if (winners.length > 1) {
        hasTie = true;
        results[contest.id] = CourtContestResult(
          contestId: contest.id,
          winnerSubmissionId: null,
          voteCounts: counts,
          outcome: CourtContestOutcome.tie,
        );
      } else {
        hasPairWinner = true;
        results[contest.id] = CourtContestResult(
          contestId: contest.id,
          winnerSubmissionId: winners.single,
          voteCounts: counts,
          outcome: CourtContestOutcome.pairWinner,
        );
      }
    }
    final status = hasTie
        ? CourtStatus.tied
        : hasNoVotes || (!hasPairWinner && hasInvalid)
        ? CourtStatus.insufficient
        : CourtStatus.finalized;
    return CourtActionResult(
      round: active._copy(status: status, results: results),
      changed: true,
    );
  }

  CourtActionResult hold() =>
      _closeWithOutcome(CourtStatus.held, CourtContestOutcome.held);

  CourtActionResult cancel() =>
      _closeWithOutcome(CourtStatus.cancelled, CourtContestOutcome.cancelled);

  CourtActionResult refresh() {
    if (status == CourtStatus.votingOpen &&
        !clock.now.isBefore(votingDeadline)) {
      return finalize();
    }
    final next = _refreshStatus();
    return CourtActionResult(round: next, changed: next.status != status);
  }

  Map<String, Object?> toJson() => {
    'id': id,
    'status': status.name,
    'mode': mode.name,
    'format': format?.name,
    'submission_deadline': submissionDeadline.toIso8601String(),
    'voting_deadline': votingDeadline.toIso8601String(),
    'submission_ids': submissions.keys.toList(),
    'submission_states': {
      for (final entry in submissions.entries)
        entry.key: entry.value.state.name,
    },
    'contest_ids': contests.map((item) => item.id).toList(),
    'invalid_contest_ids': invalidContestIds.toList(),
    'ballot_count': ballots.length,
    'result_ids': results.keys.toList(),
  };

  CourtActionResult _closeWithOutcome(
    CourtStatus nextStatus,
    CourtContestOutcome outcome,
  ) {
    final active = _refreshStatus();
    if (CourtRoundView._terminalStatuses.contains(active.status)) {
      return CourtActionResult(round: active, changed: false);
    }
    final results = {
      ...active.results,
      for (final contest in active.contests)
        contest.id: CourtContestResult(
          contestId: contest.id,
          winnerSubmissionId: null,
          voteCounts: const {},
          outcome: outcome,
        ),
    };
    return CourtActionResult(
      round: active._copy(status: nextStatus, results: results),
      changed: true,
    );
  }

  CourtActionResult _reject(CourtRoundView active, String code) =>
      CourtActionResult(round: active, changed: false, errorCode: code);
}
