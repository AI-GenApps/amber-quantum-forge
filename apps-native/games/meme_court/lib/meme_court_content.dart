class CourtPracticeCaption {
  const CourtPracticeCaption({required this.id, required this.text});

  final String id;
  final String text;
}

class CourtPracticePrompt {
  const CourtPracticePrompt({
    required this.id,
    required this.text,
    required this.captions,
  });

  final String id;
  final String text;
  final List<CourtPracticeCaption> captions;
}

const courtPracticePrompt = CourtPracticePrompt(
  id: 'practice-midnight-snack-001',
  text: 'A friend posts a photo of a midnight snack. Pick the caption that belongs on the practice docket.',
  captions: [
    CourtPracticeCaption(
      id: 'practice-midnight-confidence',
      text: 'Midnight snack, daytime confidence.',
    ),
    CourtPracticeCaption(
      id: 'practice-plate-assignment',
      text: 'The plate understood the assignment.',
    ),
    CourtPracticeCaption(
      id: 'practice-no-crumbs',
      text: 'No crumbs, just evidence.',
    ),
  ],
);

const courtLegacyCaptionId = 'fixture-prompt-001';
const courtLegacyCaptionText =
    'Choose a title for an imaginary local sample round.';

String courtCaptionText(String phraseId) => switch (phraseId) {
  'practice-midnight-confidence' => 'Midnight snack, daytime confidence.',
  'practice-plate-assignment' => 'The plate understood the assignment.',
  'practice-no-crumbs' => 'No crumbs, just evidence.',
  courtLegacyCaptionId => courtLegacyCaptionText,
  _ => 'Caption unavailable.',
};
