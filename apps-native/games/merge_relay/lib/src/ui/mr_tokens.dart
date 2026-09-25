import 'package:flutter/material.dart';

/// Merge Relay's brand design tokens (task 07): the shared, theme-agnostic
/// palette, spacing, radius, and shadow values every chrome widget in
/// `lib/src/ui/` is built from. `signalRelayTheme`/`emberRelayTheme` (in
/// `../merge_relay_theme.dart`) are cosmetic accent variants layered on top
/// of these tokens — both use [MrTokens.paper]/[MrTokens.ink] as their base,
/// differing only in their relay-light accent hues.
///
/// Replaces the old flat blue-on-white look with a warm, Threes!-grade
/// identity: a cream play field, ink-navy text, and a 12-step tile-tier
/// palette (2 -> 8192+) chosen so every tier's numeral clears WCAG AA
/// contrast (>= 4.5:1, verified with the standard relative-luminance
/// formula) against the numeral color picked for that tier.
final class MrTokens {
  const MrTokens._();

  // Brand base — shared by every cosmetic theme.
  static const Color paper = Color(0xfffff7ea);
  static const Color ink = Color(0xff1e2a44);
  static const Color paperMuted = Color(0xfff3e8d2);

  // Spacing scale (4px base unit).
  static const double space1 = 4;
  static const double space2 = 8;
  static const double space3 = 12;
  static const double space4 = 16;
  static const double space5 = 20;
  static const double space6 = 24;
  static const double space8 = 32;

  // Corner radii.
  static const double radiusSmall = 12;
  static const double radiusMedium = 18;
  static const double radiusLarge = 24;
  static const double radiusPill = 999;

  /// Offset "physical card" drop shadow used by [MrPanel] and tile faces —
  /// a soft, low-blur shadow with a downward offset rather than a diffuse
  /// Material elevation glow.
  static List<BoxShadow> cardShadow({double opacity = 0.16}) => [
    BoxShadow(
      color: ink.withValues(alpha: opacity),
      blurRadius: 18,
      offset: const Offset(0, 8),
    ),
  ];

  /// The 12-step tile-tier palette, indexed 0 (value 2) through 11 (value
  /// 4096, reused for every tier at or above it, i.e. "8192+"). Use
  /// [tileTierIndex] to map a board value to its index.
  static const List<Color> tileTierColors = [
    Color(0xffffffff), // 2
    Color(0xffffe9c6), // 4
    Color(0xffffc97a), // 8
    Color(0xfff2914b), // 16
    Color(0xffe86b4b), // 32
    Color(0xffc03e4f), // 64
    Color(0xffb84c7a), // 128
    Color(0xff8b4a9c), // 256
    Color(0xff5c4b9e), // 512
    Color(0xff3c5c9e), // 1024
    Color(0xff2a7a8c), // 2048
    Color(0xff1e2a44), // 4096 / 8192+
  ];

  /// The numeral color for each tier in [tileTierColors], picked (paper vs.
  /// ink) for the higher of the two WCAG contrast ratios against the tile
  /// fill — every entry clears 4.5:1.
  static const List<Color> tileTierNumeralColors = [
    ink, // 2 — 14.3:1
    ink, // 4 — 12.1:1
    ink, // 8 — 9.5:1
    ink, // 16 — 6.1:1
    ink, // 32 — 4.5:1
    paper, // 64 — 4.9:1
    paper, // 128 — 4.5:1
    paper, // 256 — 5.6:1
    paper, // 512 — 6.7:1
    paper, // 1024 — 6.1:1
    paper, // 2048 — 4.6:1
    paper, // 4096/8192+ — 13.4:1
  ];

  /// Maps a merged tile's numeric value to its tier index into
  /// [tileTierColors]/[tileTierNumeralColors], clamped to the last tier for
  /// any value at or above 4096.
  static int tileTierIndex(int value) {
    if (value < 2) return 0;
    final step = (value.bitLength - 1).clamp(1, tileTierColors.length);
    return step - 1;
  }

  static Color tileColorFor(int value) => tileTierColors[tileTierIndex(value)];

  static Color tileNumeralColorFor(int value) =>
      tileTierNumeralColors[tileTierIndex(value)];
}
