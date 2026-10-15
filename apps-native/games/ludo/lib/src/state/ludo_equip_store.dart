/// Local persistence for the equipped dice/token/board theme ids (task
/// 26g).
///
/// Equipping is not a spend, so it never touches the server: it reuses the
/// exact `platform_core` [SaveStore]/[SaveEnvelope] mechanism tasks 07/10/11
/// established, under its own [AppIdentity] namespace so it never collides
/// with the profile or settings saves.
library;

import 'package:platform_core/platform_core.dart';

import 'ludo_profile_settings.dart' show ludoDefaultSaveStore;

const ludoEquipSchemaVersion = 1;

final ludoEquipIdentity = AppIdentity(
  stableId: 'ludo_equipped',
  canonicalName: 'Ludo Equipped Themes',
  publicTitle: 'Ludo Equipped Themes',
  subtitle: 'Ludo Equipped Themes',
);

/// The three equippable theme categories, in store-tab order. [wire] is the
/// `item_type` string the server uses.
enum LudoThemeCategory {
  dice('dice', 'Dice'),
  token('token', 'Tokens'),
  board('board', 'Boards');

  const LudoThemeCategory(this.wire, this.label);

  final String wire;
  final String label;

  static LudoThemeCategory? fromWire(String value) {
    for (final category in values) {
      if (category.wire == value) return category;
    }
    return null;
  }
}

/// Loads and saves the equipped item id per [LudoThemeCategory].
class LudoEquipStore {
  LudoEquipStore({required this.saveStore, required this.appContext});

  final SaveStore saveStore;
  final AppContext appContext;

  static Future<LudoEquipStore> production() async {
    return LudoEquipStore(
      saveStore: await ludoDefaultSaveStore(),
      appContext: runtimeAppContext(identity: ludoEquipIdentity),
    );
  }

  /// The previously saved selection, or an empty map when nothing was saved
  /// or the saved envelope fails validation.
  Future<Map<LudoThemeCategory, String>> load() async {
    SaveEnvelope? envelope;
    try {
      envelope = await saveStore.read(appContext);
    } on Object {
      envelope = null;
    }
    if (envelope == null) return const {};
    final result = <LudoThemeCategory, String>{};
    for (final category in LudoThemeCategory.values) {
      final value = envelope.payload['equipped_${category.wire}'];
      if (value is String && value.isNotEmpty) result[category] = value;
    }
    return result;
  }

  Future<void> save(
    Map<LudoThemeCategory, String> equipped, {
    DateTime Function() now = DateTime.now,
  }) async {
    final envelope = SaveEnvelope.create(
      context: appContext,
      schemaVersion: ludoEquipSchemaVersion,
      savedAt: now(),
      payload: {
        for (final entry in equipped.entries)
          'equipped_${entry.key.wire}': entry.value,
      },
    );
    await saveStore.write(appContext, envelope);
  }
}
