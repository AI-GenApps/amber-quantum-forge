enum CourtStatus {
  draft,
  submissionsOpen,
  frozen,
  votingOpen,
  finalized,
  tied,
  insufficient,
  cancelled,
  held,
  withdrawn,
}

enum CourtMode { standard, quick20, quick40 }

enum CourtFormat { pairBattle, oddShowcase }

enum SubmissionState { active, pendingModeration, withdrawn, rejected }

enum CourtContestOutcome {
  pairWinner,
  tie,
  noVotes,
  oddShowcase,
  withdrawn,
  held,
  cancelled,
}

class CourtMember {
  const CourtMember(this.id, {this.displayName});

  final String id;
  final String? displayName;
}

class CourtPolicy {
  const CourtPolicy({
    this.submissionWindow = const Duration(hours: 24),
    this.votingWindow = const Duration(hours: 24),
    this.maxPhrases = 6,
    this.maxGraphemes = 160,
    this.minimumMembers = 3,
    this.maximumMembers = 16,
  });

  final Duration submissionWindow;
  final Duration votingWindow;
  final int maxPhrases;
  final int maxGraphemes;
  final int minimumMembers;
  final int maximumMembers;

  CourtPolicy forMode(CourtMode mode) {
    final duration = switch (mode) {
      CourtMode.standard => const Duration(hours: 24),
      CourtMode.quick20 => const Duration(minutes: 20),
      CourtMode.quick40 => const Duration(minutes: 40),
    };
    return CourtPolicy(
      submissionWindow: duration,
      votingWindow: duration,
      maxPhrases: maxPhrases,
      maxGraphemes: maxGraphemes,
      minimumMembers: minimumMembers,
      maximumMembers: maximumMembers,
    );
  }
}

class ModerationProof {
  const ModerationProof({required this.submissionId, required this.token});

  final String submissionId;
  final String token;
}

abstract interface class ModerationAuthority {
  bool approve(ModerationProof proof);
}

class DenyAllModerationAuthority implements ModerationAuthority {
  const DenyAllModerationAuthority();

  @override
  bool approve(ModerationProof proof) => false;
}

class SubmissionPolicy {
  SubmissionPolicy({
    required Set<String> approvedPhraseIds,
    Map<String, String> approvedPhraseText = const {},
    this.allowFreeText = false,
  }) : approvedPhraseIds = Set.unmodifiable(approvedPhraseIds),
       approvedPhraseText = Map.unmodifiable(approvedPhraseText);

  final Set<String> approvedPhraseIds;
  final Map<String, String> approvedPhraseText;
  final bool allowFreeText;

  String? validate({
    required List<String> phraseIds,
    required String? freeText,
    required CourtPolicy policy,
  }) {
    if (phraseIds.isEmpty && (freeText == null || freeText.trim().isEmpty)) {
      return 'empty_submission';
    }
    if (phraseIds.length > policy.maxPhrases) {
      return 'phrase_limit';
    }
    if (phraseIds.any((id) => !approvedPhraseIds.contains(id))) {
      return 'unapproved_phrase';
    }
    if (freeText != null && freeText.trim().isNotEmpty && !allowFreeText) {
      return 'free_text_disabled';
    }
    final phraseText = phraseIds.map((id) => approvedPhraseText[id] ?? id);
    final total = _graphemeCount(
      [...phraseText, if (freeText != null) freeText].join(' '),
    );
    if (total > policy.maxGraphemes) {
      return 'grapheme_limit';
    }
    return null;
  }
}

class CourtSubmission {
  const CourtSubmission({
    required this.id,
    required this.memberId,
    required this.phraseIds,
    this.freeText,
    this.state = SubmissionState.active,
  });

  final String id;
  final String memberId;
  final List<String> phraseIds;
  final String? freeText;
  final SubmissionState state;

  CourtSubmission copyWith({SubmissionState? state}) => CourtSubmission(
    id: id,
    memberId: memberId,
    phraseIds: phraseIds,
    freeText: freeText,
    state: state ?? this.state,
  );
}

class CourtContest {
  const CourtContest({
    required this.id,
    required this.submissionIds,
    required this.format,
  });

  final String id;
  final List<String> submissionIds;
  final CourtFormat format;
}

class CourtBallot {
  const CourtBallot({
    required this.roundId,
    required this.memberId,
    required this.contestId,
    required this.submissionId,
  });

  final String roundId;
  final String memberId;
  final String contestId;
  final String submissionId;
}

class CourtContestResult {
  const CourtContestResult({
    required this.contestId,
    required this.winnerSubmissionId,
    required this.voteCounts,
    required this.outcome,
  });

  final String contestId;
  final String? winnerSubmissionId;
  final Map<String, int> voteCounts;
  final CourtContestOutcome outcome;

  bool get tie => outcome == CourtContestOutcome.tie;

  bool get noVotes => outcome == CourtContestOutcome.noVotes;

  bool get isShowcase => outcome == CourtContestOutcome.oddShowcase;
}

int _graphemeCount(String value) {
  var count = 0;
  var previousWasRegional = false;
  for (final rune in value.runes) {
    if (rune == 0x200d || _isVariationSelector(rune) || _isCombining(rune)) {
      continue;
    }
    if (_isRegionalIndicator(rune)) {
      if (!previousWasRegional) {
        count++;
      }
      previousWasRegional = !previousWasRegional;
      continue;
    }
    previousWasRegional = false;
    count++;
  }
  return count;
}

bool _isCombining(int rune) =>
    (rune >= 0x300 && rune <= 0x36f) ||
    (rune >= 0x1ab0 && rune <= 0x1aff) ||
    (rune >= 0x1dc0 && rune <= 0x1dff) ||
    (rune >= 0x20d0 && rune <= 0x20ff) ||
    (rune >= 0xfe20 && rune <= 0xfe2f);

bool _isVariationSelector(int rune) =>
    (rune >= 0xfe00 && rune <= 0xfe0f) || (rune >= 0xe0100 && rune <= 0xe01ef);

bool _isRegionalIndicator(int rune) => rune >= 0x1f1e6 && rune <= 0x1f1ff;
