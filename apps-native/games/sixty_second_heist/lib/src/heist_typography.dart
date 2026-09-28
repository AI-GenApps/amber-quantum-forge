import 'package:flutter/material.dart';

/// Sixty-Second Heist's bundled typography (task 03): Bungee for
/// signage-style headings, Chakra Petch for techy body copy, labels,
/// chips, and buttons. Registered in `pubspec.yaml`'s `fonts:` block; font
/// files live under `assets/fonts/`.
final class HeistTypography {
  const HeistTypography._();

  static const String displayFamily = 'Bungee';
  static const String bodyFamily = 'ChakraPetch';

  /// Applies the display family to a heading [TextStyle], keeping every
  /// other property (color, size, weight, spacing) intact.
  static TextStyle heading(TextStyle base) {
    return base.copyWith(fontFamily: displayFamily);
  }

  /// Applies the body family to a non-heading [TextStyle].
  static TextStyle body(TextStyle base) {
    return base.copyWith(fontFamily: bodyFamily);
  }

  /// Builds the app [ThemeData]: Chakra Petch as the default font family
  /// for every Material widget (buttons, chips, body text), and Bungee
  /// for the generated `display*`/`headline*`/`title*` [TextTheme] roles.
  static ThemeData theme({
    required Color seedColor,
    required Color background,
  }) {
    final base = ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: seedColor),
      scaffoldBackgroundColor: background,
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
