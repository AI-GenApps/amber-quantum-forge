import 'package:flutter/material.dart';

/// Merge Relay's bundled typography (task 07): **Fredoka** for tile
/// numerals, titles, and buttons; **Nunito Sans** for body copy. Registered
/// in `pubspec.yaml`'s `fonts:` block; font files live under
/// `assets/fonts/`. No rendered text may fall back to a platform default
/// font (Roboto/San Francisco) — see `test/typography_test.dart`.
final class MrTextStyles {
  const MrTextStyles._();

  static const String displayFamily = 'Fredoka';
  static const String bodyFamily = 'NunitoSans';

  /// Applies the display family to a title/heading/button [TextStyle],
  /// keeping every other property (color, size, weight, spacing) intact.
  static TextStyle display(TextStyle base) =>
      base.copyWith(fontFamily: displayFamily);

  /// Applies the body family to a non-display [TextStyle].
  static TextStyle body(TextStyle base) =>
      base.copyWith(fontFamily: bodyFamily);

  /// Builds the shared [TextTheme]: Nunito Sans is the base font family for
  /// every Material role (set on the enclosing [ThemeData.fontFamily], so
  /// every ad-hoc `TextStyle` in the app that doesn't set its own
  /// `fontFamily` inherits it through the ambient `DefaultTextStyle`
  /// cascade), and the display/headline/title/label roles are overridden to
  /// Fredoka so buttons, dialog titles, and anything reading
  /// `Theme.of(context).textTheme` picks up the display face automatically.
  static TextTheme apply(TextTheme base) {
    TextStyle? asDisplay(TextStyle? style) =>
        style == null ? null : display(style);
    return base.copyWith(
      displayLarge: asDisplay(base.displayLarge),
      displayMedium: asDisplay(base.displayMedium),
      displaySmall: asDisplay(base.displaySmall),
      headlineLarge: asDisplay(base.headlineLarge),
      headlineMedium: asDisplay(base.headlineMedium),
      headlineSmall: asDisplay(base.headlineSmall),
      titleLarge: asDisplay(base.titleLarge),
      titleMedium: asDisplay(base.titleMedium),
      titleSmall: asDisplay(base.titleSmall),
      labelLarge: asDisplay(base.labelLarge),
      labelMedium: asDisplay(base.labelMedium),
      labelSmall: asDisplay(base.labelSmall),
    );
  }
}
