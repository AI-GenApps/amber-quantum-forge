import 'package:platform_core/platform_core.dart';

import 'dart:async';

export 'merge_relay_fake_gateway.dart';

final class BlockingCompositeDelegate implements SaveStore {
  final MemorySaveStore _store = MemorySaveStore();
  final readStarted = Completer<void>();
  final release = Completer<void>();
  bool blockNextRead = false;

  void releaseRead() {
    if (!release.isCompleted) release.complete();
  }

  @override
  Future<SaveEnvelope?> read(AppContext context) async {
    if (blockNextRead) {
      blockNextRead = false;
      readStarted.complete();
      await release.future;
    }
    return _store.read(context);
  }

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) =>
      _store.write(context, envelope);

  @override
  Future<void> delete(AppContext context) => _store.delete(context);
}
