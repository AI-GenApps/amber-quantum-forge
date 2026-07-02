import 'package:starter_ai/starter_ai.dart';

/// Mirrors `ChatMessage.swift` (the SwiftData `@Model`). Here it is a plain
/// immutable value object; persistence is handled by `ChatStore`'s drift
/// table, which stores the same fields.
class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.sessionId,
    required this.role,
    required this.content,
    required this.createdAt,
    this.syncedAt,
  });

  final String id;
  final String sessionId;
  final String role;
  final String content;
  final DateTime createdAt;
  final DateTime? syncedAt;

  /// Mirrors `ChatMessage.init(from: AIMessage, sessionId:)`.
  factory ChatMessage.fromAIMessage(AIMessage message, {required String sessionId}) {
    return ChatMessage(
      id: message.id,
      sessionId: sessionId,
      role: message.role.wireValue,
      content: message.content,
      createdAt: message.createdAt,
    );
  }

  ChatMessage copyWith({DateTime? syncedAt}) => ChatMessage(
    id: id,
    sessionId: sessionId,
    role: role,
    content: content,
    createdAt: createdAt,
    syncedAt: syncedAt ?? this.syncedAt,
  );
}
