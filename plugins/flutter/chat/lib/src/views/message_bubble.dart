import 'package:flutter/material.dart';
import 'package:starter_ai/starter_ai.dart';

import 'typing_indicator.dart';

/// Mirrors `MessageBubble.swift`.
class MessageBubble extends StatelessWidget {
  const MessageBubble({super.key, required this.message});

  final AIMessage message;

  bool get isUser => message.role == AIRole.user;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isEmptyAssistant = message.content.isEmpty && message.role == AIRole.assistant;

    final bubble = Container(
      decoration: BoxDecoration(
        color: isUser ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
      ),
      padding: isEmptyAssistant
          ? EdgeInsets.zero
          : const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: isEmptyAssistant
          ? const TypingIndicator()
          : Text(
              message.content,
              style: TextStyle(
                color: isUser ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface,
              ),
            ),
    );

    return Row(
      mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
      children: [
        if (isUser) const SizedBox(width: 40),
        Flexible(child: bubble),
        if (!isUser) const SizedBox(width: 40),
      ],
    );
  }
}
