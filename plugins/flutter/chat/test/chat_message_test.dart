import 'package:flutter_test/flutter_test.dart';
import 'package:starter_ai/starter_ai.dart';
import 'package:starter_chat/starter_chat.dart';

void main() {
  test('ChatMessage.fromAIMessage carries fields over', () {
    final aiMessage = AIMessage(role: AIRole.user, content: 'hi');
    final chatMessage = ChatMessage.fromAIMessage(aiMessage, sessionId: 's1');

    expect(chatMessage.id, aiMessage.id);
    expect(chatMessage.sessionId, 's1');
    expect(chatMessage.role, 'user');
    expect(chatMessage.content, 'hi');
    expect(chatMessage.syncedAt, isNull);
  });
}
