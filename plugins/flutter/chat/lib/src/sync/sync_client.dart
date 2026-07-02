import 'dart:convert';

import 'package:starter_auth/starter_auth.dart';

import '../store/chat_store.dart';
import 'sync_models.dart';

/// Pushes locally-persisted, not-yet-synced messages to
/// `POST /api/chat/sync`. Mirrors `SyncClient.swift`.
class SyncClient {
  SyncClient({
    required this.baseUrl,
    required this.authManager,
    required this.store,
  });

  final Uri baseUrl;
  final AuthManager authManager;
  final ChatStore store;

  Future<void> syncPending() async {
    final pending = await store.pendingMessages();
    if (pending.isEmpty) return;

    final requestMessages = pending
        .map(
          (m) => SyncRequestMessage(
            id: m.id,
            sessionId: m.sessionId,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          ),
        )
        .toList();

    final response = await authManager.authorizedFetch(
      baseUrl.resolve('/api/chat/sync'),
      method: 'POST',
      body: {'messages': requestMessages.map((m) => m.toJson()).toList()},
    );

    // Mirrors the Swift client: decode to validate the shape, but the
    // sync outcome is driven by which messages we attempted, not the
    // server's per-message result.
    SyncResponse.fromJson(jsonDecode(response.body) as Map<String, dynamic>);

    final now = DateTime.now();
    await store.markSynced(pending.map((m) => m.id), now);
  }
}
