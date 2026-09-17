import 'court_clock.dart';
import 'court_model.dart';
import 'court_random.dart';

part 'court_round_actions.dart';
part 'court_round_outcomes.dart';

class CourtActionResult {
  const CourtActionResult({
    required this.round,
    required this.changed,
    this.errorCode,
  });

  final CourtRoundView round;
  final bool changed;
  final String? errorCode;

  bool get accepted => errorCode == null;
}

class CourtRoundView {
  CourtRoundView._({
    required this.id,
    required this.clock,
    required this.random,
    required this.policy,
    required this.submissionPolicy,
    required this.moderationAuthority,
    required this.roster,
    required this.status,
    required this.mode,
    required this.format,
    required this.startsAt,
    required this.submissionDeadline,
    required this.votingDeadline,
    required this.submissions,
    required this.contests,
    required this.invalidContestIds,
    required this.ballots,
    required this.results,
  });

  final String id;
  final CourtClock clock;
  final CourtRandom random;
  final CourtPolicy policy;
  final SubmissionPolicy submissionPolicy;
  final ModerationAuthority moderationAuthority;
  final List<CourtMember> roster;
  final CourtStatus status;
  final CourtMode mode;
  final CourtFormat? format;
  final DateTime startsAt;
  final DateTime submissionDeadline;
  final DateTime votingDeadline;
  final Map<String, CourtSubmission> submissions;
  final List<CourtContest> contests;
  final Set<String> invalidContestIds;
  final Map<String, CourtBallot> ballots;
  final Map<String, CourtContestResult> results;

  static CourtRoundView open({
    required String id,
    required CourtClock clock,
    required CourtRandom random,
    required List<CourtMember> roster,
    required SubmissionPolicy submissionPolicy,
    ModerationAuthority moderationAuthority =
        const DenyAllModerationAuthority(),
    CourtMode mode = CourtMode.standard,
    CourtPolicy policy = const CourtPolicy(),
  }) {
    final ids = roster.map((member) => member.id).toSet();
    if (id.trim().isEmpty ||
        roster.length < policy.minimumMembers ||
        roster.length > policy.maximumMembers ||
        ids.length != roster.length ||
        roster.any((member) => member.id.trim().isEmpty)) {
      throw ArgumentError('invalid_roster_or_round');
    }
    final effectivePolicy = policy.forMode(mode);
    final startsAt = clock.now;
    return CourtRoundView._(
      id: id,
      clock: clock,
      random: random,
      policy: effectivePolicy,
      submissionPolicy: submissionPolicy,
      moderationAuthority: moderationAuthority,
      roster: List.unmodifiable(roster),
      status: CourtStatus.submissionsOpen,
      mode: mode,
      format: null,
      startsAt: startsAt,
      submissionDeadline: startsAt.add(effectivePolicy.submissionWindow),
      votingDeadline: startsAt.add(
        effectivePolicy.submissionWindow + effectivePolicy.votingWindow,
      ),
      submissions: const {},
      contests: const [],
      invalidContestIds: const {},
      ballots: const {},
      results: const {},
    );
  }

  Set<String> get _memberIds => roster.map((member) => member.id).toSet();

  List<CourtSubmission> get _activeSubmissions => submissions.values
      .where((submission) => submission.state == SubmissionState.active)
      .toList(growable: false);

  CourtRoundView _refreshStatus() {
    if (status == CourtStatus.submissionsOpen &&
        !clock.now.isBefore(submissionDeadline)) {
      return _copy(
        status: _activeSubmissions.length < 2
            ? CourtStatus.insufficient
            : CourtStatus.frozen,
      );
    }
    return this;
  }

  CourtRoundView _copy({
    CourtStatus? status,
    CourtMode? mode,
    CourtFormat? format,
    CourtRandom? random,
    ModerationAuthority? moderationAuthority,
    Map<String, CourtSubmission>? submissions,
    List<CourtContest>? contests,
    Set<String>? invalidContestIds,
    Map<String, CourtBallot>? ballots,
    Map<String, CourtContestResult>? results,
  }) => CourtRoundView._(
    id: id,
    clock: clock,
    random: random ?? this.random,
    policy: policy,
    submissionPolicy: submissionPolicy,
    moderationAuthority: moderationAuthority ?? this.moderationAuthority,
    roster: roster,
    status: status ?? this.status,
    mode: mode ?? this.mode,
    format: format ?? this.format,
    startsAt: startsAt,
    submissionDeadline: submissionDeadline,
    votingDeadline: votingDeadline,
    submissions: Map.unmodifiable(submissions ?? this.submissions),
    contests: List.unmodifiable(contests ?? this.contests),
    invalidContestIds: Set.unmodifiable(
      invalidContestIds ?? this.invalidContestIds,
    ),
    ballots: Map.unmodifiable(ballots ?? this.ballots),
    results: Map.unmodifiable(results ?? this.results),
  );

  static const _terminalStatuses = {
    CourtStatus.finalized,
    CourtStatus.tied,
    CourtStatus.insufficient,
    CourtStatus.cancelled,
    CourtStatus.held,
    CourtStatus.withdrawn,
  };
}
