import 'package:flutter/material.dart';

import '../merge_relay_theme.dart';
import 'mr_text_styles.dart';
import 'mr_tokens.dart';

/// Builds Merge Relay's [ThemeData] (task 07) from a [MergeRelayTheme]
/// accent variant: an explicit [ColorScheme] (never
/// `ColorScheme.fromSeed`/`colorSchemeSeed`, which is what produced the
/// Material-default indigo/purple look), Nunito Sans as the base font
/// family with Fredoka applied to the display/title/label roles (see
/// [MrTextStyles.apply]), and rounded, shadow-free button themes so stock
/// `FilledButton`/`OutlinedButton`/`TextButton` chrome doesn't bleed
/// through on screens this task doesn't restyle to [MrButton] yet
/// (task 11).
final class MrTheme {
  const MrTheme._();

  static ThemeData build(MergeRelayTheme relayTheme) {
    final colorScheme =
        ColorScheme.fromSeed(
          seedColor: relayTheme.blue,
          brightness: Brightness.light,
        ).copyWith(
          primary: relayTheme.ink,
          onPrimary: relayTheme.paper,
          secondary: relayTheme.coral,
          onSecondary: relayTheme.paper,
          surface: relayTheme.paper,
          onSurface: relayTheme.ink,
          surfaceContainerHighest: MrTokens.paperMuted,
        );
    final base = ThemeData(
      colorScheme: colorScheme,
      useMaterial3: true,
      fontFamily: MrTextStyles.bodyFamily,
      scaffoldBackgroundColor: relayTheme.paper,
      splashFactory: NoSplash.splashFactory,
    );
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(MrTokens.radiusMedium),
    );
    return base.copyWith(
      textTheme: MrTextStyles.apply(base.textTheme),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: relayTheme.ink,
          foregroundColor: relayTheme.paper,
          textStyle: const TextStyle(
            fontFamily: MrTextStyles.displayFamily,
            fontWeight: FontWeight.w700,
          ),
          shape: shape,
          padding: const EdgeInsets.symmetric(
            horizontal: MrTokens.space5,
            vertical: MrTokens.space4,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: relayTheme.ink,
          side: BorderSide(color: relayTheme.ink.withValues(alpha: 0.5)),
          textStyle: const TextStyle(
            fontFamily: MrTextStyles.displayFamily,
            fontWeight: FontWeight.w700,
          ),
          shape: shape,
          padding: const EdgeInsets.symmetric(
            horizontal: MrTokens.space5,
            vertical: MrTokens.space4,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: relayTheme.ink,
          textStyle: const TextStyle(
            fontFamily: MrTextStyles.displayFamily,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: relayTheme.paper,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(MrTokens.radiusLarge),
        ),
        titleTextStyle: TextStyle(
          fontFamily: MrTextStyles.displayFamily,
          color: relayTheme.ink,
          fontSize: 20,
          fontWeight: FontWeight.w700,
        ),
        contentTextStyle: TextStyle(
          fontFamily: MrTextStyles.bodyFamily,
          color: relayTheme.ink.withValues(alpha: 0.75),
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: relayTheme.paper,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(MrTokens.radiusLarge),
          ),
        ),
      ),
      chipTheme: base.chipTheme.copyWith(
        labelStyle: const TextStyle(fontFamily: MrTextStyles.displayFamily),
      ),
    );
  }
}
