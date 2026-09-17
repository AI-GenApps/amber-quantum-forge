import 'package:court_rules/court_rules.dart';
import 'package:flutter/material.dart';

import 'meme_court_theme.dart';

export 'meme_court_submission_cards.dart';

class CourtVoteCard extends StatelessWidget {
  const CourtVoteCard({
    required this.round,
    required this.selectedSubmissionId,
    required this.captionForPhrase,
    required this.onVote,
    required this.onReveal,
    super.key,
  });

  final CourtRoundView round;
  final String? selectedSubmissionId;
  final String Function(String phraseId) captionForPhrase;
  final ValueChanged<String> onVote;
  final VoidCallback? onReveal;

  @override
  Widget build(BuildContext context) {
    final contest = round.contests.firstWhere(
      (item) => item.format == CourtFormat.pairBattle,
    );
    return CourtPanel(
      color: CourtDesign.mustard,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('The room is listening', style: _title(context)),
          const SizedBox(height: 6),
          Text(
            'Pick the line that wins the room. One ballot decides this round.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 15),
          for (final submissionId in contest.submissionIds) ...[
            _VoteOption(
              label: _authorFor(round, submissionId),
              caption: _captionFor(round, submissionId),
              selected: selectedSubmissionId == submissionId,
              onTap: () => onVote(submissionId),
            ),
            const SizedBox(height: 9),
          ],
          const SizedBox(height: 4),
          FilledButton(
            onPressed: selectedSubmissionId == null ? null : onReveal,
            child: const Text('Reveal the verdict'),
          ),
        ],
      ),
    );
  }

  String _authorFor(CourtRoundView value, String id) {
    final memberId = value.submissions[id]?.memberId;
    return switch (memberId) {
      'sample_alice' => 'Alice’s caption',
      'sample_bea' => 'Bea’s caption',
      _ => 'Caption',
    };
  }

  String _captionFor(CourtRoundView value, String id) {
    final submission = value.submissions[id];
    if (submission == null || submission.phraseIds.isEmpty) {
      return 'Caption unavailable.';
    }
    return captionForPhrase(submission.phraseIds.first);
  }
}

class _VoteOption extends StatelessWidget {
  const _VoteOption({
    required this.label,
    required this.caption,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final String caption;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onTap,
      style: OutlinedButton.styleFrom(
        backgroundColor: selected ? Colors.white : Colors.transparent,
        side: BorderSide(color: CourtDesign.ink, width: selected ? 2.5 : 1.4),
      ),
      child: Row(
        children: [
          Icon(
            selected
                ? Icons.radio_button_checked_rounded
                : Icons.radio_button_unchecked_rounded,
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: _title(context)),
                const SizedBox(height: 3),
                Text(caption, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class CourtResultCard extends StatelessWidget {
  const CourtResultCard({
    required this.round,
    required this.captionForPhrase,
    required this.onReset,
    super.key,
  });

  final CourtRoundView round;
  final String Function(String phraseId) captionForPhrase;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    CourtContestResult? result;
    for (final candidate in round.results.values) {
      if (!candidate.isShowcase) {
        result = candidate;
        break;
      }
    }
    final winnerSubmissionId = result?.winnerSubmissionId;
    final winner = winnerSubmissionId == null
        ? 'No winner this round'
        : switch (round.submissions[winnerSubmissionId]?.memberId) {
            'sample_alice' => 'Alice’s caption takes the bench',
            'sample_bea' => 'Bea’s caption takes the bench',
            _ => 'The round has a result',
          };
    final winningSubmission = winnerSubmissionId == null
        ? null
        : round.submissions[winnerSubmissionId];
    final caption =
        winningSubmission == null || winningSubmission.phraseIds.isEmpty
        ? null
        : captionForPhrase(winningSubmission.phraseIds.first);
    final detail = result == null
        ? 'The verdict needs a fresh round.'
        : switch (result.outcome) {
            CourtContestOutcome.pairWinner => 'The room picked a winner.',
            CourtContestOutcome.tie => 'The room split the vote.',
            CourtContestOutcome.noVotes => 'No vote landed in time.',
            _ => 'The round is closed.',
          };
    return CourtPanel(
      color: CourtDesign.mint,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.emoji_events_rounded, size: 34),
          const SizedBox(height: 8),
          Text('Verdict', style: _title(context)),
          const SizedBox(height: 5),
          Text(winner, style: Theme.of(context).textTheme.titleLarge),
          if (caption != null) ...[
            const SizedBox(height: 6),
            Text('“$caption”', style: Theme.of(context).textTheme.bodyLarge),
          ],
          const SizedBox(height: 5),
          Text(detail, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 14),
          OutlinedButton(
            onPressed: onReset,
            child: const Text('Start another round'),
          ),
        ],
      ),
    );
  }
}

TextStyle _title(BuildContext context) =>
    Theme.of(context).textTheme.titleLarge!.copyWith(fontSize: 19);
