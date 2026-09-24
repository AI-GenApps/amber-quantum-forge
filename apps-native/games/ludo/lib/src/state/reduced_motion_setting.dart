/// Minimal in-memory reduced-motion flag.
///
/// Task 04's board/token components read this to decide whether to animate
/// token hops or jump straight to the final cell. Real persistence and the
/// settings-screen toggle that lets a player change this land in task 10;
/// this file only defines the flag and its default (`false`, i.e. motion
/// enabled) so those later pieces have a stable seam to plug into.
library;

import 'package:flutter/foundation.dart';

/// Whether animated components should skip multi-frame motion (token hops,
/// particle bursts, etc.) and jump straight to the final state.
///
/// A [ValueNotifier] so Flame components and widgets can both listen for
/// changes once task 10 wires a real toggle; until then it stays `false`.
class ReducedMotionSetting extends ValueNotifier<bool> {
  ReducedMotionSetting({bool enabled = false}) : super(enabled);
}
