/// The debug-only "Online preview" arming flag (task 26x).
///
/// Precedent: task 12a's "Debug: All Bots Demo" button
/// (`mode_setup_sheet.dart`), gated the same way — `kDebugMode`-guarded at
/// every call site that reads or sets [armed], so the toggle/long-press
/// entry points below are compiled out of a release build entirely (not
/// merely hidden behind a runtime flag). This file itself has no
/// `kDebugMode` guard of its own (a plain state holder is harmless to
/// compile in); the guard lives at each of this task's two entry points:
///
/// 1. `settings_screen.dart`'s "Debug: Online preview mode" toggle.
/// 2. A long-press on the lobby logo (`home_lobby_screen.dart`).
///
/// Arming replaces `HomeLobbyScreen`'s resolved [LudoOnlineClient] with
/// [createLudoPreviewOnlineClient]'s fake-transport-backed one for the
/// remainder of the app session (armed state resets on a fresh process
/// launch, never persisted) — see `ludo_preview_online.dart`'s doc comment
/// for how that client scripts every online screen/state without a real
/// backend.
library;

import 'package:flutter/foundation.dart' show ValueNotifier, kDebugMode;

/// Process-wide, debug-only "online preview is armed for this session"
/// flag. `armed` is always `false` in a release build's actual runtime
/// state (nothing in a release build ever calls [arm], since both entry
/// points are `kDebugMode`-guarded), but this holder itself compiles into
/// every build — see this file's doc comment for why that's fine.
final class LudoOnlinePreviewMode {
  LudoOnlinePreviewMode._();

  static final ValueNotifier<bool> _armed = ValueNotifier<bool>(false);

  /// Whether the debug preview mode is armed for the remainder of this
  /// app session. Listenable so `HomeLobbyScreen` can react to a long-press
  /// arm without needing its own `setState` plumbing exposed here.
  static ValueNotifier<bool> get armedNotifier => _armed;

  static bool get isArmed => _armed.value;

  /// Arms preview mode. Only ever called from a `kDebugMode`-guarded call
  /// site; asserts that guard is actually in effect as a defense-in-depth
  /// check (this never fires in a real release build, since no such call
  /// site is compiled in).
  static void arm() {
    assert(kDebugMode, 'LudoOnlinePreviewMode.arm() must be debug-only');
    _armed.value = true;
  }

  /// Test-only reset between cases; production code never calls this.
  static void resetForTesting() {
    _armed.value = false;
  }
}
