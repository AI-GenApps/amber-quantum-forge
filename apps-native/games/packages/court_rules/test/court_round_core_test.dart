import 'package:court_rules/court_rules.dart';
import 'package:test/test.dart';

class AcceptingAuthority implements ModerationAuthority {
  @override
  bool approve(ModerationProof proof) =>
      proof.token == 'server-approved' && proof.submissionId == 's1';
}

CourtRoundView round({
  required MutableCourtClock clock,
  int seed = 1,
  bool allowFreeText = false,
  ModerationAuthority authority = const DenyAllModerationAuthority(),
}) => CourtRoundView.open(
  id: 'round-1',
  clock: clock,
  random: SeededCourtRandom(seed),
  roster: const [
    CourtMember('alice'),
    CourtMember('bea'),
    CourtMember('cora'),
    CourtMember('drew'),
  ],
  submissionPolicy: SubmissionPolicy(
    approvedPhraseIds: const {'p1', 'p2'},
    approvedPhraseText: const {'p1': 'blue', 'p2': 'green'},
    allowFreeText: allowFreeText,
  ),
  moderationAuthority: authority,
  mode: CourtMode.quick20,
);

CourtSubmission submission(String id, String memberId) =>
    CourtSubmission(id: id, memberId: memberId, phraseIds: const ['p1']);

void main() {
  test('submission validation enforces approval and one caption', () {
    final clock = MutableCourtClock(DateTime.utc(2026, 1, 1));
    var current = round(clock: clock);
    expect(
      current
          .submit(
            const CourtSubmission(
              id: 'bad',
              memberId: 'alice',
              phraseIds: ['unreviewed'],
            ),
          )
          .errorCode,
      'unapproved_phrase',
    );
    current = current.submit(submission('s1', 'alice')).round;
    expect(
      current.submit(submission('s2', 'alice')).errorCode,
      'one_submission_per_member',
    );
    expect(
      current
          .submit(
            const CourtSubmission(
              id: 's3',
              memberId: 'bea',
              phraseIds: ['p1'],
              freeText: 'free text',
            ),
          )
          .errorCode,
      'free_text_disabled',
    );
  });

  test('free text is pending until an injected authority approves it', () {
    final clock = MutableCourtClock(DateTime.utc(2026, 1, 1));
    var current = round(clock: clock, allowFreeText: true);
    current = current
        .submit(
          const CourtSubmission(
            id: 's1',
            memberId: 'alice',
            phraseIds: ['p1'],
            freeText: 'pending',
          ),
        )
        .round;
    expect(current.submissions['s1']?.state, SubmissionState.pendingModeration);
    expect(
      current
          .approveSubmission(
            const ModerationProof(
              submissionId: 's1',
              token: 'client-claimed-staffed',
            ),
          )
          .errorCode,
      'moderation_not_authorized',
    );
    current =
        round(
              clock: clock,
              allowFreeText: true,
              authority: AcceptingAuthority(),
            )
            .submit(
              const CourtSubmission(
                id: 's1',
                memberId: 'alice',
                phraseIds: ['p1'],
                freeText: 'approved',
              ),
            )
            .round;
    current = current
        .approveSubmission(
          const ModerationProof(submissionId: 's1', token: 'server-approved'),
        )
        .round;
    current = current.submit(submission('s2', 'bea')).round;
    expect(current.freezeSubmissions().accepted, isTrue);
  });

  test('pair voters cannot vote any caption in their own pair', () {
    final clock = MutableCourtClock(DateTime.utc(2026, 1, 1));
    var current = round(clock: clock);
    current = current.submit(submission('s1', 'alice')).round;
    current = current.submit(submission('s2', 'bea')).round;
    current = current.freezeSubmissions().round.beginVoting().round;
    expect(
      current
          .castBallot(
            const CourtBallot(
              roundId: 'round-1',
              memberId: 'bea',
              contestId: 'pair-1',
              submissionId: 's1',
            ),
          )
          .errorCode,
      'member_in_contest',
    );
    current = current
        .castBallot(
          const CourtBallot(
            roundId: 'round-1',
            memberId: 'cora',
            contestId: 'pair-1',
            submissionId: 's1',
          ),
        )
        .round;
    expect(
      current
          .castBallot(
            const CourtBallot(
              roundId: 'round-1',
              memberId: 'cora',
              contestId: 'pair-1',
              submissionId: 's2',
            ),
          )
          .errorCode,
      'duplicate_ballot',
    );
    current = current
        .castBallot(
          const CourtBallot(
            roundId: 'round-1',
            memberId: 'drew',
            contestId: 'pair-1',
            submissionId: 's1',
          ),
        )
        .round;
    clock.advance(const Duration(minutes: 40));
    final finalized = current.finalize().round;
    expect(finalized.status, CourtStatus.finalized);
    expect(finalized.results['pair-1']?.winnerSubmissionId, 's1');
    expect(finalized.finalize().changed, isFalse);
  });

  test('showcase is explicit and never creates a winner or vote', () {
    final clock = MutableCourtClock(DateTime.utc(2026, 1, 1));
    var current = round(clock: clock);
    for (final entry in const [
      ['s1', 'alice'],
      ['s2', 'bea'],
      ['s3', 'cora'],
    ]) {
      current = current.submit(submission(entry[0], entry[1])).round;
    }
    current = current.freezeSubmissions().round.beginVoting().round;
    final pair = current.contests.firstWhere(
      (contest) => contest.format == CourtFormat.pairBattle,
    );
    final showcase = current.contests.firstWhere(
      (contest) => contest.format == CourtFormat.oddShowcase,
    );
    expect(
      current
          .castBallot(
            const CourtBallot(
              roundId: 'round-1',
              memberId: 'drew',
              contestId: '',
              submissionId: '',
            ),
          )
          .errorCode,
      'invalid_candidate',
    );
    expect(
      current
          .castBallot(
            CourtBallot(
              roundId: 'round-1',
              memberId: 'drew',
              contestId: showcase.id,
              submissionId: showcase.submissionIds.single,
            ),
          )
          .errorCode,
      'showcase_not_votable',
    );
    final voter = current.roster.firstWhere(
      (member) => !pair.submissionIds.any(
        (id) => current.submissions[id]?.memberId == member.id,
      ),
    );
    current = current
        .castBallot(
          CourtBallot(
            roundId: 'round-1',
            memberId: voter.id,
            contestId: pair.id,
            submissionId: pair.submissionIds.first,
          ),
        )
        .round;
    clock.advance(const Duration(minutes: 40));
    final finalized = current.finalize().round;
    expect(finalized.status, CourtStatus.finalized);
    expect(
      finalized.results[showcase.id]?.outcome,
      CourtContestOutcome.oddShowcase,
    );
    expect(finalized.results[showcase.id]?.winnerSubmissionId, isNull);
    expect(finalized.results[pair.id]?.outcome, CourtContestOutcome.pairWinner);
  });
}
