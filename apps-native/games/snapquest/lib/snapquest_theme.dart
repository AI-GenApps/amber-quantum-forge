import 'package:flutter/material.dart';

import 'snapquest_typography.dart';

abstract final class SnapDesign {
  static const night = Color(0xFF18243A);
  static const butter = Color(0xFFFFF3B8);
  static const sky = Color(0xFFBDEBFF);
  static const coral = Color(0xFFFF786B);
  static const gold = Color(0xFFF3BE58);
  static const lime = Color(0xFFD8F36B);
  static const lavender = Color(0xFFE9DEFF);

  static ThemeData theme() {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: coral,
        brightness: Brightness.light,
        surface: butter,
      ),
      scaffoldBackgroundColor: butter,
      // Sets Andika as the default for every Material widget (buttons,
      // list tiles, and any `textTheme` role left unset below); Baloo 2 is
      // then layered on top of the display roles explicitly (task 04).
      fontFamily: SnapQuestTypography.bodyFamily,
      appBarTheme: const AppBarTheme(
        backgroundColor: butter,
        foregroundColor: night,
        elevation: 0,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: night,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          // A `FilledButton`'s resolved `textStyle` becomes its child's
          // ambient `DefaultTextStyle` outright (Material.build() does not
          // merge it with the theme's default), so `fontFamily` must be
          // set explicitly here or the label falls back to the platform
          // default font.
          textStyle: SnapQuestTypography.body(
            const TextStyle(fontWeight: FontWeight.w800),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: night,
          minimumSize: const Size.fromHeight(48),
          side: const BorderSide(color: night, width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
      ),
      textTheme: TextTheme(
        headlineMedium: SnapQuestTypography.heading(
          const TextStyle(
            color: night,
            fontSize: 30,
            fontWeight: FontWeight.w900,
            height: 1.04,
          ),
        ),
        titleLarge: SnapQuestTypography.heading(
          const TextStyle(
            color: night,
            fontSize: 21,
            fontWeight: FontWeight.w900,
          ),
        ),
        bodyLarge: const TextStyle(color: night, fontSize: 16, height: 1.35),
        bodyMedium: const TextStyle(color: night, fontSize: 14, height: 1.3),
      ),
      useMaterial3: true,
    );
  }
}

class SnapHeader extends StatelessWidget {
  const SnapHeader({
    required this.completedCount,
    required this.albumCount,
    super.key,
  });

  final int completedCount;
  final int albumCount;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            const SnapPill(label: 'Desk or camera', color: SnapDesign.sky),
            SnapPill(
              label: '$completedCount hunts complete',
              color: SnapDesign.lime,
            ),
            SnapPill(label: '$albumCount in album', color: SnapDesign.lavender),
          ],
        ),
        const SizedBox(height: 10),
        Text(
          'Spot a color. Meet a Peekling.',
          style: Theme.of(context).textTheme.bodyLarge,
        ),
      ],
    );
  }
}

class SnapPill extends StatelessWidget {
  const SnapPill({required this.label, required this.color, super.key});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      // Andika runs wider than the platform default at the same size, so
      // all three status pills no longer fit one row at 360 logical width
      // with the original 12px horizontal padding (task 04 orchestrator
      // review). Tightened padding plus a touch of negative letter-spacing
      // recovers the one-row layout with no copy change and no font-size
      // drop below the label's original 12px.
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 7),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: SnapDesign.night, width: 1.3),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: SnapDesign.night,
          fontSize: 12,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.2,
        ),
      ),
    );
  }
}
