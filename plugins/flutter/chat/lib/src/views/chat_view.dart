import 'package:flutter/material.dart';

import '../view_models/chat_view_model.dart';
import 'chat_input.dart';
import 'message_bubble.dart';

/// Mirrors `ChatView.swift`: a scrolling message list + input bar, backed
/// by a [ChatViewModel].
class ChatView extends StatefulWidget {
  const ChatView({super.key, required this.viewModel});

  final ChatViewModel viewModel;

  @override
  State<ChatView> createState() => _ChatViewState();
}

class _ChatViewState extends State<ChatView> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    widget.viewModel.addListener(_onModelChanged);
  }

  @override
  void dispose() {
    widget.viewModel.removeListener(_onModelChanged);
    _scrollController.dispose();
    super.dispose();
  }

  void _onModelChanged() {
    setState(() {});
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final messages = widget.viewModel.messages;
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: messages.length,
            itemBuilder: (context, index) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: MessageBubble(message: messages[index]),
            ),
          ),
        ),
        const Divider(height: 1),
        ChatInput(onSend: widget.viewModel.send),
      ],
    );
  }
}
