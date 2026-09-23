import 'package:flutter/material.dart';

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

const signalRelayTheme = MergeRelayTheme(
  paper: Color(0xffedf5fb),
  ink: Color(0xff10243e),
  board: Color(0xff10243e),
  slot: Color(0xff203754),
  blue: Color(0xff3e75b6),
  sky: Color(0xff4e93d3),
  coral: Color(0xffa53b36),
  warm: Color(0xffe5534b),
  muted: Color(0xff52677d),
);

const emberRelayTheme = MergeRelayTheme(
  paper: Color(0xfffbf2ea),
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

ThemeData materialThemeFor(MergeRelayTheme relayTheme) {
  return ThemeData(
    colorScheme:
        ColorScheme.fromSeed(
          seedColor: relayTheme.blue,
          brightness: Brightness.light,
        ).copyWith(
          primary: relayTheme.ink,
          onPrimary: relayTheme.paper,
          secondary: relayTheme.coral,
          surface: relayTheme.paper,
          onSurface: relayTheme.ink,
        ),
    scaffoldBackgroundColor: relayTheme.paper,
    useMaterial3: true,
  );
}
