import 'package:flutter/foundation.dart';
import 'package:starter_ai/starter_ai.dart';

import '../models/chat_message.dart';
import '../store/chat_store.dart';

/// Mirrors `ChatViewModel.swift` (`@Observable` -> `ChangeNotifier`):
/// drives a single chat turn against an [AISession], mirrors the streamed
/// content into [messages], and persists both the user + assistant turns
/// via [ChatStore].
class ChatViewModel extends ChangeNotifier {
  ChatViewModel({
    required AISession session,
    required ChatStore store,
    String? sessionId,
  }) : _session = session,
       _store = store,
       sessionId = sessionId ?? DateTime.now().microsecondsSinceEpoch.toString();

  final AISession _session;
  final ChatStore _store;
  final String sessionId;

  final List<AIMessage> _messages = [];
  List<AIMessage> get messages => List.unmodifiable(_messages);

  bool isStreaming = false;
  AIException? error;

  Future<void> send(String text) async {
    final userMessage = AIMessage(role: AIRole.user, content: text);
    _messages.add(userMessage);
    await _store.insertMessage(ChatMessage.fromAIMessage(userMessage, sessionId: sessionId));

    var placeholder = AIMessage(role: AIRole.assistant, content: '');
    _messages.add(placeholder);
    isStreaming = true;
    error = null;
    notifyListeners();

    final buffer = StringBuffer();
    try {
      await for (final token in _session.send(text)) {
        buffer.write(token);
        placeholder = placeholder.copyWith(content: buffer.toString());
        _messages[_messages.length - 1] = placeholder;
        notifyListeners();
      }
      isStreaming = false;
      await _store.insertMessage(ChatMessage.fromAIMessage(placeholder, sessionId: sessionId));
      notifyListeners();
    } on AIException catch (err) {
      _messages.removeLast();
      error = err;
      isStreaming = false;
      notifyListeners();
    } catch (err) {
      _messages.removeLast();
      error = AINetworkError(err);
      isStreaming = false;
      notifyListeners();
    }
  }
}
