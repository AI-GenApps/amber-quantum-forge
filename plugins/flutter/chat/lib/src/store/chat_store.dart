import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import '../models/chat_message.dart';
import '../models/chat_session.dart';

part 'chat_store.g.dart';

/// Drift table for [ChatSession] rows. Mirrors the SwiftData `ChatSession`
/// model's persisted columns.
class ChatSessions extends Table {
  TextColumn get id => text()();
  TextColumn get title => text()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Drift table for [ChatMessage] rows. Mirrors the SwiftData `ChatMessage`
/// model's persisted columns, including the `syncedAt` marker used by
/// `SyncClient` to find pending rows.
class ChatMessages extends Table {
  TextColumn get id => text()();
  TextColumn get sessionId => text()();
  TextColumn get role => text()();
  TextColumn get content => text()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get syncedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Local persistence + query surface. Mirrors `ChatStore.swift`, which
/// wraps a SwiftData `ModelContainer`; here a drift `NativeDatabase`
/// plays the same role.
@DriftDatabase(tables: [ChatSessions, ChatMessages])
class ChatStore extends _$ChatStore {
  ChatStore([QueryExecutor? executor]) : super(executor ?? _openConnection());

  @override
  int get schemaVersion => 1;

  static QueryExecutor _openConnection() {
    return LazyDatabase(() async {
      final dir = await getApplicationDocumentsDirectory();
      final file = File(p.join(dir.path, 'starter_chat.sqlite'));
      return NativeDatabase.createInBackground(file);
    });
  }

  /// Mirrors `ChatStore.sessions(context:)`.
  Future<List<ChatSession>> sessions() async {
    final rows = await (select(
      chatSessions,
    )..orderBy([(t) => OrderingTerm(expression: t.updatedAt, mode: OrderingMode.desc)])).get();
    return rows.map(_toSessionModel).toList();
  }

  /// Mirrors `ChatStore.messages(for:context:)`.
  Future<List<ChatMessage>> messagesForSession(String sessionId) async {
    final rows = await (select(chatMessages)
          ..where((t) => t.sessionId.equals(sessionId))
          ..orderBy([(t) => OrderingTerm(expression: t.createdAt)]))
        .get();
    return rows.map(_toMessageModel).toList();
  }

  /// Messages not yet synced to the server, ordered oldest-first. Backs
  /// `SyncClient.syncPending`.
  Future<List<ChatMessage>> pendingMessages() async {
    final rows = await (select(chatMessages)
          ..where((t) => t.syncedAt.isNull())
          ..orderBy([(t) => OrderingTerm(expression: t.createdAt)]))
        .get();
    return rows.map(_toMessageModel).toList();
  }

  /// Mirrors `ChatStore.insert(_:context:)`.
  Future<void> insertMessage(ChatMessage message) {
    return into(chatMessages).insertOnConflictUpdate(
      ChatMessagesCompanion.insert(
        id: message.id,
        sessionId: message.sessionId,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
        syncedAt: Value(message.syncedAt),
      ),
    );
  }

  Future<void> upsertSession(ChatSession session) {
    return into(chatSessions).insertOnConflictUpdate(
      ChatSessionsCompanion.insert(
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      ),
    );
  }

  Future<void> markSynced(Iterable<String> messageIds, DateTime syncedAt) async {
    await batch((b) {
      for (final id in messageIds) {
        b.update(
          chatMessages,
          ChatMessagesCompanion(syncedAt: Value(syncedAt)),
          where: (t) => t.id.equals(id),
        );
      }
    });
  }

  ChatSession _toSessionModel(ChatSessionsData row) => ChatSession(
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  );

  ChatMessage _toMessageModel(ChatMessagesData row) => ChatMessage(
    id: row.id,
    sessionId: row.sessionId,
    role: row.role,
    content: row.content,
    createdAt: row.createdAt,
    syncedAt: row.syncedAt,
  );
}
