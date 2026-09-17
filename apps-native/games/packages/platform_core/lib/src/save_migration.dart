import 'app_context.dart';
import 'save.dart';

enum SaveMigrationStatus {
  destinationPresent,
  destinationReadFailed,
  noLegacySave,
  sourceReadFailed,
  migrated,
  legacyFallback,
  sourceCleanupFailed,
}

final class SaveMigrationException implements Exception {
  const SaveMigrationException(this.message);

  final String message;

  @override
  String toString() => 'SaveMigrationException: $message';
}

final class SaveMigrationResult {
  const SaveMigrationResult({
    required this.store,
    required this.status,
    this.error,
  });

  final SaveStore store;
  final SaveMigrationStatus status;
  final Object? error;
}

Future<SaveMigrationResult> migrateSaveIfAbsent({
  required AppContext context,
  required SaveStore destination,
  required SaveStore source,
}) async {
  SaveEnvelope? current;
  Object? initialDestinationError;
  try {
    current = await destination.read(context);
  } catch (error) {
    initialDestinationError = error;
  }
  if (current != null) {
    return SaveMigrationResult(
      store: destination,
      status: SaveMigrationStatus.destinationPresent,
    );
  }

  SaveEnvelope? legacy;
  try {
    legacy = await source.read(context);
  } catch (error) {
    return SaveMigrationResult(
      store: destination,
      status: SaveMigrationStatus.sourceReadFailed,
      error: error,
    );
  }
  if (legacy == null) {
    return SaveMigrationResult(
      store: destination,
      status: initialDestinationError == null
          ? SaveMigrationStatus.noLegacySave
          : SaveMigrationStatus.destinationReadFailed,
      error: initialDestinationError,
    );
  }

  try {
    current = await destination.read(context);
  } catch (error) {
    return _fallbackResult(
      context: context,
      destination: destination,
      source: source,
      legacy: legacy,
      error: error,
    );
  }
  if (current != null) {
    return SaveMigrationResult(
      store: destination,
      status: SaveMigrationStatus.destinationPresent,
    );
  }

  try {
    await destination.write(context, legacy);
  } catch (error) {
    return _fallbackResult(
      context: context,
      destination: destination,
      source: source,
      legacy: legacy,
      error: error,
    );
  }

  SaveEnvelope? restored;
  try {
    restored = await destination.read(context);
  } catch (error) {
    return _fallbackResult(
      context: context,
      destination: destination,
      source: source,
      legacy: legacy,
      error: error,
    );
  }
  if (restored == null || !_matches(restored, legacy)) {
    return _fallbackResult(
      context: context,
      destination: destination,
      source: source,
      legacy: legacy,
      error: const SaveMigrationException(
        'Destination save readback did not match the legacy save',
      ),
    );
  }

  try {
    await source.delete(context);
  } catch (error) {
    return SaveMigrationResult(
      store: destination,
      status: SaveMigrationStatus.sourceCleanupFailed,
      error: error,
    );
  }
  return SaveMigrationResult(
    store: destination,
    status: SaveMigrationStatus.migrated,
  );
}

SaveMigrationResult _fallbackResult({
  required AppContext context,
  required SaveStore destination,
  required SaveStore source,
  required SaveEnvelope legacy,
  required Object error,
}) {
  return SaveMigrationResult(
    store: _LegacyFallbackSaveStore(
      context: context,
      destination: destination,
      source: source,
      legacy: legacy,
      fallbackOnReadError: true,
    ),
    status: SaveMigrationStatus.legacyFallback,
    error: error,
  );
}

final class _LegacyFallbackSaveStore implements SaveStore {
  _LegacyFallbackSaveStore({
    required AppContext context,
    required SaveStore destination,
    required SaveStore source,
    required SaveEnvelope legacy,
    required bool fallbackOnReadError,
  }) : _context = context,
       _destination = destination,
       _source = source,
       _legacy = legacy,
       _fallbackOnReadError = fallbackOnReadError;

  final AppContext _context;
  final SaveStore _destination;
  final SaveStore _source;
  final bool _fallbackOnReadError;
  SaveEnvelope? _legacy;

  @override
  Future<SaveEnvelope?> read(AppContext context) async {
    SaveEnvelope? current;
    try {
      current = await _destination.read(context);
    } catch (error) {
      if (!_fallbackOnReadError) rethrow;
      final legacy = _legacy;
      if (legacy == null || !_sameScope(context, _context)) rethrow;
      legacy.validate(context);
      return legacy.copyWith(payload: legacy.payload);
    }
    if (current != null) {
      if (_sameScope(context, _context)) _legacy = null;
      return current;
    }
    if (!_sameScope(context, _context)) return null;
    final legacy = _legacy;
    if (legacy == null) return null;
    legacy.validate(context);
    return legacy.copyWith(payload: legacy.payload);
  }

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {
    if (!_sameScope(context, _context)) {
      await _destination.write(context, envelope);
      return;
    }
    final legacy = _legacy;
    if (legacy != null) {
      final current = await _destination.read(context);
      if (current != null) {
        if (_matches(current, envelope)) {
          await _source.delete(context);
          _legacy = null;
          return;
        }
        throw const SaveMigrationException(
          'Destination contains a different save; migration was not retried',
        );
      }
    }
    await _destination.write(context, envelope);
    final restored = await _destination.read(context);
    if (restored == null || !_matches(restored, envelope)) {
      throw const SaveMigrationException(
        'Destination save write could not be verified',
      );
    }
    await _source.delete(context);
    _legacy = null;
  }

  @override
  Future<void> delete(AppContext context) async {
    if (!_sameScope(context, _context)) {
      await _destination.delete(context);
      return;
    }
    await _destination.delete(context);
    await _source.delete(context);
    _legacy = null;
  }
}

bool _sameScope(AppContext left, AppContext right) {
  return left.identity.stableId == right.identity.stableId &&
      left.environment == right.environment &&
      left.identity.saveNamespaceFor(left.environment) ==
          right.identity.saveNamespaceFor(right.environment);
}

bool _matches(SaveEnvelope restored, SaveEnvelope expected) {
  return restored.appId == expected.appId &&
      restored.environment == expected.environment &&
      restored.namespace == expected.namespace &&
      restored.schemaVersion == expected.schemaVersion &&
      restored.savedAt == expected.savedAt &&
      restored.checksum == expected.checksum;
}
