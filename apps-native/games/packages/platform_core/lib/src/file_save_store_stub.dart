import 'app_context.dart';
import 'save.dart';

final class JsonFileSaveStore implements SaveStore {
  JsonFileSaveStore({required Object root});

  @override
  Future<SaveEnvelope?> read(AppContext context) {
    return Future.error(
      UnsupportedError('JsonFileSaveStore requires a native file system'),
    );
  }

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) {
    return Future.error(
      UnsupportedError('JsonFileSaveStore requires a native file system'),
    );
  }

  @override
  Future<void> delete(AppContext context) {
    return Future.error(
      UnsupportedError('JsonFileSaveStore requires a native file system'),
    );
  }
}
