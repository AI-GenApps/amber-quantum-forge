part of 'pocket_biome_app.dart';

mixin PocketBiomePersistence on FlameGame {
  AppContext get context;
  SaveStore get saveStore;
  Clock get clock;
  MemoryTelemetrySink get telemetrySink;
  ValueNotifier<BiomeState> get state;
  ValueNotifier<String?> get persistenceMessage;
  bool get isDisposed;

  Future<void> _write(SaveEnvelope envelope) async {
    try {
      await saveStore.write(context, envelope);
    } catch (_) {
      if (!isDisposed) {
        persistenceMessage.value = "Couldn't save the habitat.";
      }
    }
  }

  void _record(String action, String reason, {bool accepted = true}) {
    TelemetryRecorder(
      context: context,
      clock: clock,
      sink: telemetrySink,
    ).record(
      'biome_$action',
      fields: {
        'accepted': accepted,
        'reason': reason,
        'album_count': state.value.album.length,
      },
    );
  }
}
