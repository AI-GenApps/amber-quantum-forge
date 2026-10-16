import 'package:flutter/material.dart';

import '../merge_relay_theme.dart';

/// The Settings switch colours (device-QA defect D5).
///
/// The stock Material 3 switch derived its ON colours from the app's
/// [ColorScheme] (`primary` is the ink navy, and the track came out as a
/// muted grey), so ON read as disabled and OFF was a cream track with a grey
/// thumb: the state was only legible from the thumb position. Every colour
/// here is a design token of the active [MergeRelayTheme] (or the brand
/// [MrTokens] it is built from), chosen so each part meets the 3:1 contrast
/// WCAG 2.1 asks of non-text UI components against what it sits on:
///
/// * ON: a saturated [MergeRelayTheme.blue] track with a cream thumb.
/// * OFF: a pale well track with a [MergeRelayTheme.muted] thumb and a
///   matching outline, so the control is clearly an *inactive* switch rather
///   than a disabled one.
/// * High contrast: ink-on-paper both ways, with a heavier outline.
final class MrSwitchPalette {
  const MrSwitchPalette._({
    required this.onTrack,
    required this.onThumb,
    required this.offTrack,
    required this.offThumb,
    required this.onOutline,
    required this.offOutline,
    required this.outlineWidth,
  });

  factory MrSwitchPalette.of(
    MergeRelayTheme theme, {
    bool highContrast = false,
  }) {
    if (highContrast) {
      return MrSwitchPalette._(
        onTrack: theme.ink,
        onThumb: theme.paper,
        offTrack: theme.paper,
        offThumb: theme.ink,
        onOutline: theme.ink,
        offOutline: theme.ink,
        outlineWidth: 2.5,
      );
    }
    return MrSwitchPalette._(
      onTrack: theme.blue,
      onThumb: theme.paper,
      offTrack: theme.slot,
      offThumb: theme.muted,
      onOutline: theme.blue,
      offOutline: theme.muted,
      outlineWidth: 2,
    );
  }

  final Color onTrack;
  final Color onThumb;
  final Color offTrack;
  final Color offThumb;
  final Color onOutline;
  final Color offOutline;
  final double outlineWidth;

  /// Applies the palette to a [Switch]/[Switch.adaptive].
  Switch build({required bool value, required ValueChanged<bool> onChanged}) {
    return Switch.adaptive(
      value: value,
      onChanged: onChanged,
      activeThumbColor: onThumb,
      activeTrackColor: onTrack,
      inactiveThumbColor: offThumb,
      inactiveTrackColor: offTrack,
      trackOutlineColor: WidgetStateProperty.resolveWith(
        (states) =>
            states.contains(WidgetState.selected) ? onOutline : offOutline,
      ),
      trackOutlineWidth: WidgetStatePropertyAll(outlineWidth),
    );
  }
}
