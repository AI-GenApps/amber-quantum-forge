import 'package:flutter/material.dart';

import 'meme_court_content.dart';
import 'meme_court_theme.dart';

class CourtComposerCard extends StatelessWidget {
  const CourtComposerCard({
    required this.submissionCount,
    required this.aliceSubmitted,
    required this.beaSubmitted,
    required this.selectedAlicePhraseId,
    required this.selectedBeaPhraseId,
    required this.onAlice,
    required this.onBea,
    required this.onFreeze,
    super.key,
  });

  final int submissionCount;
  final bool aliceSubmitted;
  final bool beaSubmitted;
  final String? selectedAlicePhraseId;
  final String? selectedBeaPhraseId;
  final ValueChanged<String>? onAlice;
  final ValueChanged<String>? onBea;
  final VoidCallback? onFreeze;

  @override
  Widget build(BuildContext context) {
    return CourtPanel(
      color: CourtDesign.lilac,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Choose the room’s opening line',
            style: _submissionTitle(context),
          ),
          const SizedBox(height: 6),
          Text(
            'Pick a sharp line for Alice and Bea. Keep it playful.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 15),
          _CourtPlayerPicker(
            author: 'Alice',
            captions: courtPracticePrompt.captions,
            selectedPhraseId: selectedAlicePhraseId,
            unavailablePhraseId: selectedBeaPhraseId,
            submitted: aliceSubmitted,
            onSelect: onAlice,
            color: CourtDesign.coral,
          ),
          const SizedBox(height: 15),
          _CourtPlayerPicker(
            author: 'Bea',
            captions: courtPracticePrompt.captions,
            selectedPhraseId: selectedBeaPhraseId,
            unavailablePhraseId: selectedAlicePhraseId,
            submitted: beaSubmitted,
            onSelect: onBea,
            color: CourtDesign.mustard,
          ),
          const SizedBox(height: 15),
          Text(
            '$submissionCount of 2 captions ready',
            style: const TextStyle(
              color: CourtDesign.ink,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 10),
          FilledButton(
            onPressed: onFreeze,
            child: const Text('Freeze the captions'),
          ),
        ],
      ),
    );
  }
}

class _CourtPlayerPicker extends StatelessWidget {
  const _CourtPlayerPicker({
    required this.author,
    required this.captions,
    required this.selectedPhraseId,
    required this.unavailablePhraseId,
    required this.submitted,
    required this.onSelect,
    required this.color,
  });

  final String author;
  final List<CourtPracticeCaption> captions;
  final String? selectedPhraseId;
  final String? unavailablePhraseId;
  final bool submitted;
  final ValueChanged<String>? onSelect;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final options = [
      if (selectedPhraseId == courtLegacyCaptionId)
        const CourtPracticeCaption(
          id: courtLegacyCaptionId,
          text: courtLegacyCaptionText,
        ),
      ...captions,
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('$author’s pick', style: _submissionTitle(context)),
        const SizedBox(height: 7),
        for (final caption in options) ...[
          CourtCaptionTile(
            author: author,
            caption: caption.text,
            color: color,
            selected: selectedPhraseId == caption.id,
            unavailable: !submitted && unavailablePhraseId == caption.id,
            onTap: submitted || unavailablePhraseId == caption.id
                ? null
                : () => onSelect?.call(caption.id),
          ),
          const SizedBox(height: 8),
        ],
        if (submitted)
          const Text(
            'On the docket',
            style: TextStyle(
              color: CourtDesign.ink,
              fontSize: 12,
              fontWeight: FontWeight.w800,
            ),
          ),
      ],
    );
  }
}

class CourtCaptionTile extends StatelessWidget {
  const CourtCaptionTile({
    required this.author,
    required this.caption,
    required this.color,
    required this.onTap,
    this.selected = false,
    this.unavailable = false,
    super.key,
  });

  final String author;
  final String caption;
  final Color color;
  final VoidCallback? onTap;
  final bool selected;
  final bool unavailable;

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return Semantics(
      button: enabled,
      enabled: enabled,
      selected: selected,
      label: '$author caption: $caption',
      child: Material(
        color: selected ? color : Colors.white,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: CourtDesign.ink,
                width: selected ? 2.3 : 1.2,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  selected
                      ? Icons.check_circle_rounded
                      : unavailable
                      ? Icons.block_rounded
                      : Icons.add_circle_outline_rounded,
                  color: CourtDesign.ink,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    caption,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
                if (selected)
                  const Text(
                    'Picked',
                    style: TextStyle(
                      color: CourtDesign.ink,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                if (unavailable)
                  const Text(
                    'Taken',
                    style: TextStyle(
                      color: CourtDesign.ink,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

TextStyle _submissionTitle(BuildContext context) =>
    Theme.of(context).textTheme.titleLarge!.copyWith(fontSize: 19);
