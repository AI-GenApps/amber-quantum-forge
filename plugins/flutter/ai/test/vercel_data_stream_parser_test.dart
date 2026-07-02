import 'package:flutter_test/flutter_test.dart';
import 'package:starter_ai/starter_ai.dart';

void main() {
  test('parses a token line', () async {
    final parser = VercelDataStreamParser();
    final events = <AIStreamEvent>[];
    final sub = parser.events.listen(events.add);

    parser.parse('0:"hello"');
    await Future<void>.delayed(Duration.zero);

    expect(events, hasLength(1));
    expect((events.first as AITokenEvent).token, 'hello');
    await sub.cancel();
    await parser.close();
  });

  test('parses a finish line', () async {
    final parser = VercelDataStreamParser();
    final events = <AIStreamEvent>[];
    final sub = parser.events.listen(events.add);

    parser.parse('d:{"finish_reason":"stop","usage":{"prompt_tokens":1,"completion_tokens":2}}');
    await Future<void>.delayed(Duration.zero);

    expect(events, hasLength(1));
    final finish = (events.first as AIFinishEvent).metadata;
    expect(finish.finishReason, 'stop');
    expect(finish.usage?.promptTokens, 1);
    await sub.cancel();
    await parser.close();
  });
}
