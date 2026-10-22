import 'dart:convert';
import 'dart:io';

import '../network/merge_relay_events.dart';

final class MergeRelayOutboxEntry {
  const MergeRelayOutboxEntry({
    required this.request,
    required this.createdAt,
    this.attempts = 0,
    this.nextAttemptAt,
  });

  static MergeRelayOutboxEntry? tryParse(Object? raw) {
    if (raw is! Map) return null;
    try {
      final type = MergeRelayClientEventType.fromWireName(raw['type']);
      final key = raw['idempotency_key'];
      final created = raw['created_at'];
      final attempts = raw['attempts'];
      final next = raw['next_attempt_at'];
      final payload = raw['payload'];
      if (type == null ||
          key is! String ||
          created is! int ||
          attempts is! int ||
          payload is! Map) {
        return null;
      }
      return MergeRelayOutboxEntry(
        request: MergeRelayEventRequest(
          idempotencyKey: key,
          type: type,
          payload: payload.map((k, v) => MapEntry(k.toString(), v)),
          artifactId: raw['artifact_id'] as String?,
        ),
        createdAt: DateTime.fromMillisecondsSinceEpoch(created, isUtc: true),
        attempts: attempts,
        nextAttemptAt: next is int
            ? DateTime.fromMillisecondsSinceEpoch(next, isUtc: true)
            : null,
      );
    } on Object {
      return null;
    }
  }

  final MergeRelayEventRequest request;
  final DateTime createdAt;
  final int attempts;
  final DateTime? nextAttemptAt;

  MergeRelayOutboxEntry retried(int nextAttempts, DateTime next) =>
      MergeRelayOutboxEntry(
        request: request,
        createdAt: createdAt,
        attempts: nextAttempts,
        nextAttemptAt: next,
      );

  Map<String, Object?> toJson() => {
    ...request.toWireJson(),
    'created_at': createdAt.millisecondsSinceEpoch,
    'attempts': attempts,
    if (nextAttemptAt != null)
      'next_attempt_at': nextAttemptAt!.millisecondsSinceEpoch,
  };
}

abstract interface class MergeRelayOutboxStore {
  Future<List<MergeRelayOutboxEntry>> read();

  Future<void> write(List<MergeRelayOutboxEntry> entries);
}

final class MemoryMergeRelayOutboxStore implements MergeRelayOutboxStore {
  List<MergeRelayOutboxEntry> entries = [];

  @override
  Future<List<MergeRelayOutboxEntry>> read() async => List.of(entries);

  @override
  Future<void> write(List<MergeRelayOutboxEntry> next) async {
    entries = List.of(next);
  }
}

final class FileMergeRelayOutboxStore implements MergeRelayOutboxStore {
  FileMergeRelayOutboxStore(this.file);

  final File file;

  @override
  Future<List<MergeRelayOutboxEntry>> read() async {
    if (!await file.exists()) return [];
    try {
      final decoded = jsonDecode(await file.readAsString());
      if (decoded is! List) return [];
      return [for (final raw in decoded) ?MergeRelayOutboxEntry.tryParse(raw)];
    } on Object {
      return [];
    }
  }

  @override
  Future<void> write(List<MergeRelayOutboxEntry> entries) async {
    final temp = File('${file.path}.tmp');
    await temp.writeAsString(
      jsonEncode([for (final entry in entries) entry.toJson()]),
      flush: true,
    );
    await temp.rename(file.path);
  }
}
