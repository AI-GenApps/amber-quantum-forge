import 'package:court_rules/court_rules.dart';
import 'package:test/test.dart';

CourtRoundView safetyRound({required MutableCourtClock clock, int seed = 1}) =>
    CourtRoundView.open(
      id: 'round-1',
      clock: clock,
      random: SeededCourtRandom(seed),
      roster: const [
        CourtMember('alice'),
        CourtMember('bea'),
        CourtMember('cora'),
        CourtMember('drew'),
      ],
      submissionPolicy: SubmissionPolicy(approvedPhraseIds: const {'p1'}),
      mode: CourtMode.quick20,
    );

CourtSubmission safetySubmission(String id, String memberId) =>
    CourtSubmission(id: id, memberId: memberId, phraseIds: const ['p1']);

CourtRoundView fourSubmissionRound(MutableCourtClock clock, {int seed = 1}) {
  var current = safetyRound(clock: clock, seed: seed);
  for (final entry in const [
    ['s1', 'alice'],
    ['s2', 'bea'],
    ['s3', 'cora'],
    ['s4', 'drew'],
  ]) {
    current = current.submit(safetySubmission(entry[0], entry[1])).round;
  }
  return current.freezeSubmissions().round.beginVoting().round;
}

void main() {
  test(
    'withdrawal invalidates pending pairs but preserves completed totals',
    () {
      final clock = MutableCourtClock(DateTime.utc(2026, 1, 1));
      var current = fourSubmissionRound(clock);
      final first = current.contests[0];
      final second = current.contests[1];
      final withdrawnMember =
          current.submissions[first.submissionIds.first]!.memberId;
      current = current.withdraw(withdrawnMember).round;
      expect(current.invalidContestIds, contains(first.id));
      expect(
        current
            .castBallot(
              CourtBallot(
                roundId: 'round-1',
                memberId: current.roster
                    .firstWhere((member) => member.id != withdrawnMember)
                    .id,
                contestId: first.id,
                submissionId: first.submissionIds.last,
              ),
            )
            .errorCode,
        'contest_invalidated',
      );
      final voter = current.roster.firstWhere(
        (member) => !second.submissionIds.any(
          (id) => current.submissions[id]?.memberId == member.id,
        ),
      );
      current = current
          .castBallot(
            CourtBallot(
              roundId: 'round-1',
              memberId: voter.id,
              contestId: second.id,
              submissionId: second.submissionIds.first,
            ),
          )
          .round;
      clock.advance(const Duration(minutes: 40));
      final finalized = current.finalize().round;
      expect(finalized.status, CourtStatus.finalized);
      expect(
        finalized.results[first.id]?.outcome,
        CourtContestOutcome.withdrawn,
      );
      expect(
        finalized.results[second.id]?.outcome,
        CourtContestOutcome.pairWinner,
      );
      final winnerMember = finalized
          .submissions[finalized.results[second.id]!.winnerSubmissionId]!
          .memberId;
      final completed = finalized.withdraw(winnerMember).round;
      expect(
        completed.results[second.id]?.outcome,
        CourtContestOutcome.pairWinner,
      );
      expect(
        completed.submissions.values.any(
          (item) =>
              item.memberId == winnerMember &&
              item.state == SubmissionState.withdrawn,
        ),
        isTrue,
      );
    },
  );

  test('held rounds reject future ballots and expose held contests', () {
    final clock = MutableCourtClock(DateTime.utc(2026, 1, 1));
    var current = safetyRound(clock: clock);
    current = current.submit(safetySubmission('s1', 'alice')).round;
    current = current.submit(safetySubmission('s2', 'bea')).round;
    current = current.freezeSubmissions().round.beginVoting().round;
    current = current.hold().round;
    expect(current.status, CourtStatus.held);
    expect(
      current
          .castBallot(
            const CourtBallot(
              roundId: 'round-1',
              memberId: 'cora',
              contestId: 'pair-1',
              submissionId: 's1',
            ),
          )
          .errorCode,
      'voting_closed',
    );
    expect(current.results['pair-1']?.outcome, CourtContestOutcome.held);
  });

  test('seeded pairing is reproducible', () {
    final first = fourSubmissionRound(
      MutableCourtClock(DateTime.utc(2026, 1, 1)),
      seed: 42,
    );
    final second = fourSubmissionRound(
      MutableCourtClock(DateTime.utc(2026, 1, 1)),
      seed: 42,
    );
    expect(
      first.contests.map((contest) => contest.submissionIds).toList(),
      second.contests.map((contest) => contest.submissionIds).toList(),
    );
  });

  test('clock closes a submission window without accepting late writes', () {
    final clock = MutableCourtClock(DateTime.utc(2026, 1, 1));
    final current = safetyRound(clock: clock);
    clock.advance(const Duration(minutes: 20));
    expect(current.refresh().round.status, CourtStatus.insufficient);
    expect(
      current.submit(safetySubmission('late', 'alice')).errorCode,
      'submission_window_closed',
    );
  });
}
