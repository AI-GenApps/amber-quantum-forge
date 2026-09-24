/// Ludo text styles, including the outlined-title technique reused by
/// every heading in the app (task 12b).
///
/// Outline technique: two stacked [Text] widgets sharing one string —
/// a bottom layer painted with a `Paint()..style = PaintingStyle.stroke`
/// via [TextStyle.foreground] (the dark outline/shadow) and a top layer
/// with a plain fill color (the white face) — composed by
/// [LudoOutlinedTitle]. This is chosen over a single [Shadow] list
/// because a stroke reads as a crisp outline at any size, where blurred
/// [Shadow]s go soft/muddy on the chunky display font at large sizes.
library;

import 'package:flutter/material.dart';

import 'ludo_theme_tokens.dart';

/// Text style presets for the Ludo design system.
abstract final class LudoTextStyles {
  static TextStyle get displayLarge => const TextStyle(
    fontFamily: LudoThemeTokens.fontDisplay,
    fontSize: 40,
    height: 1.1,
    color: LudoThemeTokens.textOnDark,
  );

  static TextStyle get displayMedium => const TextStyle(
    fontFamily: LudoThemeTokens.fontDisplay,
    fontSize: 28,
    height: 1.15,
    color: LudoThemeTokens.textOnDark,
  );

  static TextStyle get displaySmall => const TextStyle(
    fontFamily: LudoThemeTokens.fontDisplay,
    fontSize: 20,
    height: 1.2,
    color: LudoThemeTokens.textOnDark,
  );

  static TextStyle get body => const TextStyle(
    fontFamily: LudoThemeTokens.fontBody,
    fontWeight: FontWeight.w500,
    fontSize: 16,
    height: 1.35,
    color: LudoThemeTokens.textOnDark,
  );

  static TextStyle get bodyStrong => body.copyWith(fontWeight: FontWeight.w800);

  static TextStyle get caption => const TextStyle(
    fontFamily: LudoThemeTokens.fontBody,
    fontWeight: FontWeight.w600,
    fontSize: 12,
    height: 1.3,
    color: LudoThemeTokens.textOnDark,
  );

  /// The stroke layer's style for [displayLarge]-sized outlined titles,
  /// derived by swapping in a stroke [Paint] via [TextStyle.foreground].
  static TextStyle outlineOf(TextStyle base, {double strokeWidth = 4}) {
    return base.copyWith(
      foreground: Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..color = LudoThemeTokens.textOutline,
      color: null,
    );
  }
}

/// A heading with a dark outline behind a light fill, built from
/// [LudoTextStyles.outlineOf] stacked under a plain fill [Text] — see this
/// file's doc comment for why a stroke technique was chosen over
/// [Shadow]s.
class LudoOutlinedTitle extends StatelessWidget {
  const LudoOutlinedTitle(
    this.text, {
    super.key,
    this.style,
    this.strokeWidth = 4,
    this.textAlign,
  });

  /// The title text.
  final String text;

  /// Base fill style; defaults to [LudoTextStyles.displayLarge].
  final TextStyle? style;

  /// Width of the dark outline stroke behind the fill.
  final double strokeWidth;

  final TextAlign? textAlign;

  @override
  Widget build(BuildContext context) {
    final base = style ?? LudoTextStyles.displayLarge;
    return Stack(
      children: [
        Text(
          text,
          textAlign: textAlign,
          style: LudoTextStyles.outlineOf(base, strokeWidth: strokeWidth),
        ),
        Text(text, textAlign: textAlign, style: base),
      ],
    );
  }
}
