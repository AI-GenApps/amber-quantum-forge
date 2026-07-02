import 'dart:async';

import 'ai_error.dart';
import 'ai_message.dart';
import 'ai_session.dart';
import 'networking/ai_network_client.dart';
import 'parsing/vercel_data_stream_parser.dart';

/// Mirrors `RemoteAISession.swift`: appends the user message, streams the
/// assistant reply via [AINetworkClient] + [VercelDataStreamParser], and
/// appends the completed assistant message once the stream finishes.
class RemoteAISession implements AISession {
  RemoteAISession({
    required Uri baseUrl,
    required Future<String?> Function() getAccessToken,
  }) : _networkClient = AINetworkClient(
         baseUrl: baseUrl,
         getAccessToken: getAccessToken,
       );

  final AINetworkClient _networkClient;
  final List<AIMessage> _messages = [];

  @override
  List<AIMessage> get messages => List.unmodifiable(_messages);

  @override
  Stream<String> send(String text) {
    final userMessage = AIMessage(role: AIRole.user, content: text);
    _messages.add(userMessage);
    final history = List<AIMessage>.from(_messages);

    late final StreamController<String> controller;
    controller = StreamController<String>(onListen: () async {
      final parser = VercelDataStreamParser();
      final assistantContent = StringBuffer();

      final sub = parser.events.listen((event) {
        switch (event) {
          case AITokenEvent(:final token):
            assistantContent.write(token);
            controller.add(token);
            break;
          case AIFinishEvent():
            break;
          case AIErrorEvent(:final error):
            controller.addError(error);
            break;
        }
      });

      try {
        await for (final line in _networkClient.streamChat(history)) {
          parser.parse(line);
        }
        if (assistantContent.isNotEmpty) {
          _messages.add(
            AIMessage(role: AIRole.assistant, content: assistantContent.toString()),
          );
        }
        await controller.close();
      } catch (error) {
        controller.addError(error is AIException ? error : AINetworkError(error));
        await controller.close();
      } finally {
        await sub.cancel();
        await parser.close();
      }
    });
    return controller.stream;
  }

  @override
  void clear() {
    _messages.clear();
  }
}
