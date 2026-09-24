/// Ludo design-system tokens.
///
/// Single source of truth for the palette, spacing scale, corner radii,
/// and shadow presets every themed widget in this app builds on (task
/// 12b). No screen or widget hardcodes a raw color/spacing value once it
/// has been themed — it reads from [LudoThemeTokens] instead, so the
/// look-and-feel (target: `.agents/resources/2026-09-24/
/// ludo-visual-reference/README.md`) stays centrally tunable.
library;

import 'package:flutter/material.dart';

/// Design tokens for the Ludo "chunky glossy" design system.
abstract final class LudoThemeTokens {
  // Core palette -------------------------------------------------------

  /// Deep royal-blue app background (never flat white / Material default).
  static const Color backgroundDeepBlue = Color(0xFF0B1E4A);

  /// A lighter royal-blue used for panel gradients and mid-tones.
  static const Color backgroundMidBlue = Color(0xFF14306E);

  /// Gold accent used for trim, borders, and highlights throughout.
  static const Color gold = Color(0xFFFFC93C);

  /// Deeper gold, used for the bottom/shadow edge of gold trim.
  static const Color goldDeep = Color(0xFFC9860B);

  /// Warm off-white used for body text on dark surfaces.
  static const Color textOnDark = Color(0xFFFFF8E7);

  /// Dark ink used for outline/shadow strokes behind light display text.
  static const Color textOutline = Color(0xFF1A1030);

  // Per-seat palette (matches `ludo_rules`' LudoColor order: red, green,
  // yellow, blue) — reused by player cards, tokens, and home-stretch
  // lanes across every later restyle task.
  static const Color seatRed = Color(0xFFE23B3B);
  static const Color seatGreen = Color(0xFF1FA35B);
  static const Color seatYellow = Color(0xFFF6C445);
  static const Color seatBlue = Color(0xFF2E6FE0);

  // Spacing scale (4px base) --------------------------------------------

  static const double spaceXs = 4;
  static const double spaceSm = 8;
  static const double spaceMd = 16;
  static const double spaceLg = 24;
  static const double spaceXl = 32;
  static const double spaceXxl = 48;

  // Radii -----------------------------------------------------------------

  static const double radiusSm = 8;
  static const double radiusMd = 16;
  static const double radiusLg = 24;
  static const double radiusPill = 999;

  // Shadow presets ---------------------------------------------------------

  /// Soft ambient shadow used behind panels and cards.
  static const List<BoxShadow> shadowPanel = [
    BoxShadow(color: Color(0x66000000), blurRadius: 12, offset: Offset(0, 6)),
  ];

  /// Tighter, higher-contrast shadow used behind buttons at rest.
  static const List<BoxShadow> shadowButton = [
    BoxShadow(color: Color(0x80000000), blurRadius: 6, offset: Offset(0, 4)),
  ];

  /// Font family name for chunky display headings.
  static const String fontDisplay = 'LilitaOne';

  /// Font family name for rounded body text.
  static const String fontBody = 'Nunito';
}
