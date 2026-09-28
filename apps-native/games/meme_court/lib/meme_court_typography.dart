import 'package:flutter/material.dart';

/// Meme Court's bundled typography (task 04): Bangers for display text,
/// Lexend for body copy, labels, chips, and buttons. Registered in
/// `pubspec.yaml`'s `fonts:` block; font files live under `assets/fonts/`.
///
/// Bangers is drawn as a caps-only comic/poster face — it has no
/// lowercase-specific letterforms — so [heading] is wired only onto short,
/// already-styled UI text in `meme_court_theme.dart` (the `headlineMedium`/
/// `titleLarge` roles, which cover the app bar title, section titles, and
/// the "Verdict" banner, plus the `CourtPill` chip label). It is never
/// applied to paragraph copy, matching the task 04 decision record.
final class MemeCourtTypography {
  const MemeCourtTypography._();

  static const String displayFamily = 'Bangers';
  static const String bodyFamily = 'Lexend';

  /// Applies the display family to a heading/chip [TextStyle], keeping
  /// every other property (color, size, weight, spacing) intact.
  static TextStyle heading(TextStyle base) {
    return base.copyWith(fontFamily: displayFamily);
  }

  /// Applies the body family to a non-heading [TextStyle]. Used to keep
  /// `FilledButton`/`OutlinedButton` label text on the bundled body font:
  /// a button's resolved `textStyle` becomes the ambient `DefaultTextStyle`
  /// for its child outright (see `Material.build()`), so any override that
  /// omits `fontFamily` would otherwise fall back to the platform default.
  static TextStyle body(TextStyle base) {
    return base.copyWith(fontFamily: bodyFamily);
  }
}
