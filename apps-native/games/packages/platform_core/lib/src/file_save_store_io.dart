import 'dart:async';
import 'dart:io';
import 'dart:math';

import 'app_context.dart';
import 'save.dart';

/// A store instance must be the sole writer for its root directory.
final class JsonFileSaveStore implements SaveStore {
  JsonFileSaveStore({required Directory root}) : _root = root;

  final Directory _root;
  final Map<String, Future<void>> _queues = {};

  File _fileFor(AppContext context) {
    return File(
      '${_root.path}/${context.identity.saveNamespaceFor(context.environment)}.json',
    );
  }

  Future<T> _enqueue<T>(AppContext context, Future<T> Function() operation) {
    final key = context.identity.saveNamespaceFor(context.environment);
    final previous = _queues[key] ?? Future<void>.value();
    final result = previous.then<T>((_) => operation());
    late final Future<void> queued;
    queued = result.then<void>(
      (_) => _finishQueue(key, queued),
      onError: (Object _, StackTrace __) => _finishQueue(key, queued),
    );
    _queues[key] = queued;
    return result;
  }

  void _finishQueue(String key, Future<void> queued) {
    if (identical(_queues[key], queued)) _queues.remove(key);
  }

  @override
  Future<SaveEnvelope?> read(AppContext context) async {
    context.validate();
    return _enqueue(context, () async {
      final file = _fileFor(context);
      if (!await file.exists()) return null;
      if (await file.length() > maxSaveEnvelopeBytes) {
        throw const SaveValidationException('Save envelope exceeds size limit');
      }
      final envelope = SaveEnvelope.decode(await file.readAsString());
      envelope.validate(context);
      return envelope;
    });
  }

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {
    context.validate();
    envelope.validate(context);
    return _enqueue(context, () async {
      await _root.create(recursive: true);
      final file = _fileFor(context);
      final temporary = await _createTemporaryFile(file);
      try {
        await temporary.writeAsString(envelope.encode(), flush: true);
        await temporary.rename(file.path);
      } catch (_) {
        if (await temporary.exists()) await temporary.delete();
        rethrow;
      }
    });
  }

  @override
  Future<void> delete(AppContext context) async {
    context.validate();
    return _enqueue(context, () async {
      final file = _fileFor(context);
      if (await file.exists()) await file.delete();
    });
  }

  Future<File> _createTemporaryFile(File file) async {
    for (var attempt = 0; attempt < 16; attempt += 1) {
      final suffix =
          '${DateTime.now().microsecondsSinceEpoch}.${Random.secure().nextInt(0x7fffffff)}.$attempt';
      final temporary = File('${file.path}.$suffix.tmp');
      try {
        await temporary.create(exclusive: true);
        return temporary;
      } on FileSystemException {
        if (!await temporary.exists()) rethrow;
      }
    }
    throw const FileSystemException('Unable to allocate a unique save file');
  }
}
