import 'package:flutter/material.dart';

import 'ui/mr_theme.dart';
import 'ui/mr_tokens.dart';

final class MergeRelayTheme {
  const MergeRelayTheme({
    required this.paper,
    required this.ink,
    required this.board,
    required this.slot,
    required this.blue,
    required this.sky,
    required this.coral,
    required this.warm,
    required this.muted,
  });

  final Color paper;
  final Color ink;
  final Color board;
  final Color slot;
  final Color blue;
  final Color sky;
  final Color coral;
  final Color warm;
  final Color muted;
}

// Both cosmetic variants below share the brand base ([MrTokens.paper] /
// [MrTokens.ink]) — restyled for task 07 away from the old flat cool-blue
// "signal" paper and to derive `board`/`slot` from the shared ink tone —
// and differ only in their relay-light accent hues (blue/sky/coral/warm).
const signalRelayTheme = MergeRelayTheme(
  paper: MrTokens.paper,
  ink: MrTokens.ink,
  board: MrTokens.ink,
  slot: Color(0xff2c3a5c),
  blue: Color(0xff3c5c9e),
  sky: Color(0xff2a7a8c),
  coral: Color(0xffc03e4f),
  warm: Color(0xfff2914b),
  muted: Color(0xff5c6a8a),
);

const emberRelayTheme = MergeRelayTheme(
  paper: MrTokens.paper,
  ink: Color(0xff2b1c36),
  board: Color(0xff2b1c36),
  slot: Color(0xff49304f),
  blue: Color(0xff8d4d85),
  sky: Color(0xffb76b88),
  coral: Color(0xffb34d3f),
  warm: Color(0xffd48742),
  muted: Color(0xff72566b),
);

MergeRelayTheme relayThemeFor(String themeId) {
  return themeId == 'ember' ? emberRelayTheme : signalRelayTheme;
}

/// Builds the app's [ThemeData] for a given cosmetic accent variant — see
/// [MrTheme.build] for the design-system details (fonts, explicit
/// [ColorScheme], rounded button/dialog/sheet chrome).
ThemeData materialThemeFor(MergeRelayTheme relayTheme) =>
    MrTheme.build(relayTheme);
