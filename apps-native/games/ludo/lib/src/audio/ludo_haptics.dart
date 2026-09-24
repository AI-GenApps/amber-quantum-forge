/// Haptic feedback for Ludo's key moments, gated by
/// [LudoSoundSettings.vibrationEnabled].
///
/// [LudoFeedbackEvent] is the single enum that drives *both* haptics (this
/// file) and SFX (`ludo_audio_service.dart`) from one call site — see
/// `LudoFeedbackService.trigger` — so the two never drift out of sync with
/// each other the way two parallel enums could.
library;

import 'package:flutter/services.dart';

import '../state/ludo_sound_settings.dart';

/// The feedback-worthy moments in a Ludo match. Each maps to exactly one
/// SFX asset slot (see `_sfxAssetPaths` in `ludo_audio_service.dart`) and
/// exactly one [HapticFeedback] pattern (see [LudoHaptics.trigger]).
enum LudoFeedbackEvent {
  /// The dice is rolled (tumble start).
  diceRoll,

  /// A token hops one board step.
  tokenStep,

  /// A token captures an opponent's token.
  capture,

  /// A token reaches home.
  homeArrival,

  /// A match is won.
  win,

  /// A generic UI button press.
  buttonTap,

  /// The current player is alerted that it is their turn.
  turnAlert,
}

/// Thin seam over [HapticFeedback] so tests can substitute a fake instead
/// of exercising the real platform channel (which isn't available/relevant
/// in `flutter test`'s host environment).
abstract class LudoHapticsChannel {
  Future<void> lightImpact();
  Future<void> mediumImpact();
  Future<void> heavyImpact();
  Future<void> selectionClick();
}

/// The real channel: Flutter's [HapticFeedback] static API.
class FlutterHapticsChannel implements LudoHapticsChannel {
  const FlutterHapticsChannel();

  @override
  Future<void> lightImpact() => HapticFeedback.lightImpact();

  @override
  Future<void> mediumImpact() => HapticFeedback.mediumImpact();

  @override
  Future<void> heavyImpact() => HapticFeedback.heavyImpact();

  @override
  Future<void> selectionClick() => HapticFeedback.selectionClick();
}

/// Plays the [HapticFeedback] pattern for a [LudoFeedbackEvent], gated by
/// [LudoSoundSettings.vibrationEnabled].
class LudoHaptics {
  LudoHaptics({required this.settings, LudoHapticsChannel? channel})
    : _channel = channel ?? const FlutterHapticsChannel();

  final LudoSoundSettings settings;
  final LudoHapticsChannel _channel;

  /// Triggers the haptic pattern for [event]. A no-op when
  /// [LudoSoundSettings.vibrationEnabled] is `false`.
  Future<void> trigger(LudoFeedbackEvent event) async {
    if (!settings.vibrationEnabled) return;
    switch (event) {
      case LudoFeedbackEvent.diceRoll:
        await _channel.mediumImpact();
      case LudoFeedbackEvent.tokenStep:
        await _channel.selectionClick();
      case LudoFeedbackEvent.capture:
        await _channel.heavyImpact();
      case LudoFeedbackEvent.homeArrival:
        await _channel.mediumImpact();
      case LudoFeedbackEvent.win:
        await _channel.heavyImpact();
      case LudoFeedbackEvent.buttonTap:
        await _channel.lightImpact();
      case LudoFeedbackEvent.turnAlert:
        await _channel.lightImpact();
    }
  }
}
