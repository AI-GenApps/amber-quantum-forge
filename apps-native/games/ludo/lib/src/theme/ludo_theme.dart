/// The app-wide `ThemeData` built from [LudoThemeTokens], replacing the
/// stock Material 3 `colorSchemeSeed: Colors.indigo` look (task 12b).
///
/// Applying this to `MaterialApp.theme` (later screens tasks, 12d/12e)
/// makes every default Material widget (buttons, dialogs, app bars) pick
/// up the Ludo palette and bundled fonts automatically, even before a
/// screen is individually restyled with the bespoke chrome widgets in
/// `lib/src/widgets/`.
library;

import 'package:flutter/material.dart';

import 'ludo_theme_tokens.dart';

/// Builds the Ludo app's [ThemeData].
ThemeData buildLudoTheme() {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: LudoThemeTokens.backgroundMidBlue,
    brightness: Brightness.dark,
    primary: LudoThemeTokens.gold,
    onPrimary: LudoThemeTokens.textOutline,
    secondary: LudoThemeTokens.backgroundMidBlue,
    surface: LudoThemeTokens.backgroundMidBlue,
    onSurface: LudoThemeTokens.textOnDark,
  );

  final textTheme = TextTheme(
    displayLarge: TextStyle(
      fontFamily: LudoThemeTokens.fontDisplay,
      fontSize: 40,
      color: LudoThemeTokens.textOnDark,
    ),
    displayMedium: TextStyle(
      fontFamily: LudoThemeTokens.fontDisplay,
      fontSize: 28,
      color: LudoThemeTokens.textOnDark,
    ),
    titleLarge: TextStyle(
      fontFamily: LudoThemeTokens.fontDisplay,
      fontSize: 22,
      color: LudoThemeTokens.textOnDark,
    ),
    bodyLarge: TextStyle(
      fontFamily: LudoThemeTokens.fontBody,
      fontSize: 16,
      color: LudoThemeTokens.textOnDark,
    ),
    bodyMedium: TextStyle(
      fontFamily: LudoThemeTokens.fontBody,
      fontSize: 14,
      color: LudoThemeTokens.textOnDark,
    ),
    labelLarge: TextStyle(
      fontFamily: LudoThemeTokens.fontBody,
      fontWeight: FontWeight.w700,
      fontSize: 16,
      color: LudoThemeTokens.textOnDark,
    ),
  );

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: LudoThemeTokens.backgroundDeepBlue,
    fontFamily: LudoThemeTokens.fontBody,
    textTheme: textTheme,
    appBarTheme: AppBarTheme(
      backgroundColor: LudoThemeTokens.backgroundMidBlue,
      foregroundColor: LudoThemeTokens.textOnDark,
      titleTextStyle: textTheme.titleLarge,
      elevation: 0,
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: LudoThemeTokens.backgroundMidBlue,
      titleTextStyle: textTheme.titleLarge,
      contentTextStyle: textTheme.bodyLarge,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(LudoThemeTokens.radiusLg),
        side: const BorderSide(color: LudoThemeTokens.gold, width: 2),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: LudoThemeTokens.gold,
        foregroundColor: LudoThemeTokens.textOutline,
        textStyle: textTheme.labelLarge,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(LudoThemeTokens.radiusMd),
        ),
      ),
    ),
    cardTheme: CardThemeData(
      color: LudoThemeTokens.backgroundMidBlue,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(LudoThemeTokens.radiusMd),
        side: const BorderSide(color: LudoThemeTokens.gold, width: 1.5),
      ),
    ),
  );
}
