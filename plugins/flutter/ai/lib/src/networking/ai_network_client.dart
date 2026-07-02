import 'dart:convert';

import 'package:http/http.dart' as http;

import '../ai_error.dart';
import '../ai_message.dart';

/// Posts a chat turn to `POST /api/ai/chat` and exposes the response body
/// as a line stream. Mirrors `AINetworkClient.swift`.
class AINetworkClient {
  AINetworkClient({
    required this.baseUrl,
    required this.getAccessToken,
    http.Client? httpClient,
  }) : _client = httpClient ?? http.Client();

  final Uri baseUrl;
  final Future<String?> Function() getAccessToken;
  final http.Client _client;

  Stream<String> streamChat(List<AIMessage> messages) async* {
    final token = await getAccessToken();
    if (token == null) throw const Unauthorized();

    final request = http.Request('POST', baseUrl.resolve('/api/ai/chat'));
    request.headers['Content-Type'] = 'application/json';
    request.headers['Authorization'] = 'Bearer $token';
    request.headers['Accept'] = 'text/event-stream';
    request.body = jsonEncode({
      'messages': messages.map((m) => _snakeCase(m.toJson())).toList(),
    });

    final streamedResponse = await _client.send(request);
    if (streamedResponse.statusCode < 200 || streamedResponse.statusCode >= 300) {
      throw AIServerError(streamedResponse.statusCode);
    }

    final lines = streamedResponse.stream
        .transform(utf8.decoder)
        .transform(const LineSplitter());

    await for (final line in lines) {
      if (line.isNotEmpty) yield line;
    }
  }

  /// Mirrors the Swift encoder's `.convertToSnakeCase` key strategy.
  Map<String, dynamic> _snakeCase(Map<String, dynamic> json) {
    final out = <String, dynamic>{};
    for (final entry in json.entries) {
      out[_toSnake(entry.key)] = entry.value;
    }
    return out;
  }

  String _toSnake(String key) {
    final buffer = StringBuffer();
    for (final rune in key.runes) {
      final char = String.fromCharCode(rune);
      if (char.toUpperCase() == char && char.toLowerCase() != char) {
        buffer.write('_${char.toLowerCase()}');
      } else {
        buffer.write(char);
      }
    }
    return buffer.toString();
  }
}
