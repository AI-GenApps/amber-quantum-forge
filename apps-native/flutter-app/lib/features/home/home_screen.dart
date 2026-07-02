import 'package:flutter/material.dart';

// Chat UI is owned by the `starter_chat` package (plugins/flutter/chat).
// Import its `ChatView` widget once that package lands; until then this
// screen renders a placeholder so the app builds standalone.
// import 'package:starter_chat/starter_chat.dart';

/// Home shell. Mirrors
/// `apps-native/ios-app/Starter/Features/Home/HomeView.swift`, hosting
/// the AI chat surface (`starter_chat`'s `ChatView`).
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Starter')),
      // TODO: replace with `ChatView()` from package:starter_chat once
      // that package is available (see plugins/flutter/chat).
      body: const Center(child: Text('TODO')),
    );
  }
}
