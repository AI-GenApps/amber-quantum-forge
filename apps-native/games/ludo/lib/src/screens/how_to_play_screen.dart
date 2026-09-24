/// The how-to-play/rules screen (task 10): a static explainer for a player,
/// not copied from this epic's internal task language. Covers the Classic
/// ruleset (task 01's Context section) plus a short Quick-mode note.
library;

import 'package:flutter/material.dart';

import '../theme/ludo_background_painter.dart';
import '../theme/ludo_text_styles.dart';
import '../widgets/ludo_panel.dart';

const _minTapTarget = 48.0;

/// One rule explainer entry: a short title plus its body text.
final class _RuleEntry {
  const _RuleEntry(this.title, this.body);

  final String title;
  final String body;
}

const _classicRules = [
  _RuleEntry(
    'Getting a token out',
    'Each of your four tokens starts in your yard. Roll a six to move a '
        'token onto the board.',
  ),
  _RuleEntry(
    'Rolling a six',
    'Rolling a six earns you an extra roll right away — but roll three '
        'sixes in a row and your turn ends immediately with no move.',
  ),
  _RuleEntry(
    'Capturing',
    'Land exactly on a square holding an opponent\'s token (outside a '
        'safe star square) to send it back to their yard. A capture also '
        'earns you a bonus roll.',
  ),
  _RuleEntry(
    'Safe squares',
    'Star-marked squares protect every token sitting on them — tokens of '
        'any color can share a safe square with no capture.',
  ),
  _RuleEntry(
    'Getting home',
    'Once a token completes the full lap it turns up its own colored home '
        'column. It must reach the very last square by an exact roll — an '
        'over-shooting roll simply can\'t be used to move that token.',
  ),
  _RuleEntry(
    'Bringing a token home',
    'Getting a token all the way home earns you a bonus roll too.',
  ),
  _RuleEntry(
    'Winning',
    'Bring all four of your tokens home before your opponents to finish in '
        'first place. Play continues for the remaining seats until only '
        'one is left, which is awarded last place automatically. There are '
        'no blockades in this version — tokens never block each other on '
        'shared squares.',
  ),
];

const _quickRules = [
  _RuleEntry(
    'Quick mode',
    'Every token starts already on the board, so there\'s no six needed '
        'to get going, and the home stretch arrives after about half the '
        'usual lap — a much shorter race to the finish. Capturing, safe '
        'squares, bonus rolls and the exact-finish rule all work exactly '
        'the same as Classic.',
  ),
];

/// The how-to-play screen widget.
class HowToPlayScreen extends StatelessWidget {
  const HowToPlayScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('How to play')),
      body: LudoBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('Classic', style: LudoTextStyles.displaySmall),
              const SizedBox(height: 8),
              LudoPanel(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    for (final rule in _classicRules) _RuleTile(rule: rule),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Text('Quick', style: LudoTextStyles.displaySmall),
              const SizedBox(height: 8),
              LudoPanel(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    for (final rule in _quickRules) _RuleTile(rule: rule),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RuleTile extends StatelessWidget {
  const _RuleTile({required this.rule});

  final _RuleEntry rule;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      // `container: true` forces its own semantics node so, now that these
      // tiles sit inside a `LudoPanel`'s plain `Column` (task 12e) rather
      // than as direct `ListView` children, adjacent tiles' labels don't
      // get merged into one combined accessibility label.
      container: true,
      label: '${rule.title}: ${rule.body}',
      excludeSemantics: true,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: _minTapTarget),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(rule.title, style: LudoTextStyles.bodyStrong),
              const SizedBox(height: 4),
              Text(rule.body, style: LudoTextStyles.body),
            ],
          ),
        ),
      ),
    );
  }
}
