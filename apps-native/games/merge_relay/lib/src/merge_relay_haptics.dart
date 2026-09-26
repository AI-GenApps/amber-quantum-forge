import 'package:flutter/services.dart';

/// The four haptic events the task decisions call for: light on a tile
/// slide, medium on a merge, heavy on a new best tile, and a selection
/// click on buttons. Callers gate every method behind
/// `preferences.hapticsEnabled` themselves (see
/// `MergeRelayGame._haptic` in `merge_relay_game_actions.dart`) so this
/// class stays a thin, directly mockable wrapper over `HapticFeedback`.
abstract final class MergeRelayHaptics {
  static void slide() => HapticFeedback.lightImpact();

  static void merge() => HapticFeedback.mediumImpact();

  static void bestTile() => HapticFeedback.heavyImpact();

  static void select() => HapticFeedback.selectionClick();
}
