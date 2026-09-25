import 'package:flutter/material.dart';

/// Peeklings' (internal id `snapquest`) bundled typography (task 04): Baloo
/// 2 for display text, Andika for body copy, labels, chips, and buttons.
/// Registered in `pubspec.yaml`'s `fonts:` block; font files live under
/// `assets/fonts/`.
final class SnapQuestTypography {
  const SnapQuestTypography._();

  static const String displayFamily = 'Baloo2';
  static const String bodyFamily = 'Andika';

  /// Applies the display family to a heading [TextStyle], keeping every
  /// other property (color, size, weight, spacing) intact.
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
