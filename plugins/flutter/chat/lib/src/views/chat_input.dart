import 'package:flutter/material.dart';

/// Mirrors `ChatInput.swift`: a text field + send button, disabled while
/// empty or while a send is already in flight.
class ChatInput extends StatefulWidget {
  const ChatInput({super.key, required this.onSend});

  final Future<void> Function(String text) onSend;

  @override
  State<ChatInput> createState() => _ChatInputState();
}

class _ChatInputState extends State<ChatInput> {
  final _controller = TextEditingController();
  bool _isSending = false;

  bool get _canSend => _controller.text.isNotEmpty && !_isSending;

  Future<void> _submit() async {
    if (!_canSend) return;
    final message = _controller.text;
    _controller.clear();
    setState(() => _isSending = true);
    await widget.onSend(message);
    if (mounted) setState(() => _isSending = false);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              minLines: 1,
              maxLines: 5,
              onChanged: (_) => setState(() {}),
              onSubmitted: (_) => _submit(),
              decoration: InputDecoration(
                hintText: 'Message',
                filled: true,
                fillColor: theme.colorScheme.surfaceContainerHighest,
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            iconSize: 32,
            onPressed: _canSend ? _submit : null,
            icon: Icon(
              Icons.arrow_circle_up,
              color: _canSend ? theme.colorScheme.primary : theme.colorScheme.outline,
            ),
            tooltip: 'Send message',
          ),
        ],
      ),
    );
  }
}
