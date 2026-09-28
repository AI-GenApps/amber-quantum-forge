import 'package:flutter/material.dart';

import 'meme_court_typography.dart';

abstract final class CourtDesign {
  static const ink = Color(0xFF18233A);
  static const parchment = Color(0xFFFFF4D8);
  static const coral = Color(0xFFF45B69);
  static const mustard = Color(0xFFF4C95D);
  static const mint = Color(0xFFB5EAD7);
  static const lilac = Color(0xFFD8CCFF);

  static ThemeData theme() {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: coral,
        brightness: Brightness.light,
        surface: parchment,
      ),
      scaffoldBackgroundColor: parchment,
      // Sets Lexend as the default for every Material widget (buttons,
      // list tiles, and any `textTheme` role left unset below); Bangers is
      // then layered on top of the display roles explicitly (task 04).
      fontFamily: MemeCourtTypography.bodyFamily,
      appBarTheme: const AppBarTheme(
        backgroundColor: parchment,
        foregroundColor: ink,
        elevation: 0,
      ),
      cardTheme: const CardThemeData(
        color: Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: ink,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          // A `FilledButton`'s resolved `textStyle` becomes its child's
          // ambient `DefaultTextStyle` outright (Material.build() does not
          // merge it with the theme's default), so `fontFamily` must be
          // set explicitly here or the label falls back to the platform
          // default font.
          textStyle: MemeCourtTypography.body(
            const TextStyle(fontWeight: FontWeight.w800),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: ink,
          minimumSize: const Size.fromHeight(48),
          side: const BorderSide(color: ink, width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
      textTheme: TextTheme(
        headlineMedium: MemeCourtTypography.heading(
          const TextStyle(
            color: ink,
            fontSize: 30,
            fontWeight: FontWeight.w900,
            height: 1.05,
          ),
        ),
        titleLarge: MemeCourtTypography.heading(
          const TextStyle(
            color: ink,
            fontSize: 21,
            fontWeight: FontWeight.w900,
          ),
        ),
        bodyLarge: const TextStyle(color: ink, fontSize: 16, height: 1.35),
        bodyMedium: const TextStyle(color: ink, fontSize: 14, height: 1.3),
      ),
      useMaterial3: true,
    );
  }
}

class CourtPanel extends StatelessWidget {
  const CourtPanel({required this.color, required this.child, super.key});

  final Color color;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: CourtDesign.ink, width: 1.7),
      ),
      child: child,
    );
  }
}

class CourtHeader extends StatelessWidget {
  const CourtHeader({required this.status, required this.prompt, super.key});

  final String status;
  final String prompt;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const CourtPill(label: 'Practice round', color: CourtDesign.mint),
            const SizedBox(width: 8),
            CourtPill(label: status, color: CourtDesign.mustard),
          ],
        ),
        const SizedBox(height: 10),
        Text(prompt, style: Theme.of(context).textTheme.bodyLarge),
      ],
    );
  }
}

class CourtPill extends StatelessWidget {
  const CourtPill({required this.label, required this.color, super.key});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: CourtDesign.ink, width: 1.3),
      ),
      child: Text(
        label,
        // Chips are one of the three places Bangers is used (task 04
        // decision record), alongside titles and the verdict banner.
        style: MemeCourtTypography.heading(
          const TextStyle(
            color: CourtDesign.ink,
            fontSize: 12,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}
