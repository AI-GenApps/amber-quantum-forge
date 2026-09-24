/// Local persistence for [LudoSoundSettings] and [ReducedMotionSetting]
/// (task 10).
///
/// Reuses the exact mechanism `ludo_profile_settings.dart` (task 07)
/// established for this app — `platform_core`'s [SaveStore]/[SaveEnvelope]
/// — rather than introducing a second persistence approach (e.g.
/// `shared_preferences`), per this task's Context/Decisions note. It shares
/// [ludoDefaultSaveStore]'s file-backed root but writes under its own
/// [AppIdentity] (`ludo_settings`, distinct from `ludo_profile_settings.dart`'s
/// `ludo` identity) so the two saves never collide on the same namespaced
/// file.
library;

import 'package:platform_core/platform_core.dart';

import 'ludo_profile_settings.dart' show ludoDefaultSaveStore;
import 'ludo_sound_settings.dart';
import 'reduced_motion_setting.dart';

/// Schema version for the payload [LudoSettingsStore] reads/writes.
const ludoSettingsSchemaVersion = 1;

/// The identity this store's saves are namespaced under. Constructed
/// directly (not via `appIdentityFor`, which only resolves ids known to the
/// generated game registry) since this is a sub-namespace of the `ludo` app
/// rather than a registry entry of its own.
final ludoSettingsIdentity = AppIdentity(
  stableId: 'ludo_settings',
  canonicalName: 'Ludo Settings',
  publicTitle: 'Ludo Settings',
  subtitle: 'Ludo Settings',
);

/// Loads and saves [LudoSoundSettings] + [ReducedMotionSetting] through a
/// [SaveStore].
class LudoSettingsStore {
  LudoSettingsStore({required this.saveStore, required this.appContext});

  final SaveStore saveStore;
  final AppContext appContext;

  /// Builds the production store: [ludoDefaultSaveStore] namespaced under
  /// [ludoSettingsIdentity].
  static Future<LudoSettingsStore> production() async {
    return LudoSettingsStore(
      saveStore: await ludoDefaultSaveStore(),
      appContext: runtimeAppContext(identity: ludoSettingsIdentity),
    );
  }

  /// Loads any previously-saved toggles onto [sound]/[reducedMotion]. A
  /// no-op if nothing was saved yet, or if the saved envelope fails
  /// validation (corrupt/foreign save).
  Future<void> load(
    LudoSoundSettings sound,
    ReducedMotionSetting reducedMotion,
  ) async {
    SaveEnvelope? envelope;
    try {
      envelope = await saveStore.read(appContext);
    } on SaveValidationException {
      envelope = null;
    }
    if (envelope == null) return;
    final payload = envelope.payload;
    final soundEnabled = payload['sound_enabled'];
    final musicEnabled = payload['music_enabled'];
    final vibrationEnabled = payload['vibration_enabled'];
    final reducedMotionEnabled = payload['reduced_motion_enabled'];
    if (soundEnabled is bool) sound.soundEnabled = soundEnabled;
    if (musicEnabled is bool) sound.musicEnabled = musicEnabled;
    if (vibrationEnabled is bool) sound.vibrationEnabled = vibrationEnabled;
    if (reducedMotionEnabled is bool) {
      reducedMotion.value = reducedMotionEnabled;
    }
  }

  /// Persists [sound]/[reducedMotion]'s current values.
  Future<void> save(
    LudoSoundSettings sound,
    ReducedMotionSetting reducedMotion, {
    DateTime Function() now = DateTime.now,
  }) async {
    final envelope = SaveEnvelope.create(
      context: appContext,
      schemaVersion: ludoSettingsSchemaVersion,
      savedAt: now(),
      payload: {
        'sound_enabled': sound.soundEnabled,
        'music_enabled': sound.musicEnabled,
        'vibration_enabled': sound.vibrationEnabled,
        'reduced_motion_enabled': reducedMotion.value,
      },
    );
    await saveStore.write(appContext, envelope);
  }
}
