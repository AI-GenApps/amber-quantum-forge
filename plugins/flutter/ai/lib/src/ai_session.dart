import 'ai_message.dart';

/// Mirrors `AISession.swift` — a chat session that can stream assistant
/// tokens for a user turn.
abstract class AISession {
  List<AIMessage> get messages;

  /// Sends [text] as a new user message and returns a stream of assistant
  /// tokens as they arrive.
  Stream<String> send(String text);

  void clear();
}
