/// Onboarding profile state: the player's chosen display name, avatar and
/// whether they have completed (or skipped through) the onboarding flow.
///
/// Persisted with `platform_core`'s [SaveStore]/[SaveEnvelope] mechanism —
/// the same local-persistence primitive task 06 established in
/// `platform_core` for this app (see `lib/src/audio/ludo_sound_settings.dart`
/// for the in-memory-only counterpart task 06 itself keeps; this is the
/// first Ludo state to actually persist through that store). No second
/// persistence mechanism (e.g. `shared_preferences`) is introduced here.
library;

import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:platform_core/platform_core.dart';

import '../widgets/ludo_avatar.dart' show ludoAvatarIds;

/// Schema version for [LudoProfileSettings.toJson] / `applyJson`.
const ludoProfileSchemaVersion = 1;

/// Generates a default display name for a player who never typed one
/// (either by skipping onboarding entirely, or leaving the name field
/// blank). Deterministic given [seed] so tests can assert on it; real
/// callers pass a fresh random seed.
String ludoGeneratedDefaultName({int seed = 0}) =>
    'Player${1000 + seed % 9000}';

/// The avatar assigned to a player who never picked one. Always one of
/// [ludoAvatarIds] (the first, for a stable, testable default).
String ludoDefaultAvatarId() => ludoAvatarIds.first;

/// Holds the three fields onboarding collects (or auto-assigns on skip):
/// display name, avatar id, and whether onboarding is complete.
class LudoProfileSettings extends ChangeNotifier {
  LudoProfileSettings({
    String? name,
    String? avatarId,
    bool onboardingComplete = false,
  }) : _name = name ?? ludoGeneratedDefaultName(),
       _avatarId = _validAvatarId(avatarId),
       _onboardingComplete = onboardingComplete;

  String _name;
  String _avatarId;
  bool _onboardingComplete;

  /// The player's chosen (or generated default) display name. Never empty:
  /// setting it to a blank/whitespace-only value falls back to a freshly
  /// generated default rather than storing an empty name.
  String get name => _name;

  set name(String value) {
    final trimmed = value.trim();
    final next = trimmed.isEmpty ? ludoGeneratedDefaultName() : trimmed;
    if (_name == next) return;
    _name = next;
    notifyListeners();
  }

  /// The player's chosen (or default) avatar id; always a member of
  /// [ludoAvatarIds].
  String get avatarId => _avatarId;

  set avatarId(String value) {
    final next = _validAvatarId(value);
    if (_avatarId == next) return;
    _avatarId = next;
    notifyListeners();
  }

  /// Whether the player has completed or skipped past onboarding. Once
  /// `true`, [app.dart]'s routing sends the splash screen straight to the
  /// home lobby (placeholder) instead of the onboarding flow.
  bool get onboardingComplete => _onboardingComplete;

  set onboardingComplete(bool value) {
    if (_onboardingComplete == value) return;
    _onboardingComplete = value;
    notifyListeners();
  }

  static String _validAvatarId(String? value) {
    if (value != null && ludoAvatarIds.contains(value)) return value;
    return ludoDefaultAvatarId();
  }

  Map<String, Object?> toJson() => {
    'name': _name,
    'avatar_id': _avatarId,
    'onboarding_complete': _onboardingComplete,
  };

  /// Applies a previously-saved payload (as produced by [toJson]) onto this
  /// instance, notifying listeners once. Unknown/malformed fields are
  /// ignored rather than thrown — a corrupt or partial save should never
  /// crash onboarding, just fall back to whatever defaults were already
  /// set.
  void applyJson(Map<String, Object?> json) {
    final name = json['name'];
    final avatarId = json['avatar_id'];
    final onboardingComplete = json['onboarding_complete'];
    if (name is String && name.trim().isNotEmpty) _name = name.trim();
    if (avatarId is String) _avatarId = _validAvatarId(avatarId);
    if (onboardingComplete is bool) _onboardingComplete = onboardingComplete;
    notifyListeners();
  }
}

/// Builds the production [SaveStore]: a file-backed store under the app's
/// support directory. Guarded like `main.dart`'s own bootstrap — if the
/// `path_provider` platform channel is unavailable (e.g. under
/// `flutter test`, which has no platform bindings registered), this falls
/// back to an in-memory store rather than throwing, so callers never need
/// their own try/catch around it.
Future<SaveStore> ludoDefaultSaveStore() async {
  try {
    // ignore: avoid_print
    print(
      'DBG12H: ludoDefaultSaveStore awaiting getApplicationSupportDirectory',
    );
    final supportDir = await getApplicationSupportDirectory();
    // ignore: avoid_print
    print('DBG12H: ludoDefaultSaveStore got supportDir $supportDir');
    return JsonFileSaveStore(root: Directory('${supportDir.path}/save'));
  } catch (_) {
    // ignore: avoid_print
    print('DBG12H: ludoDefaultSaveStore caught exception, falling back');
    return MemorySaveStore();
  }
}

/// Loads and saves a [LudoProfileSettings] through a [SaveStore], keyed by
/// this app's [AppContext] (identity + environment).
class LudoProfileStore {
  LudoProfileStore({required this.saveStore, required this.appContext});

  final SaveStore saveStore;
  final AppContext appContext;

  /// Builds the production store: [ludoDefaultSaveStore] plus [identity]'s
  /// runtime [AppContext]. Takes [identity] as a parameter (rather than
  /// importing `app.dart`'s `ludoIdentity` directly) so this file has no
  /// dependency edge back onto `app.dart`, which itself depends on this
  /// file.
  static Future<LudoProfileStore> production(AppIdentity identity) async {
    return LudoProfileStore(
      saveStore: await ludoDefaultSaveStore(),
      appContext: runtimeAppContext(identity: identity),
    );
  }

  /// Loads any previously-saved profile onto [settings]. A no-op (leaves
  /// [settings] at its constructor defaults) if nothing was saved yet, or
  /// if the saved envelope fails validation (corrupt/foreign save).
  Future<void> load(LudoProfileSettings settings) async {
    SaveEnvelope? envelope;
    try {
      envelope = await saveStore.read(appContext);
    } on SaveValidationException {
      envelope = null;
    }
    if (envelope == null) return;
    settings.applyJson(envelope.payload);
  }

  /// Persists [settings]'s current fields.
  Future<void> save(
    LudoProfileSettings settings, {
    DateTime Function() now = DateTime.now,
  }) async {
    final envelope = SaveEnvelope.create(
      context: appContext,
      schemaVersion: ludoProfileSchemaVersion,
      savedAt: now(),
      payload: settings.toJson(),
    );
    await saveStore.write(appContext, envelope);
  }
}
