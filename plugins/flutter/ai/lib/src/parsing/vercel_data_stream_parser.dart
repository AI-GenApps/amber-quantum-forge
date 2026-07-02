import 'dart:convert';

import '../ai_error.dart';

/// Finish-event metadata, mirrors
/// `VercelDataStreamParser.FinishMetadata` / `UsageMetadata`.
class FinishMetadata {
  const FinishMetadata({required this.finishReason, this.usage});

  final String finishReason;
  final UsageMetadata? usage;

  factory FinishMetadata.fromJson(Map<String, dynamic> json) =>
      FinishMetadata(
        finishReason: json['finish_reason'] as String? ?? json['finishReason'] as String,
        usage: json['usage'] != null
            ? UsageMetadata.fromJson(json['usage'] as Map<String, dynamic>)
            : null,
      );
}

class UsageMetadata {
  const UsageMetadata({required this.promptTokens, required this.completionTokens});

  final int promptTokens;
  final int completionTokens;

  factory UsageMetadata.fromJson(Map<String, dynamic> json) => UsageMetadata(
    promptTokens: (json['prompt_tokens'] ?? json['promptTokens']) as int,
    completionTokens: (json['completion_tokens'] ?? json['completionTokens']) as int,
  );
}

/// Line-by-line parser for the Vercel AI SDK "data stream" protocol.
///
/// Direct port of `VercelDataStreamParser.swift`:
/// - `0:"<json-encoded-token-string>"` — a content token
/// - `d:{...}` — finish event with `finishReason`/`usage` (snake_case wire)
///
/// Unlike the Swift version (which uses callbacks), this exposes a single
/// [events] stream of [AIStreamEvent]s produced by feeding lines to [parse].
class VercelDataStreamParser {
  final _controller = StreamController<AIStreamEvent>.broadcast();

  Stream<AIStreamEvent> get events => _controller.stream;

  void parse(String line) {
    if (line.startsWith('0:')) {
      final raw = line.substring(2);
      try {
        final token = jsonDecode(raw) as String;
        _controller.add(AITokenEvent(token));
      } catch (_) {
        _controller.add(const AIErrorEvent(StreamParseError()));
      }
      return;
    }
    if (line.startsWith('d:')) {
      final raw = line.substring(2);
      try {
        final json = jsonDecode(raw) as Map<String, dynamic>;
        _controller.add(AIFinishEvent(FinishMetadata.fromJson(json)));
      } catch (_) {
        _controller.add(const AIErrorEvent(StreamParseError()));
      }
    }
    // Other prefixes (e.g. tool calls, errors) are intentionally ignored,
    // matching the Swift parser's scope.
  }

  Future<void> close() => _controller.close();
}

sealed class AIStreamEvent {
  const AIStreamEvent();
}

class AITokenEvent extends AIStreamEvent {
  const AITokenEvent(this.token);
  final String token;
}

class AIFinishEvent extends AIStreamEvent {
  const AIFinishEvent(this.metadata);
  final FinishMetadata metadata;
}

class AIErrorEvent extends AIStreamEvent {
  const AIErrorEvent(this.error);
  final AIException error;
}
