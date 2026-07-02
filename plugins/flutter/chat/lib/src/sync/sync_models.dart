/// Mirrors `SyncModels.swift`.
class SyncRequestMessage {
  const SyncRequestMessage({
    required this.id,
    required this.sessionId,
    required this.role,
    required this.content,
    required this.createdAt,
  });

  final String id;
  final String sessionId;
  final String role;
  final String content;
  final DateTime createdAt;

  Map<String, dynamic> toJson() => {
    'id': id,
    'sessionId': sessionId,
    'role': role,
    'content': content,
    'createdAt': createdAt.toUtc().toIso8601String(),
  };
}

class SyncResponse {
  const SyncResponse({required this.synced, required this.skipped});

  final int synced;
  final int skipped;

  factory SyncResponse.fromJson(Map<String, dynamic> json) => SyncResponse(
    synced: json['synced'] as int,
    skipped: json['skipped'] as int,
  );
}
