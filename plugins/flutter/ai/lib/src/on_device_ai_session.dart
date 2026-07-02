import 'ai_error.dart';
import 'ai_message.dart';
import 'ai_session.dart';

/// Mirrors `OnDeviceAISession.swift` — an unimplemented stub for a future
/// on-device model; always fails with a 501-equivalent error.
class OnDeviceAISession implements AISession {
  final List<AIMessage> _messages = [];

  @override
  List<AIMessage> get messages => List.unmodifiable(_messages);

  @override
  Stream<String> send(String text) {
    // ignore: avoid_print
    print('[starter_ai] OnDeviceAISession not implemented — falling back is recommended');
    return Stream<String>.error(const AIServerError(501));
  }

  @override
  void clear() {
    _messages.clear();
  }
}
