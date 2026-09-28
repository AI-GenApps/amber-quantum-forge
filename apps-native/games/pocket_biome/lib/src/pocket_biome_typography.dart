import 'package:flutter/material.dart';

/// Pocket Biome's bundled typography (task 03): Fraunces (variable, with
/// the `SOFT` axis dialed to 100 for a rounded, cozy botanical heading
/// look) for headings, and Quicksand for body copy, labels, chips, and
/// buttons. Registered in `pubspec.yaml`'s `fonts:` block; font files live
/// under `assets/fonts/`.
final class PocketBiomeTypography {
  const PocketBiomeTypography._();

  static const String displayFamily = 'Fraunces';
  static const String bodyFamily = 'Quicksand';

  /// Fraunces' softness design axis, fully soft (100) for every heading.
  static const List<FontVariation> displayVariations = <FontVariation>[
    FontVariation('SOFT', 100),
  ];

  /// Applies the display family and SOFT axis to a heading [TextStyle],
  /// keeping every other property (color, size, weight, spacing) intact.
  static TextStyle heading(TextStyle base) {
    return base.copyWith(
      fontFamily: displayFamily,
      fontVariations: displayVariations,
    );
  }

  /// Applies the body family to a non-heading [TextStyle].
  static TextStyle body(TextStyle base) {
    return base.copyWith(fontFamily: bodyFamily);
  }

  /// Builds the app [ThemeData]: Quicksand as the default font family for
  /// every Material widget (buttons, chips, body text), and Fraunces (with
  /// the SOFT axis) for the generated `display*`/`headline*`/`title*`
  /// [TextTheme] roles.
  static ThemeData theme({required Color seedColor}) {
    final base = ThemeData(
      colorSchemeSeed: seedColor,
      useMaterial3: true,
      fontFamily: bodyFamily,
    );
    final textTheme = base.textTheme;
    TextStyle? asDisplay(TextStyle? style) =>
        style == null ? null : heading(style);
    return base.copyWith(
      textTheme: textTheme.copyWith(
        displayLarge: asDisplay(textTheme.displayLarge),
        displayMedium: asDisplay(textTheme.displayMedium),
        displaySmall: asDisplay(textTheme.displaySmall),
        headlineLarge: asDisplay(textTheme.headlineLarge),
        headlineMedium: asDisplay(textTheme.headlineMedium),
        headlineSmall: asDisplay(textTheme.headlineSmall),
        titleLarge: asDisplay(textTheme.titleLarge),
        titleMedium: asDisplay(textTheme.titleMedium),
        titleSmall: asDisplay(textTheme.titleSmall),
      ),
    );
  }
}
